package backend.service.impl;

import backend.config.SePayProperties;
import backend.config.VNPayProperties;
import backend.dto.response.VNPayIpnResponse;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.PaymentProvider;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.repository.PaymentTransactionRepository;
import backend.service.CouponUsageTrackingService;
import backend.service.PaymentWebhookService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class PaymentWebhookServiceImpl implements PaymentWebhookService {

    private static final String SUCCESS_CODE = "00";
    private static final String ORDER_NOT_FOUND_CODE = "01";
    private static final String ORDER_ALREADY_CONFIRMED_CODE = "02";
    private static final String INVALID_AMOUNT_CODE = "04";
    private static final String INVALID_SIGNATURE_CODE = "97";
    private static final String UNKNOWN_ERROR_CODE = "99";
    private static final Pattern SEPAY_PAYMENT_REFERENCE_PATTERN = Pattern.compile("PAY-?[A-Z0-9]{16}");
    private static final DateTimeFormatter VNPAY_DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final DateTimeFormatter SEPAY_DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final TypeReference<Map<String, Object>> WEBHOOK_PAYLOAD_TYPE = new TypeReference<>() {
    };

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final VNPayProperties vnPayProperties;
    private final SePayProperties sePayProperties;
    private final CouponUsageTrackingService couponUsageTrackingService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public VNPayIpnResponse handleVNPayIpn(Map<String, String> params) {
        try {
            if (!isValidSignature(params)) {
                return response(INVALID_SIGNATURE_CODE, "Invalid signature");
            }

            String transactionReference = params.get("vnp_TxnRef");
            PaymentTransaction transaction = paymentTransactionRepository
                    .findByTransactionReference(transactionReference)
                    .orElse(null);

            if (transaction == null) {
                return response(ORDER_NOT_FOUND_CODE, "Order not found");
            }

            if (!isValidAmount(params.get("vnp_Amount"), transaction.getAmount())) {
                return response(INVALID_AMOUNT_CODE, "Invalid amount");
            }

            if (transaction.getStatus() == PaymentTransactionStatus.SUCCEEDED
                    || transaction.getStatus() == PaymentTransactionStatus.FAILED
                    || transaction.getStatus() == PaymentTransactionStatus.CANCELLED) {
                return response(ORDER_ALREADY_CONFIRMED_CODE, "Order already confirmed");
            }

            boolean paymentSuccess = SUCCESS_CODE.equals(params.get("vnp_ResponseCode"))
                    && SUCCESS_CODE.equals(params.get("vnp_TransactionStatus"));

            transaction.setProviderTransactionId(blankToNull(params.get("vnp_TransactionNo")));
            transaction.setResponseCode(params.get("vnp_ResponseCode"));
            transaction.setStatus(paymentSuccess
                    ? PaymentTransactionStatus.SUCCEEDED
                    : PaymentTransactionStatus.FAILED);
            transaction.setPaidAt(paymentSuccess ? parsePayDate(params.get("vnp_PayDate")) : null);

            Booking booking = transaction.getBooking();
            if (booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
                booking.setStatus(paymentSuccess ? resolveSuccessfulBookingStatus(transaction) : BookingStatus.CANCELLED);
            }

            if (paymentSuccess) {
                couponUsageTrackingService.recordPaidBookingUsage(booking);
            }

            paymentTransactionRepository.save(transaction);

            return response(SUCCESS_CODE, "Confirm success");
        } catch (Exception exception) {
            return response(UNKNOWN_ERROR_CODE, "Unknown error");
        }
    }

    @Override
    @Transactional
    public Map<String, Object> handleSepayWebhook(
            String rawBody,
            String authorizationHeader,
            String signatureHeader,
            String timestampHeader,
            String secretKeyHeader
    ) {
        if (!isSepayRequestAuthorized(rawBody, authorizationHeader, signatureHeader, timestampHeader, secretKeyHeader)) {
            return Map.of("success", false, "message", "Unauthorized webhook request");
        }

        Map<String, Object> payload;
        try {
            payload = parseSepayPayload(rawBody);
        } catch (IllegalArgumentException exception) {
            return Map.of("success", false, "message", "Invalid webhook payload");
        }

        if (isPaymentGatewayNotification(payload)) {
            return handleSepayGatewayNotification(payload);
        }

        String providerTransactionId = firstText(payload, "id", "transactionId", "referenceCode");
        if (isAlreadyProcessed(providerTransactionId)) {
            return Map.of("success", true, "message", "Transaction already confirmed");
        }

        String transactionReference = extractSepayReference(payload);
        if (isBlank(transactionReference)) {
            return Map.of("success", true, "message", "No matching payment reference");
        }

        PaymentTransaction transaction = paymentTransactionRepository
                .findByTransactionReference(transactionReference)
                .orElse(null);

        if (transaction == null) {
            return Map.of("success", true, "message", "Transaction not found");
        }

        if (transaction.getProvider() != PaymentProvider.SEPAY) {
            return Map.of("success", true, "message", "Transaction provider is not SePay");
        }

        if (!isIncomingSepayTransfer(payload)) {
            return Map.of("success", true, "message", "Transfer is not incoming");
        }

        if (!isSepayAmountSufficient(payload, transaction.getAmount())) {
            return Map.of("success", true, "message", "Payment amount did not match");
        }

        if (transaction.getStatus() == PaymentTransactionStatus.SUCCEEDED) {
            return Map.of("success", true, "message", "Transaction already confirmed");
        }

        if (transaction.getStatus() == PaymentTransactionStatus.FAILED
                || transaction.getStatus() == PaymentTransactionStatus.CANCELLED) {
            return Map.of("success", true, "message", "Transaction is already closed");
        }

        transaction.setProviderTransactionId(blankToNull(providerTransactionId));
        transaction.setResponseCode("SEPAY_SUCCESS");
        transaction.setStatus(PaymentTransactionStatus.SUCCEEDED);
        transaction.setPaidAt(parseSepayTransactionDate(firstText(payload, "transactionDate")));

        Booking booking = transaction.getBooking();
        if (booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            booking.setStatus(resolveSuccessfulBookingStatus(transaction));
        }

        couponUsageTrackingService.recordPaidBookingUsage(booking);
        try {
            paymentTransactionRepository.save(transaction);
        } catch (DataIntegrityViolationException exception) {
            return Map.of("success", true, "message", "Duplicate provider transaction");
        }

        return Map.of("success", true, "message", "Confirm success");
    }

    /**
     * SePay Payment Gateway IPN (Cấu hình tại: Payment Gateway → Configuration → IPN).
     * Payload lồng nhau: { notification_type, order: {...}, transaction: {...} } —
     * khác với webhook biến động số dư (payload phẳng) được xử lý ở nhánh cũ.
     */
    private boolean isPaymentGatewayNotification(Map<String, Object> payload) {
        return payload.get("notification_type") != null && payload.get("order") instanceof Map;
    }

    private Map<String, Object> handleSepayGatewayNotification(Map<String, Object> payload) {
        String notificationType = firstText(payload, "notification_type");
        Map<String, Object> order = nestedMap(payload, "order");
        Map<String, Object> gatewayTransaction = nestedMap(payload, "transaction");

        String transactionReference = normalizeSepayReference(firstText(order, "order_invoice_number"));
        if (isBlank(transactionReference)) {
            return Map.of("success", true, "message", "No matching payment reference");
        }

        PaymentTransaction transaction = paymentTransactionRepository
                .findByTransactionReference(transactionReference)
                .orElse(null);

        if (transaction == null) {
            return Map.of("success", true, "message", "Transaction not found");
        }

        if (transaction.getProvider() != PaymentProvider.SEPAY) {
            return Map.of("success", true, "message", "Transaction provider is not SePay");
        }

        if (isCancelledSepayNotification(notificationType)) {
            closeTransactionAsCancelled(transaction, "SEPAY_" + notificationType.toUpperCase());
            try {
                paymentTransactionRepository.save(transaction);
            } catch (DataIntegrityViolationException exception) {
                return Map.of("success", true, "message", "Duplicate provider transaction");
            }

            return Map.of("success", true, "message", "Payment cancelled");
        }

        if (isFailedSepayNotification(notificationType)) {
            closeTransactionAsFailed(transaction, "SEPAY_" + notificationType.toUpperCase());
            try {
                paymentTransactionRepository.save(transaction);
            } catch (DataIntegrityViolationException exception) {
                return Map.of("success", true, "message", "Duplicate provider transaction");
            }

            return Map.of("success", true, "message", "Payment failed");
        }

        if (!"ORDER_PAID".equalsIgnoreCase(notificationType)) {
            return Map.of("success", true, "message", "Notification type ignored: " + notificationType);
        }

        if (transaction.getStatus() == PaymentTransactionStatus.SUCCEEDED) {
            return Map.of("success", true, "message", "Transaction already confirmed");
        }

        if (transaction.getStatus() == PaymentTransactionStatus.FAILED
                || transaction.getStatus() == PaymentTransactionStatus.CANCELLED) {
            return Map.of("success", true, "message", "Transaction is already closed");
        }

        BigDecimal paidAmount = firstAmount(order, "order_amount");
        if (paidAmount == null || transaction.getAmount() == null
                || paidAmount.compareTo(transaction.getAmount().setScale(2, RoundingMode.HALF_UP)) < 0) {
            return Map.of("success", true, "message", "Payment amount did not match");
        }

        String providerTransactionId = firstText(gatewayTransaction, "transaction_id", "id");
        if (providerTransactionId == null) {
            providerTransactionId = firstText(order, "order_id", "id");
        }

        transaction.setProviderTransactionId(blankToNull(providerTransactionId));
        transaction.setResponseCode("SEPAY_SUCCESS");
        transaction.setStatus(PaymentTransactionStatus.SUCCEEDED);
        transaction.setPaidAt(parseSepayTransactionDate(firstText(gatewayTransaction, "transaction_date")));

        Booking booking = transaction.getBooking();
        if (booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            booking.setStatus(resolveSuccessfulBookingStatus(transaction));
        }

        couponUsageTrackingService.recordPaidBookingUsage(booking);
        try {
            paymentTransactionRepository.save(transaction);
        } catch (DataIntegrityViolationException exception) {
            return Map.of("success", true, "message", "Duplicate provider transaction");
        }

        return Map.of("success", true, "message", "Confirm success");
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

    private boolean isCancelledSepayNotification(String notificationType) {
        return "TRANSACTION_VOID".equalsIgnoreCase(notificationType)
                || "ORDER_CANCELLED".equalsIgnoreCase(notificationType)
                || "ORDER_EXPIRED".equalsIgnoreCase(notificationType);
    }

    private boolean isFailedSepayNotification(String notificationType) {
        return "ORDER_FAILED".equalsIgnoreCase(notificationType)
                || "PAYMENT_FAILED".equalsIgnoreCase(notificationType);
    }

    private void closeTransactionAsCancelled(PaymentTransaction transaction, String responseCode) {
        if (transaction.getStatus() == PaymentTransactionStatus.SUCCEEDED
                || transaction.getStatus() == PaymentTransactionStatus.FAILED
                || transaction.getStatus() == PaymentTransactionStatus.CANCELLED) {
            return;
        }

        transaction.setResponseCode(responseCode);
        transaction.setStatus(PaymentTransactionStatus.CANCELLED);
        Booking booking = transaction.getBooking();
        if (booking != null && booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            booking.setStatus(BookingStatus.CANCELLED);
        }
    }

    private void closeTransactionAsFailed(PaymentTransaction transaction, String responseCode) {
        if (transaction.getStatus() == PaymentTransactionStatus.SUCCEEDED
                || transaction.getStatus() == PaymentTransactionStatus.FAILED
                || transaction.getStatus() == PaymentTransactionStatus.CANCELLED) {
            return;
        }

        transaction.setResponseCode(responseCode);
        transaction.setStatus(PaymentTransactionStatus.FAILED);
        Booking booking = transaction.getBooking();
        if (booking != null && booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            booking.setStatus(BookingStatus.CANCELLED);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> nestedMap(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        return value instanceof Map ? (Map<String, Object>) value : Map.of();
    }

    private boolean isValidSignature(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        String hashSecret = vnPayProperties.getHashSecret();

        if (isBlank(receivedHash) || isBlank(hashSecret)) {
            return false;
        }

        return receivedHash.equalsIgnoreCase(hmacSha512(hashSecret, buildHashData(params)));
    }

    private String buildHashData(Map<String, String> params) {
        Map<String, String> sortedParams = new TreeMap<>(params);
        sortedParams.remove("vnp_SecureHash");
        sortedParams.remove("vnp_SecureHashType");

        StringBuilder hashData = new StringBuilder();

        sortedParams.forEach((key, value) -> {
            if (!isBlank(value)) {
                if (!hashData.isEmpty()) {
                    hashData.append('&');
                }

                hashData.append(key)
                        .append('=')
                        .append(URLEncoder.encode(value, StandardCharsets.US_ASCII));
            }
        });

        return hashData.toString();
    }

    private String hmacSha512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA512"
            );
            hmac512.init(secretKey);

            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder(bytes.length * 2);

            for (byte value : bytes) {
                hash.append(String.format("%02x", value));
            }

            return hash.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot create VNPay secure hash", exception);
        }
    }

    private boolean isValidAmount(String rawAmount, BigDecimal transactionAmount) {
        if (isBlank(rawAmount) || transactionAmount == null) {
            return false;
        }

        try {
            BigDecimal expectedAmount = transactionAmount
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(0, RoundingMode.UNNECESSARY);

            return expectedAmount.compareTo(new BigDecimal(rawAmount)) == 0;
        } catch (ArithmeticException | NumberFormatException exception) {
            return false;
        }
    }

    private LocalDateTime parsePayDate(String rawPayDate) {
        if (isBlank(rawPayDate)) {
            return LocalDateTime.now();
        }

        try {
            return LocalDateTime.parse(rawPayDate, VNPAY_DATE_TIME_FORMATTER);
        } catch (DateTimeParseException exception) {
            return LocalDateTime.now();
        }
    }

    private VNPayIpnResponse response(String code, String message) {
        return new VNPayIpnResponse(code, message);
    }

    private Map<String, Object> parseSepayPayload(String rawBody) {
        if (isBlank(rawBody)) {
            throw new IllegalArgumentException("Blank SePay webhook body");
        }

        try {
            return objectMapper.readValue(rawBody, WEBHOOK_PAYLOAD_TYPE);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Cannot parse SePay webhook body", exception);
        }
    }

    private boolean isAlreadyProcessed(String providerTransactionId) {
        if (isBlank(providerTransactionId)) {
            return false;
        }

        return paymentTransactionRepository.findByProviderTransactionId(providerTransactionId).isPresent();
    }

    private boolean isSepayRequestAuthorized(
            String rawBody,
            String authorizationHeader,
            String signatureHeader,
            String timestampHeader,
            String secretKeyHeader
    ) {
        String ipnSecret = blankToNull(sePayProperties.getIpnSecret());
        String hmacSecret = blankToNull(sePayProperties.getWebhookHmacSecret());

        // Payment Gateway IPN với auth type SECRET_KEY gửi header X-Secret-Key và
        // không kèm cặp header HMAC, nên chỉ so khớp với payment.sepay.ipn-secret;
        // không được rơi xuống nhánh HMAC vì sẽ chặn nhầm mọi IPN thật.
        if (!isBlank(secretKeyHeader)) {
            return ipnSecret != null && constantTimeEquals(secretKeyHeader.trim(), ipnSecret);
        }

        // Webhook biến động số dư ký HMAC qua X-SePay-Signature/X-SePay-Timestamp.
        if (!isBlank(signatureHeader) || !isBlank(timestampHeader)) {
            return hmacSecret != null
                    && isValidSepayHmac(rawBody, signatureHeader, timestampHeader, hmacSecret);
        }

        // No secret configured (local/dev): keep the webhook open so the flow can be
        // exercised without a real SePay account. Production should set
        // payment.sepay.ipn-secret and/or payment.sepay.webhook-hmac-secret.
        if (ipnSecret == null && hmacSecret == null) {
            return true;
        }

        if (isBlank(authorizationHeader)) {
            return false;
        }

        String presented = authorizationHeader.trim();
        // SePay sends "Authorization: Apikey <secret>"; also accept the bare secret.
        if (presented.regionMatches(true, 0, "Apikey ", 0, "Apikey ".length())) {
            presented = presented.substring("Apikey ".length()).trim();
        } else if (presented.regionMatches(true, 0, "Bearer ", 0, "Bearer ".length())) {
            presented = presented.substring("Bearer ".length()).trim();
        }

        return ipnSecret != null && constantTimeEquals(presented, ipnSecret);
    }

    private boolean isValidSepayHmac(
            String rawBody,
            String signatureHeader,
            String timestampHeader,
            String secret
    ) {
        if (isBlank(rawBody) || isBlank(signatureHeader) || isBlank(timestampHeader)) {
            return false;
        }

        long timestamp;
        try {
            timestamp = Long.parseLong(timestampHeader.trim());
        } catch (NumberFormatException exception) {
            return false;
        }

        long toleranceSeconds = Math.max(0, sePayProperties.getWebhookTimestampToleranceSeconds());
        long now = Instant.now().getEpochSecond();
        if (toleranceSeconds > 0 && Math.abs(now - timestamp) > toleranceSeconds) {
            return false;
        }

        String expected = "sha256=" + hmacSha256(secret, timestamp + "." + rawBody);
        return constantTimeEquals(expected, signatureHeader.trim());
    }

    private String hmacSha256(String key, String data) {
        try {
            Mac hmac256 = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            hmac256.init(secretKey);

            byte[] bytes = hmac256.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder(bytes.length * 2);

            for (byte value : bytes) {
                hash.append(String.format("%02x", value));
            }

            return hash.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot create SePay webhook signature", exception);
        }
    }

    private boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.UTF_8),
                b.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String extractSepayReference(Map<String, Object> payload) {
        String explicitReference = firstText(
                payload,
                "transactionReference",
                "paymentId",
                "bookingCode",
                "orderCode",
                "order_id",
                "code"
        );

        if (!isBlank(explicitReference)) {
            return normalizeSepayReference(explicitReference);
        }

        String content = firstText(payload, "content", "description", "transferContent", "transactionContent");
        if (isBlank(content)) {
            return null;
        }

        Matcher matcher = SEPAY_PAYMENT_REFERENCE_PATTERN.matcher(content.toUpperCase());
        return matcher.find() ? normalizeSepayReference(matcher.group()) : null;
    }

    private String normalizeSepayReference(String rawReference) {
        return rawReference == null ? null : rawReference.trim().toUpperCase().replace("-", "");
    }

    private boolean isIncomingSepayTransfer(Map<String, Object> payload) {
        String transferType = firstText(payload, "transferType", "type");
        return "in".equalsIgnoreCase(transferType);
    }

    private boolean isSepayAmountSufficient(Map<String, Object> payload, BigDecimal transactionAmount) {
        BigDecimal receivedAmount = firstAmount(payload, "amount", "transferAmount", "money", "value");
        if (receivedAmount == null || transactionAmount == null) {
            return false;
        }

        return receivedAmount.compareTo(transactionAmount.setScale(2, RoundingMode.HALF_UP)) >= 0;
    }

    private LocalDateTime parseSepayTransactionDate(String rawTransactionDate) {
        if (isBlank(rawTransactionDate)) {
            return LocalDateTime.now();
        }

        try {
            return LocalDateTime.parse(rawTransactionDate, SEPAY_DATE_TIME_FORMATTER);
        } catch (DateTimeParseException exception) {
            return LocalDateTime.now();
        }
    }

    private BigDecimal firstAmount(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            if (value == null) {
                continue;
            }

            try {
                return new BigDecimal(String.valueOf(value).trim()).setScale(2, RoundingMode.HALF_UP);
            } catch (NumberFormatException exception) {
                return null;
            }
        }

        return null;
    }

    private String firstText(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            if (value != null && !String.valueOf(value).isBlank()) {
                return String.valueOf(value);
            }
        }

        return null;
    }

    private String blankToNull(String value) {
        return isBlank(value) ? null : value;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
