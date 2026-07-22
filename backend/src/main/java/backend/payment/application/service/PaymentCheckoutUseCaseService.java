package backend.payment.application.service;

import backend.addon.application.port.in.AddonUseCase;
import backend.addon.domain.model.BookingAddonStatus;
import backend.booking.application.service.BookingCustomerNotificationService;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.PaymentMethod;
import backend.entity.PaymentProvider;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.entity.Role;
import backend.entity.User;
import backend.exception.ResourceNotFoundException;
import backend.exception.BookingConflictException;
import backend.booking.application.port.out.LoadDiscountCodeForBookingPort;
import backend.coupon.domain.model.CouponValidationResult;
import backend.coupon.domain.port.in.ValidateCouponCommand;
import backend.coupon.domain.port.in.ValidateCouponUseCase;
import backend.payment.application.model.PaymentSessionResult;
import backend.payment.application.model.PaymentTransactionDetail;
import backend.payment.application.model.SePayCheckoutForm;
import backend.payment.application.exception.PaymentHoldExpiredException;
import backend.payment.application.port.in.CreatePaymentSessionUseCase;
import backend.payment.application.port.in.CreateCheckoutBalancePaymentUseCase;
import backend.payment.application.port.in.GetPaymentTransactionUseCase;
import backend.payment.application.port.in.GetSePayCheckoutFormUseCase;
import backend.payment.application.port.in.ReleasePaymentHoldUseCase;
import backend.payment.application.port.out.BuildSePayCheckoutPort;
import backend.payment.application.port.out.FindSePayIncomingPaymentPort;
import backend.payment.application.port.out.LockPaymentAggregatePort;
import backend.payment.application.port.out.model.SePayIncomingPayment;
import backend.payment.application.port.out.model.SePayIncomingPaymentQuery;
import backend.payment.application.port.out.model.SePayPortalCheckoutRequest;
import backend.payment.application.support.PaymentTimeNormalizer;
import backend.repository.BookingRepository;
import backend.repository.PaymentTransactionRepository;
import backend.repository.UserRepository;
import backend.service.CouponUsageTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentCheckoutUseCaseService implements
        CreatePaymentSessionUseCase,
        CreateCheckoutBalancePaymentUseCase,
        GetPaymentTransactionUseCase,
        GetSePayCheckoutFormUseCase,
        ReleasePaymentHoldUseCase {

    private final BookingRepository bookingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserRepository userRepository;
    private final BuildSePayCheckoutPort buildSePayCheckoutPort;
    private final FindSePayIncomingPaymentPort findSePayIncomingPaymentPort;
    private final LockPaymentAggregatePort lockPaymentAggregatePort;
    private final CouponUsageTrackingService couponUsageTrackingService;
    private final ValidateCouponUseCase validateCouponUseCase;
    private final LoadDiscountCodeForBookingPort loadDiscountCodeForBookingPort;
    private final AddonUseCase addonUseCase;
    private final BookingCustomerNotificationService bookingCustomerNotificationService;

    @Value("${app.booking.payment-expiration-seconds:300}")
    private long paymentExpirationSeconds;

    private static final BigDecimal DEPOSIT_RATE = new BigDecimal("0.50");
    private static final String CHECKOUT_BALANCE_PENDING = "CHECKOUT_BALANCE_PENDING";

    @Override
    @Transactional
    public PaymentSessionResult createCheckoutBalancePayment(Integer bookingId, String currentUserEmail) {
        if (bookingId == null) {
            throw new IllegalArgumentException("bookingId khong duoc de trong");
        }
        User currentUser = requireManagementUser(currentUserEmail);

        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));
        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new IllegalStateException("Chi co the thu phan con lai khi booking dang check-in");
        }
        boolean hasOpenAddonRequest = addonUseCase.listForBookingInternal(bookingId).stream()
                .anyMatch(item -> item.status() == BookingAddonStatus.REQUESTED
                        || item.status() == BookingAddonStatus.CONFIRMED
                        || item.status() == BookingAddonStatus.PREPARED);
        if (hasOpenAddonRequest) {
            throw new IllegalStateException(
                    "Vui long hoan tat hoac huy cac dich vu thue them dang xu ly truoc khi tao thanh toan checkout"
            );
        }

        BigDecimal totalAmount = resolveAmount(booking).setScale(2, RoundingMode.HALF_UP);
        BigDecimal paidAmount = paymentTransactionRepository.sumAmountByBookingIdAndStatus(
                bookingId,
                PaymentTransactionStatus.SUCCEEDED
        );
        BigDecimal remainingAmount = totalAmount
                .subtract(paidAmount == null ? BigDecimal.ZERO : paidAmount)
                .max(BigDecimal.ZERO)
                .setScale(2, RoundingMode.HALF_UP);
        if (remainingAmount.signum() <= 0) {
            throw new IllegalStateException("Booking da duoc thanh toan day du");
        }

        closeExistingOpenTransactions(bookingId);

        String paymentId = "BAL" + UUID.randomUUID().toString().replace("-", "")
                .substring(0, 16).toUpperCase();
        PaymentTransaction transaction = PaymentTransaction.builder()
                .booking(booking)
                .processedBy(currentUser)
                .provider(PaymentProvider.SEPAY)
                .transactionReference(paymentId)
                .amount(remainingAmount)
                .status(PaymentTransactionStatus.PENDING)
                .responseCode(CHECKOUT_BALANCE_PENDING)
                .build();
        saveNewOpenTransaction(transaction);

        return new PaymentSessionResult(
                paymentId,
                booking.getId(),
                booking.getBookingCode(),
                "bank_transfer",
                "balance",
                "pending",
                remainingAmount,
                buildSePayCheckoutPort.buildVietQrUrl(paymentId, remainingAmount),
                transaction.getCreatedAt(),
                toApiDateTime(resolveExpiresAt(transaction.getCreatedAt())),
                null
        );
    }

    public PaymentSessionResult createPaymentSession(
            Integer bookingId,
            String rawMethod,
            String rawPaymentOption,
            String customerEmail
    ) {
        return createPaymentSession(bookingId, rawMethod, rawPaymentOption, null, customerEmail);
    }

    @Override
    @Transactional(noRollbackFor = PaymentHoldExpiredException.class)
    public PaymentSessionResult createPaymentSession(
            Integer bookingId,
            String rawMethod,
            String rawPaymentOption,
            String rawCouponCode,
            String customerEmail
    ) {
        if (bookingId == null) {
            throw new IllegalArgumentException("bookingId khong duoc de trong");
        }

        CheckoutMethod checkoutMethod = normalizeMethod(rawMethod);
        PaymentOption paymentOption = normalizePaymentOption(rawPaymentOption);
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don dat phong"));
        if (!belongsToCustomer(booking, customerEmail)) {
            throw new ResourceNotFoundException("Khong tim thay don dat phong");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException("Khong the thanh toan don dat phong da bi huy");
        }

        if (booking.getStatus() == BookingStatus.DEPOSIT_PAID
                || booking.getStatus() == BookingStatus.PAID
                || booking.getStatus() == BookingStatus.CHECKED_IN
                || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new IllegalStateException("Don dat phong nay da duoc thanh toan");
        }

        LocalDateTime bookingPaymentExpiresAt = resolveBookingPaymentExpiresAt(booking, null);
        if (bookingPaymentExpiresAt != null && !LocalDateTime.now().isBefore(bookingPaymentExpiresAt)) {
            booking.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(booking);
            addonUseCase.cancelUndeliveredAddons(booking.getId());
            closeExistingOpenTransactions(booking.getId());
            throw new PaymentHoldExpiredException(
                    "Thoi gian giu phong 5 phut da het. Vui long chon lai phong va tao don moi"
            );
        }

        boolean pricingChanged = applyCouponIfRequested(booking, rawCouponCode);

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

        saveNewOpenTransaction(paymentTransaction);

        boolean bookingChanged = pricingChanged
                || booking.getPaymentMethod() != selectedPaymentMethod
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
                buildSePayCheckoutPort.buildVietQrUrl(paymentId, paymentTransaction.getAmount()),
                paymentTransaction.getCreatedAt(),
                toApiDateTime(resolveExpiresAt(paymentTransaction.getCreatedAt())),
                paymentTransaction.getPaidAt()
        );
    }

    @Override
    @Transactional
    public PaymentTransactionDetail getPaymentTransactionDetail(String paymentId, String customerEmail) {
        if (paymentId == null || paymentId.trim().isBlank()) {
            throw new IllegalArgumentException("paymentId khong duoc de trong");
        }

        PaymentTransaction paymentTransaction = findAccessibleTransaction(paymentId.trim(), customerEmail);

        syncSePayTransaction(paymentTransaction);
        return toPaymentTransactionDetail(paymentTransaction);
    }

    @Override
    @Transactional
    public void releasePaymentHold(String paymentId, String customerEmail) {
        if (paymentId == null || paymentId.trim().isBlank()) {
            throw new IllegalArgumentException("paymentId khong duoc de trong");
        }

        PaymentTransaction transaction = findAccessibleTransaction(paymentId.trim(), customerEmail);
        expirePendingPaymentHold(transaction);
    }

    @Override
    @Transactional
    public void releasePaymentHoldOnPageExit(String paymentId) {
        if (paymentId == null || paymentId.trim().isBlank()) {
            throw new IllegalArgumentException("paymentId khong duoc de trong");
        }

        PaymentTransaction transaction = paymentTransactionRepository
                .findByTransactionReference(paymentId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay giao dich thanh toan"));
        expirePendingPaymentHold(transaction);
    }

    private void expirePendingPaymentHold(PaymentTransaction transaction) {
        lockPaymentAggregatePort.lockAndRefresh(transaction);

        if (transaction.getStatus() == PaymentTransactionStatus.SUCCEEDED
                || transaction.getStatus() == PaymentTransactionStatus.EXPIRED) {
            return;
        }
        if (transaction.getStatus() != PaymentTransactionStatus.PENDING
                && transaction.getStatus() != PaymentTransactionStatus.INITIALIZED) {
            return;
        }

        transaction.setStatus(PaymentTransactionStatus.EXPIRED);
        transaction.setResponseCode("CUSTOMER_LEFT_PAYMENT_PAGE");
        paymentTransactionRepository.save(transaction);

        Booking booking = transaction.getBooking();
        if (booking != null && booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            booking.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(booking);
            addonUseCase.cancelUndeliveredAddons(booking.getId());
        }
    }

    @Override
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

        Booking booking = paymentTransaction.getBooking();
        return buildSePayCheckoutPort.buildPortalForm(new SePayPortalCheckoutRequest(
                paymentTransaction.getTransactionReference(),
                booking.getId(),
                booking.getBookingCode(),
                booking.getCustomer() == null ? null : booking.getCustomer().getId(),
                resolvePaymentOption(paymentTransaction).apiValue,
                paymentTransaction.getAmount()
        ));
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

    private boolean applyCouponIfRequested(Booking booking, String rawCouponCode) {
        if (rawCouponCode == null || rawCouponCode.isBlank()) {
            return false;
        }

        BigDecimal originalAmount = booking.getRoomAmount() != null
                ? booking.getRoomAmount().setScale(2, RoundingMode.HALF_UP)
                : booking.getPricePerHour().multiply(booking.getTotalHours()).setScale(2, RoundingMode.HALF_UP);
        String customerEmail = booking.getCustomer() == null
                || booking.getCustomer().getAccount() == null
                ? null
                : booking.getCustomer().getAccount().getEmail();
        CouponValidationResult validation = validateCouponUseCase.validate(
                new ValidateCouponCommand(
                        rawCouponCode.trim(),
                        originalAmount,
                        customerEmail,
                        booking.getId()
                )
        );

        if (!validation.valid()) {
            throw new IllegalArgumentException(validation.reason());
        }

        var discountCode = loadDiscountCodeForBookingPort.loadDiscountCodeForBooking(validation.code())
                .orElseThrow(() -> new IllegalStateException("Khong the tai ma giam gia hop le de ap dung"));
        BigDecimal addonAmount = booking.getAddonAmount() == null ? BigDecimal.ZERO : booking.getAddonAmount();
        BigDecimal payableAmount = validation.payableAmount().add(addonAmount).setScale(2, RoundingMode.HALF_UP);
        boolean changed = booking.getDiscountCode() == null
                || !booking.getDiscountCode().getId().equals(discountCode.getId())
                || booking.getTotalAmount() == null
                || booking.getTotalAmount().compareTo(payableAmount) != 0;

        booking.setDiscountCode(discountCode);
        booking.setTotalAmount(payableAmount);
        return changed;
    }

    private BigDecimal resolvePaymentAmount(Booking booking, PaymentOption paymentOption) {
        if (paymentOption == PaymentOption.DEPOSIT) {
            return resolveAmount(booking)
                    .multiply(DEPOSIT_RATE)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return resolveAmount(booking);
    }

    private PaymentOption normalizePaymentOption(String rawPaymentOption) {
        if (rawPaymentOption == null || rawPaymentOption.trim().isBlank()) {
            return PaymentOption.FULL;
        }

        String normalized = rawPaymentOption.trim().toLowerCase();
        for (PaymentOption value : PaymentOption.values()) {
            if (value != PaymentOption.BALANCE && value.apiValue.equals(normalized)) {
                return value;
            }
        }

        throw new IllegalArgumentException("Lua chon thanh toan khong hop le");
    }

    private void closeExistingOpenTransactions(Integer bookingId) {
        List<PaymentTransaction> openTransactions = paymentTransactionRepository.findByBooking_IdAndStatusIn(
                bookingId,
                List.of(PaymentTransactionStatus.INITIALIZED, PaymentTransactionStatus.PENDING)
        );

        if (openTransactions.isEmpty()) {
            return;
        }

        List<PaymentTransaction> transactionsToClose = openTransactions.stream()
                .filter(transaction -> {
                    lockPaymentAggregatePort.lockAndRefresh(transaction);
                    return transaction.getStatus() == PaymentTransactionStatus.INITIALIZED
                            || transaction.getStatus() == PaymentTransactionStatus.PENDING;
                })
                .toList();

        transactionsToClose.forEach(transaction -> {
            transaction.setStatus(PaymentTransactionStatus.EXPIRED);
            transaction.setResponseCode("PAYMENT_SESSION_REPLACED");
        });
        if (!transactionsToClose.isEmpty()) {
            paymentTransactionRepository.saveAll(transactionsToClose);
            // Hibernate executes inserts before updates. Flush the cancellation first so
            // the partial unique index can safely accept the replacement session.
            paymentTransactionRepository.flush();
        }
    }

    private String generatePaymentId() {
        return "PAY" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private void saveNewOpenTransaction(PaymentTransaction transaction) {
        try {
            paymentTransactionRepository.save(transaction);
            paymentTransactionRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new BookingConflictException(
                    "Mot phien thanh toan khac vua duoc tao cho booking nay. Vui long tai lai trang",
                    exception
            );
        }
    }

    private void syncSePayTransaction(PaymentTransaction transaction) {
        if (transaction.getProvider() != PaymentProvider.SEPAY
                || transaction.getStatus() == PaymentTransactionStatus.SUCCEEDED
                || transaction.getStatus() == PaymentTransactionStatus.FAILED
                || (transaction.getStatus() == PaymentTransactionStatus.CANCELLED
                    && !"PAYMENT_TIMEOUT".equals(transaction.getResponseCode()))) {
            return;
        }

        LocalDateTime expiresAt = resolveTransactionExpiresAt(transaction);
        SePayIncomingPaymentQuery query = new SePayIncomingPaymentQuery(
                transaction.getTransactionReference(),
                transaction.getAmount(),
                PaymentTimeNormalizer.systemLocalToSePayDate(
                        transaction.getCreatedAt() == null ? LocalDateTime.now() : transaction.getCreatedAt()
                ),
                PaymentTimeNormalizer.systemLocalToSePayDate(LocalDateTime.now()),
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
        lockPaymentAggregatePort.lockAndRefresh(transaction);

        if (transaction.getStatus() == PaymentTransactionStatus.SUCCEEDED) {
            return;
        }
        boolean timedOutBeforeConfirmation = transaction.getStatus() == PaymentTransactionStatus.EXPIRED
                && ("PAYMENT_TIMEOUT".equals(transaction.getResponseCode())
                    || "CUSTOMER_LEFT_PAYMENT_PAGE".equals(transaction.getResponseCode()));
        if ((transaction.getStatus() == PaymentTransactionStatus.FAILED
                || transaction.getStatus() == PaymentTransactionStatus.CANCELLED
                || transaction.getStatus() == PaymentTransactionStatus.EXPIRED)
                && !timedOutBeforeConfirmation) {
            return;
        }

        boolean latePayment = expiresAt != null
                && payment.transactionDate() != null
                && payment.transactionDate().isAfter(expiresAt);

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
        transaction.setStatus(PaymentTransactionStatus.SUCCEEDED);
        transaction.setPaidAt(payment.transactionDate() == null ? LocalDateTime.now() : payment.transactionDate());

        Booking booking = transaction.getBooking();
        boolean checkoutBalance = isCheckoutBalanceTransaction(transaction);
        boolean roomWasReleased = timedOutBeforeConfirmation
                || (booking != null && (booking.getStatus() == BookingStatus.CANCELLED
                    || booking.getStatus() == BookingStatus.EXPIRED));
        if ((latePayment || roomWasReleased) && !checkoutBalance) {
            transaction.setResponseCode(roomWasReleased
                    ? "PAYMENT_AFTER_RELEASE_REQUIRES_REFUND"
                    : "LATE_PAYMENT_REQUIRES_REFUND");
            if (booking != null && booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
                booking.setStatus(BookingStatus.EXPIRED);
                bookingRepository.save(booking);
            }
            paymentTransactionRepository.save(transaction);
            return;
        }

        transaction.setResponseCode(checkoutBalance ? "CHECKOUT_BALANCE_SETTLED" : "SEPAY_API_SUCCESS");
        if (checkoutBalance && booking.getStatus() == BookingStatus.CHECKED_IN) {
            booking.setStatus(BookingStatus.COMPLETED);
            booking.setCheckoutTime(transaction.getPaidAt());
            bookingRepository.save(booking);
        } else if (booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            booking.setStatus(resolveSuccessfulBookingStatus(transaction));
            bookingRepository.save(booking);
            addonUseCase.confirmInitialAddons(booking.getId());
        }

        couponUsageTrackingService.recordPaidBookingUsage(booking);
        paymentTransactionRepository.save(transaction);
        bookingCustomerNotificationService.notifyPaymentConfirmed(booking, transaction.getAmount());
    }

    private void timeoutTransactionIfExpired(PaymentTransaction transaction, LocalDateTime expiresAt) {
        if (expiresAt == null || LocalDateTime.now().isBefore(expiresAt)) {
            return;
        }

        lockPaymentAggregatePort.lockAndRefresh(transaction);
        LocalDateTime refreshedExpiresAt = resolveTransactionExpiresAt(transaction);
        if (refreshedExpiresAt == null || LocalDateTime.now().isBefore(refreshedExpiresAt)
                || (transaction.getStatus() != PaymentTransactionStatus.INITIALIZED
                    && transaction.getStatus() != PaymentTransactionStatus.PENDING)) {
            return;
        }

        transaction.setStatus(PaymentTransactionStatus.EXPIRED);
        transaction.setResponseCode("PAYMENT_TIMEOUT");

        Booking booking = transaction.getBooking();
        if (booking != null && booking.getStatus() == BookingStatus.PENDING_PAYMENT) {
            booking.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(booking);
            addonUseCase.cancelUndeliveredAddons(booking.getId());
        }

        paymentTransactionRepository.save(transaction);
    }

    private boolean belongsToCustomer(Booking booking, String customerEmail) {
        if (booking.getCustomer() == null || booking.getCustomer().getAccount() == null
                || booking.getCustomer().getAccount().getEmail() == null || customerEmail == null) {
            return false;
        }
        return booking.getCustomer().getAccount().getEmail().equalsIgnoreCase(customerEmail.trim());
    }

    private PaymentTransaction findAccessibleTransaction(String paymentId, String currentUserEmail) {
        Optional<PaymentTransaction> customerTransaction = paymentTransactionRepository
                .findByTransactionReferenceAndBooking_Customer_Account_Email(paymentId, currentUserEmail);
        if (customerTransaction.isPresent()) {
            return customerTransaction.get();
        }

        requireManagementUser(currentUserEmail);
        return paymentTransactionRepository.findByTransactionReference(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay giao dich thanh toan"));
    }

    private User requireManagementUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay tai khoan"));
        if (user.getRole() != Role.ADMIN && user.getRole() != Role.STAFF) {
            throw new IllegalStateException("Chi admin hoac nhan vien moi duoc ket toan checkout");
        }
        return user;
    }

    private boolean isCheckoutBalanceTransaction(PaymentTransaction transaction) {
        String reference = transaction.getTransactionReference();
        String responseCode = transaction.getResponseCode();
        return (reference != null && reference.startsWith("BAL"))
                || CHECKOUT_BALANCE_PENDING.equals(responseCode)
                || "CHECKOUT_BALANCE_SETTLED".equals(responseCode);
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

    private LocalDateTime resolveExpiresAt(LocalDateTime createdAt) {
        if (createdAt == null || paymentExpirationSeconds <= 0) {
            return null;
        }

        return createdAt.plusSeconds(paymentExpirationSeconds);
    }

    private LocalDateTime resolveBookingPaymentExpiresAt(Booking booking, LocalDateTime fallbackCreatedAt) {
        if (booking != null && booking.getCreatedAt() != null) {
            return resolveExpiresAt(booking.getCreatedAt());
        }

        return resolveExpiresAt(fallbackCreatedAt);
    }

    private LocalDateTime resolveTransactionExpiresAt(PaymentTransaction transaction) {
        return resolveExpiresAt(transaction.getCreatedAt());
    }

    private OffsetDateTime toApiDateTime(LocalDateTime value) {
        if (value == null) {
            return null;
        }

        return value.atZone(ZoneId.systemDefault()).toOffsetDateTime();
    }

    private String mapStatus(PaymentTransactionStatus status, Booking booking) {
        if (status == PaymentTransactionStatus.SUCCEEDED
                && booking != null
                && booking.getStatus() == BookingStatus.CANCELLED) {
            return "cancelled";
        }

        if (status == PaymentTransactionStatus.SUCCEEDED
                && booking != null
                && booking.getStatus() == BookingStatus.EXPIRED) {
            return "expired";
        }

        if ((status == PaymentTransactionStatus.PENDING || status == PaymentTransactionStatus.INITIALIZED)
                && booking != null
                && booking.getStatus() == BookingStatus.CANCELLED) {
            return "cancelled";
        }

        return switch (status) {
            case SUCCEEDED -> "success";
            case PENDING, INITIALIZED -> "pending";
            case FAILED -> "failed";
            case EXPIRED -> "expired";
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
                toApiDateTime(resolveTransactionExpiresAt(paymentTransaction)),
                paymentTransaction.getPaidAt()
        );
    }

    private PaymentOption resolvePaymentOption(PaymentTransaction transaction) {
        if (isCheckoutBalanceTransaction(transaction)) {
            return PaymentOption.BALANCE;
        }
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
        BANK_TRANSFER("bank_transfer");

        private final String apiValue;

        CheckoutMethod(String apiValue) {
            this.apiValue = apiValue;
        }
    }

    private enum PaymentOption {
        DEPOSIT("deposit"),
        FULL("full"),
        BALANCE("balance");

        private final String apiValue;

        PaymentOption(String apiValue) {
            this.apiValue = apiValue;
        }
    }
}
