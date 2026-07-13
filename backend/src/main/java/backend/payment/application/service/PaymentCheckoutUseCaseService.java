package backend.payment.application.service;

import backend.config.SePayProperties;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.PaymentMethod;
import backend.entity.PaymentProvider;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.exception.ResourceNotFoundException;
import backend.payment.application.model.PaymentSessionResult;
import backend.payment.application.model.PaymentTransactionDetail;
import backend.payment.application.model.SePayCheckoutForm;
import backend.payment.application.port.out.FindSePayIncomingPaymentPort;
import backend.payment.application.port.out.model.SePayIncomingPayment;
import backend.payment.application.port.out.model.SePayIncomingPaymentQuery;
import backend.repository.BookingRepository;
import backend.repository.PaymentTransactionRepository;
import backend.service.CouponUsageTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentCheckoutUseCaseService {

    private final BookingRepository bookingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final SePayProperties sePayProperties;
    private final FindSePayIncomingPaymentPort findSePayIncomingPaymentPort;
    private final CouponUsageTrackingService couponUsageTrackingService;

    @Value("${app.booking.payment-expiration-seconds:300}")
    private long paymentExpirationSeconds;

    private static final BigDecimal DEPOSIT_AMOUNT = new BigDecimal("50000");
    private static final List<String> SEPAY_SIGNED_FIELD_NAMES = List.of(
            "merchant",
            "env",
            "operation",
            "payment_method",
            "order_amount",
            "currency",
            "order_invoice_number",
            "order_description",
            "customer_id",
            "agreement_id",
            "agreement_name",
            "agreement_type",
            "agreement_payment_frequency",
            "agreement_amount_per_payment",
            "success_url",
            "error_url",
            "cancel_url",
            "order_id"
    );

    @Transactional
    public PaymentSessionResult createPaymentSession(
            Integer bookingId,
            String rawMethod,
            String rawPaymentOption,
            String customerEmail
    ) {
        if (bookingId == null) {
            throw new IllegalArgumentException("bookingId khong duoc de trong");
        }

        CheckoutMethod checkoutMethod = normalizeMethod(rawMethod);
        PaymentOption paymentOption = normalizePaymentOption(rawPaymentOption);
        Booking booking = bookingRepository.findByIdAndCustomer_Account_Email(bookingId, customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Khong the thanh toan don dat phong da bi huy");
        }

        if (booking.getStatus() == BookingStatus.DEPOSIT_PAID
                || booking.getStatus() == BookingStatus.PAID
                || booking.getStatus() == BookingStatus.CHECKED_IN
                || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new IllegalStateException("Don dat phong nay da duoc thanh toan");
        }

        validateMethodForPaymentOption(checkoutMethod, paymentOption);
        closeExistingOpenTransactions(booking.getId());

        String paymentId = generatePaymentId();
        PaymentMethod selectedPaymentMethod = PaymentMethod.ONLINE;
        PaymentTransactionStatus transactionStatus = PaymentTransactionStatus.PENDING;
        BigDecimal paymentAmount = resolvePaymentAmount(booking, paymentOption);

        PaymentTransaction paymentTransaction = PaymentTransaction.builder()
                .booking(booking)
                .provider(PaymentProvider.SEPAY)
                .transactionReference(paymentId)
                .providerTransactionId(null)
                .amount(paymentAmount)
                .status(transactionStatus)
                .responseCode("PENDING")
                .paidAt(null)
                .build();

        paymentTransactionRepository.save(paymentTransaction);

        boolean bookingChanged = booking.getPaymentMethod() != selectedPaymentMethod
                || booking.getStatus() != BookingStatus.PENDING_PAYMENT;
        if (booking.getPaymentMethod() != selectedPaymentMethod) {
            booking.setPaymentMethod(selectedPaymentMethod);
        }

        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            booking.setStatus(BookingStatus.PENDING_PAYMENT);
        }

        if (bookingChanged) {
            bookingRepository.save(booking);
        }

        return new PaymentSessionResult(
                paymentId,
                booking.getId(),
                booking.getBookingCode(),
                checkoutMethod.apiValue,
                paymentOption.apiValue,
                mapStatus(paymentTransaction.getStatus(), booking),
                paymentTransaction.getAmount(),
                buildVietQrUrl(paymentId, paymentTransaction.getAmount()),
                paymentTransaction.getCreatedAt(),
                resolveExpiresAt(paymentTransaction.getCreatedAt()),
                paymentTransaction.getPaidAt()
        );
    }

    @Transactional
    public PaymentTransactionDetail getPaymentTransactionDetail(String paymentId, String customerEmail) {
        if (paymentId == null || paymentId.trim().isBlank()) {
            throw new IllegalArgumentException("paymentId khong duoc de trong");
        }

        PaymentTransaction paymentTransaction = paymentTransactionRepository
                .findByTransactionReferenceAndBooking_Customer_Account_Email(paymentId.trim(), customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay giao dich thanh toan"));

        syncSePayTransaction(paymentTransaction);
        return toPaymentTransactionDetail(paymentTransaction);
    }

    public SePayCheckoutForm getSePayCheckoutForm(String paymentId, String customerEmail) {
        if (paymentId == null || paymentId.trim().isBlank()) {
            throw new IllegalArgumentException("paymentId khong duoc de trong");
        }

        PaymentTransaction paymentTransaction = paymentTransactionRepository
                .findByTransactionReferenceAndBooking_Customer_Account_Email(paymentId.trim(), customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay giao dich thanh toan"));

        if (paymentTransaction.getProvider() != PaymentProvider.SEPAY) {
            throw new IllegalStateException("Giao dich nay khong phai cua SePay");
        }

        String checkoutUrl = blankToNull(sePayProperties.getCheckoutUrl());
        if (checkoutUrl == null) {
            throw new IllegalStateException("Chua cau hinh portal checkout SePay");
        }

        return new SePayCheckoutForm(
                checkoutUrl,
                buildSePayPortalFields(
                        paymentTransaction.getTransactionReference(),
                        paymentTransaction.getBooking(),
                        resolvePaymentOption(paymentTransaction),
                        paymentTransaction.getAmount()
                )
        );
    }

    private CheckoutMethod normalizeMethod(String rawMethod) {
        if (rawMethod == null || rawMethod.trim().isBlank()) {
            throw new IllegalArgumentException("Phuong thuc thanh toan khong duoc de trong");
        }

        String normalized = rawMethod.trim().toLowerCase();
        for (CheckoutMethod value : CheckoutMethod.values()) {
            if (value.apiValue.equals(normalized)) {
                return value;
            }
        }

        throw new IllegalArgumentException("Phuong thuc thanh toan khong hop le");
    }

    private BigDecimal resolveAmount(Booking booking) {
        return booking.getTotalAmount() == null ? BigDecimal.ZERO : booking.getTotalAmount();
    }

    private BigDecimal resolvePaymentAmount(Booking booking, PaymentOption paymentOption) {
        if (paymentOption == PaymentOption.DEPOSIT) {
            return resolveAmount(booking).min(DEPOSIT_AMOUNT);
        }

        return resolveAmount(booking);
    }

    private PaymentOption normalizePaymentOption(String rawPaymentOption) {
        if (rawPaymentOption == null || rawPaymentOption.trim().isBlank()) {
            return PaymentOption.FULL;
        }

        String normalized = rawPaymentOption.trim().toLowerCase();
        for (PaymentOption value : PaymentOption.values()) {
            if (value.apiValue.equals(normalized)) {
                return value;
            }
        }

        throw new IllegalArgumentException("Lua chon thanh toan khong hop le");
    }

    private void validateMethodForPaymentOption(CheckoutMethod checkoutMethod, PaymentOption paymentOption) {
        if (checkoutMethod == CheckoutMethod.CASH) {
            throw new IllegalArgumentException("Thanh toan tai quay khong duoc ho tro, vui long thanh toan online qua SePay");
        }
    }

    private void closeExistingOpenTransactions(Integer bookingId) {
        List<PaymentTransaction> openTransactions = paymentTransactionRepository.findByBooking_IdAndStatusIn(
                bookingId,
                List.of(PaymentTransactionStatus.INITIALIZED, PaymentTransactionStatus.PENDING)
        );

        if (openTransactions.isEmpty()) {
            return;
        }

        openTransactions.forEach(transaction -> {
            transaction.setStatus(PaymentTransactionStatus.CANCELLED);
            transaction.setResponseCode("PAYMENT_SESSION_REPLACED");
        });
        paymentTransactionRepository.saveAll(openTransactions);
    }

    private String generatePaymentId() {
        return "PAY" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private String buildVietQrUrl(String paymentId, BigDecimal amount) {
        String bankAccount = blankToNull(sePayProperties.getQrBankAccount());
        String bankCode = blankToNull(sePayProperties.getQrBankCode());
        if (bankAccount == null || bankCode == null) {
            throw new IllegalStateException("Chua cau hinh thong tin QR thanh toan SePay");
        }

        StringBuilder url = new StringBuilder("https://vietqr.app/img");
        url.append("?acc=").append(encode(bankAccount));
        url.append("&bank=").append(encode(bankCode));
        url.append("&amount=").append(encode(toVndInteger(amount)));
        url.append("&des=").append(encode(paymentId));

        String template = blankToNull(sePayProperties.getQrTemplate());
        if (template != null) {
            url.append("&template=").append(encode(template));
        }

        return url.toString();
    }

    private void syncSePayTransaction(PaymentTransaction transaction) {
        if (transaction.getProvider() != PaymentProvider.SEPAY
                || transaction.getStatus() == PaymentTransactionStatus.SUCCEEDED
                || transaction.getStatus() == PaymentTransactionStatus.FAILED
                || transaction.getStatus() == PaymentTransactionStatus.CANCELLED) {
            return;
        }

        LocalDateTime expiresAt = resolveExpiresAt(transaction.getCreatedAt());
        SePayIncomingPaymentQuery query = new SePayIncomingPaymentQuery(
                transaction.getTransactionReference(),
                transaction.getAmount(),
                transaction.getCreatedAt() == null ? LocalDateTime.now().toLocalDate() : transaction.getCreatedAt().toLocalDate(),
                LocalDateTime.now().toLocalDate(),
                transaction.getCreatedAt()
        );

        findSePayIncomingPaymentPort.findIncomingPayment(query)
                .ifPresentOrElse(
                        payment -> confirmSePayPayment(transaction, payment, expiresAt),
                        () -> timeoutTransactionIfExpired(transaction, expiresAt)
                );
    }

    private void confirmSePayPayment(
            PaymentTransaction transaction,
            SePayIncomingPayment payment,
            LocalDateTime expiresAt
    ) {
        if (expiresAt != null && payment.transactionDate() != null && payment.transactionDate().isAfter(expiresAt)) {
            timeoutTransactionIfExpired(transaction, expiresAt);
            return;
        }

        String providerTransactionId = blankToNull(payment.providerTransactionId());
        if (providerTransactionId != null) {
            Optional<PaymentTransaction> existingTransaction =
                    paymentTransactionRepository.findByProviderTransactionId(providerTransactionId);
            if (existingTransaction.isPresent()
                    && !existingTransaction.get().getTransactionReference().equals(transaction.getTransactionReference())) {
                return;
            }
        }

        transaction.setProviderTransactionId(providerTransactionId);
        transaction.setResponseCode("SEPAY_API_SUCCESS");
        transaction.setStatus(PaymentTransactionStatus.SUCCEEDED);
        transaction.setPaidAt(payment.transactionDate() == null ? LocalDateTime.now() : payment.transactionDate());

        Booking booking = transaction.getBooking();
        if (booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            booking.setStatus(resolveSuccessfulBookingStatus(transaction));
            bookingRepository.save(booking);
        }

        couponUsageTrackingService.recordPaidBookingUsage(booking);
        paymentTransactionRepository.save(transaction);
    }

    private void timeoutTransactionIfExpired(PaymentTransaction transaction, LocalDateTime expiresAt) {
        if (expiresAt == null || LocalDateTime.now().isBefore(expiresAt)) {
            return;
        }

        transaction.setStatus(PaymentTransactionStatus.CANCELLED);
        transaction.setResponseCode("PAYMENT_TIMEOUT");

        Booking booking = transaction.getBooking();
        if (booking != null && booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            booking.setStatus(BookingStatus.CANCELLED);
            bookingRepository.save(booking);
        }

        paymentTransactionRepository.save(transaction);
    }

    private BookingStatus resolveSuccessfulBookingStatus(PaymentTransaction transaction) {
        Booking booking = transaction.getBooking();
        BigDecimal totalAmount = booking == null ? null : booking.getTotalAmount();
        BigDecimal paidAmount = transaction.getAmount();
        if (totalAmount != null && paidAmount != null
                && paidAmount.compareTo(totalAmount.setScale(2, RoundingMode.HALF_UP)) < 0) {
            return BookingStatus.DEPOSIT_PAID;
        }

        return BookingStatus.PAID;
    }

    private Map<String, String> buildSePayPortalFields(
            String paymentId,
            Booking booking,
            PaymentOption paymentOption,
            BigDecimal amount
    ) {
        Map<String, String> fields = new LinkedHashMap<>();
        putIfPresent(fields, "operation", resolveOperation());
        putIfPresent(fields, "payment_method", resolveSePayPaymentMethod());
        fields.put("order_invoice_number", paymentId);
        fields.put("order_amount", toVndInteger(amount));
        fields.put("currency", resolveCurrency());
        fields.put("order_description", paymentId);
        putIfPresent(fields, "customer_id", resolveCustomerId(booking));
        putIfPresent(fields, "success_url", resolveReturnUrl(sePayProperties.getSuccessUrl(), paymentId, booking, paymentOption, amount, "success"));
        putIfPresent(fields, "error_url", resolveReturnUrl(sePayProperties.getErrorUrl(), paymentId, booking, paymentOption, amount, "failed"));
        putIfPresent(fields, "cancel_url", resolveReturnUrl(sePayProperties.getCancelUrl(), paymentId, booking, paymentOption, amount, "cancelled"));

        String merchantId = blankToNull(sePayProperties.getMerchantId());
        if (merchantId == null) {
            throw new IllegalStateException("Chua cau hinh merchant SePay");
        }

        fields.put("merchant", merchantId);
        fields.put("signature", createSePayPortalSignature(fields));
        return fields;
    }

    private String resolveCurrency() {
        String currency = blankToNull(sePayProperties.getCurrency());
        return currency == null ? "VND" : currency;
    }

    private String resolveOperation() {
        String operation = blankToNull(sePayProperties.getOperation());
        return operation == null ? "PURCHASE" : operation;
    }

    private String resolveSePayPaymentMethod() {
        String method = blankToNull(sePayProperties.getMethod());
        return method == null ? "BANK_TRANSFER" : method;
    }

    private String resolveCustomerId(Booking booking) {
        if (booking == null || booking.getCustomer() == null || booking.getCustomer().getId() == null) {
            return null;
        }

        return String.valueOf(booking.getCustomer().getId());
    }

    private String resolveReturnUrl(
            String configuredUrl,
            String paymentId,
            Booking booking,
            PaymentOption paymentOption,
            BigDecimal amount,
            String status
    ) {
        String normalized = blankToNull(configuredUrl);
        if (normalized == null) {
            return null;
        }

        String returnUrl = normalized
                .replace("{paymentId}", encode(paymentId))
                .replace("{bookingCode}", encode(booking.getBookingCode()))
                .replace("{bookingId}", encode(String.valueOf(booking.getId())))
                .replace("{amount}", encode(amount.stripTrailingZeros().toPlainString()))
                .replace("{paymentOption}", encode(paymentOption.apiValue))
                .replace("{status}", encode(status));

        if (returnUrl.contains("{")) {
            return returnUrl;
        }

        URI uri = URI.create(returnUrl);
        if (uri.getQuery() != null) {
            return returnUrl;
        }

        return returnUrl
                + "?paymentId=" + encode(paymentId)
                + "&bookingId=" + encode(booking.getBookingCode())
                + "&backendBookingId=" + encode(String.valueOf(booking.getId()))
                + "&method=bank_transfer"
                + "&paymentOption=" + encode(paymentOption.apiValue)
                + "&amount=" + encode(amount.stripTrailingZeros().toPlainString())
                + "&status=" + encode(status);
    }

    private void putIfPresent(Map<String, String> params, String key, String value) {
        String normalized = blankToNull(value);
        if (normalized != null) {
            params.put(key, normalized);
        }
    }

    private String createSePayPortalSignature(Map<String, String> fields) {
        String secretKey = blankToNull(sePayProperties.getSecretKey());
        if (secretKey == null) {
            throw new IllegalStateException("Chua cau hinh secret key SePay");
        }

        StringBuilder data = new StringBuilder();
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            if (!SEPAY_SIGNED_FIELD_NAMES.contains(entry.getKey())) {
                continue;
            }

            if (!data.isEmpty()) {
                data.append(',');
            }
            data.append(entry.getKey()).append('=').append(entry.getValue());
        }

        try {
            Mac hmac256 = Mac.getInstance("HmacSHA256");
            hmac256.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] bytes = hmac256.doFinal(data.toString().getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(bytes);
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot create SePay portal signature", exception);
        }
    }

    private String toVndInteger(BigDecimal amount) {
        return amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private LocalDateTime resolveExpiresAt(LocalDateTime createdAt) {
        if (createdAt == null || paymentExpirationSeconds <= 0) {
            return null;
        }

        return createdAt.plusSeconds(paymentExpirationSeconds);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String mapStatus(PaymentTransactionStatus status, Booking booking) {
        if ((status == PaymentTransactionStatus.PENDING || status == PaymentTransactionStatus.INITIALIZED)
                && booking != null
                && booking.getStatus() == BookingStatus.CANCELLED) {
            return "cancelled";
        }

        return switch (status) {
            case SUCCEEDED -> "success";
            case PENDING, INITIALIZED -> "pending";
            case FAILED -> "failed";
            case CANCELLED -> "cancelled";
        };
    }

    private String mapMethod(PaymentProvider provider) {
        return provider == PaymentProvider.COUNTER ? "cash" : "bank_transfer";
    }

    private PaymentTransactionDetail toPaymentTransactionDetail(PaymentTransaction paymentTransaction) {
        return new PaymentTransactionDetail(
                paymentTransaction.getTransactionReference(),
                paymentTransaction.getBooking().getId(),
                paymentTransaction.getBooking().getBookingCode(),
                mapMethod(paymentTransaction.getProvider()),
                resolvePaymentOption(paymentTransaction).apiValue,
                mapStatus(paymentTransaction.getStatus(), paymentTransaction.getBooking()),
                paymentTransaction.getAmount(),
                paymentTransaction.getCreatedAt(),
                resolveExpiresAt(paymentTransaction.getCreatedAt()),
                paymentTransaction.getPaidAt()
        );
    }

    private PaymentOption resolvePaymentOption(PaymentTransaction transaction) {
        BigDecimal bookingAmount = resolveAmount(transaction.getBooking());
        if (transaction.getAmount() != null && transaction.getAmount().compareTo(bookingAmount) < 0) {
            return PaymentOption.DEPOSIT;
        }

        return PaymentOption.FULL;
    }

    private String blankToNull(String value) {
        return value == null || value.trim().isBlank() ? null : value.trim();
    }

    private enum CheckoutMethod {
        BANK_TRANSFER("bank_transfer"),
        E_WALLET("e_wallet"),
        CASH("cash");

        private final String apiValue;

        CheckoutMethod(String apiValue) {
            this.apiValue = apiValue;
        }
    }

    private enum PaymentOption {
        DEPOSIT("deposit"),
        FULL("full");

        private final String apiValue;

        PaymentOption(String apiValue) {
            this.apiValue = apiValue;
        }
    }
}
