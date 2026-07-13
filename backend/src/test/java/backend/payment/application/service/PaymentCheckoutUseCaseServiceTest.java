package backend.payment.application.service;

import backend.config.SePayProperties;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.Customer;
import backend.entity.PaymentMethod;
import backend.entity.PaymentProvider;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.entity.User;
import backend.payment.application.model.PaymentSessionResult;
import backend.payment.application.model.SePayCheckoutForm;
import backend.payment.application.port.out.FindSePayIncomingPaymentPort;
import backend.payment.application.port.out.model.SePayIncomingPayment;
import backend.repository.BookingRepository;
import backend.repository.PaymentTransactionRepository;
import backend.service.CouponUsageTrackingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentCheckoutUseCaseServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private FindSePayIncomingPaymentPort findSePayIncomingPaymentPort;

    @Mock
    private CouponUsageTrackingService couponUsageTrackingService;

    private final SePayProperties sePayProperties = new SePayProperties();

    private PaymentCheckoutUseCaseService paymentCheckoutUseCaseService;

    @BeforeEach
    void setUp() {
        sePayProperties.setCheckoutUrl("https://pay.sepay.vn/checkout");
        sePayProperties.setMerchantId("merchant-1");
        sePayProperties.setQrBankAccount("0924054707");
        sePayProperties.setQrBankCode("970422");
        paymentCheckoutUseCaseService = new PaymentCheckoutUseCaseService(
                bookingRepository,
                paymentTransactionRepository,
                sePayProperties,
                findSePayIncomingPaymentPort,
                couponUsageTrackingService
        );
        ReflectionTestUtils.setField(paymentCheckoutUseCaseService, "paymentExpirationSeconds", 300L);
    }

    @Test
    void createsDepositPaymentSessionAndKeepsBookingPending() {
        Booking booking = booking(12, PaymentMethod.CASH);
        when(bookingRepository.findByIdAndCustomer_Account_Email(12, "customer@example.com"))
                .thenReturn(Optional.of(booking));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(invocation -> {
            PaymentTransaction saved = invocation.getArgument(0);
            saved.prePersist();
            return saved;
        });

        PaymentSessionResult result = paymentCheckoutUseCaseService.createPaymentSession(
                12,
                "e_wallet",
                "deposit",
                "customer@example.com"
        );

        ArgumentCaptor<PaymentTransaction> transactionCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(transactionCaptor.capture());
        verify(bookingRepository).save(booking);

        PaymentTransaction savedTransaction = transactionCaptor.getValue();
        assertEquals(PaymentProvider.SEPAY, savedTransaction.getProvider());
        assertEquals(PaymentTransactionStatus.PENDING, savedTransaction.getStatus());
        assertEquals(new BigDecimal("50000"), savedTransaction.getAmount());
        assertEquals(BookingStatus.PENDING_PAYMENT, booking.getStatus());
        assertEquals(PaymentMethod.ONLINE, booking.getPaymentMethod());
        assertEquals("e_wallet", result.method());
        assertEquals("pending", result.status());
        assertEquals(booking.getBookingCode(), result.bookingCode());
        assertEquals(true, result.paymentUrl().startsWith("https://vietqr.app/img?"));
        assertEquals(true, result.paymentUrl().contains("des=" + savedTransaction.getTransactionReference()));
    }

    @Test
    void createsFullOnlinePaymentSessionThroughSePay() {
        Booking booking = booking(25, PaymentMethod.CASH);
        when(bookingRepository.findByIdAndCustomer_Account_Email(25, "customer@example.com"))
                .thenReturn(Optional.of(booking));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(invocation -> {
            PaymentTransaction saved = invocation.getArgument(0);
            saved.prePersist();
            return saved;
        });

        PaymentSessionResult result = paymentCheckoutUseCaseService.createPaymentSession(
                25,
                "bank_transfer",
                "full",
                "customer@example.com"
        );

        ArgumentCaptor<PaymentTransaction> transactionCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(transactionCaptor.capture());
        verify(bookingRepository).save(booking);

        PaymentTransaction savedTransaction = transactionCaptor.getValue();
        assertEquals(PaymentProvider.SEPAY, savedTransaction.getProvider());
        assertEquals(PaymentTransactionStatus.PENDING, savedTransaction.getStatus());
        assertEquals(new BigDecimal("450000"), savedTransaction.getAmount());
        assertEquals(BookingStatus.PENDING_PAYMENT, booking.getStatus());
        assertEquals(PaymentMethod.ONLINE, booking.getPaymentMethod());
        assertEquals("bank_transfer", result.method());
        assertEquals("pending", result.status());
        assertEquals(true, result.paymentUrl().startsWith("https://vietqr.app/img?"));
        assertEquals(true, result.paymentUrl().contains("des=" + savedTransaction.getTransactionReference()));
    }

    @Test
    void replacesExistingOpenPaymentSessionBeforeCreatingANewOne() {
        Booking booking = booking(25, PaymentMethod.ONLINE);
        PaymentTransaction existing = PaymentTransaction.builder()
                .booking(booking)
                .transactionReference("PAYOLD")
                .amount(new BigDecimal("50000"))
                .status(PaymentTransactionStatus.PENDING)
                .build();
        when(bookingRepository.findByIdAndCustomer_Account_Email(25, "customer@example.com"))
                .thenReturn(Optional.of(booking));
        when(paymentTransactionRepository.findByBooking_IdAndStatusIn(eq(25), any()))
                .thenReturn(List.of(existing));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(invocation -> {
            PaymentTransaction saved = invocation.getArgument(0);
            saved.prePersist();
            return saved;
        });

        paymentCheckoutUseCaseService.createPaymentSession(
                25,
                "bank_transfer",
                "full",
                "customer@example.com"
        );

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<PaymentTransaction>> existingTransactionsCaptor = ArgumentCaptor.forClass(List.class);
        verify(paymentTransactionRepository).saveAll(existingTransactionsCaptor.capture());

        PaymentTransaction closed = existingTransactionsCaptor.getValue().getFirst();
        assertEquals(PaymentTransactionStatus.CANCELLED, closed.getStatus());
        assertEquals("PAYMENT_SESSION_REPLACED", closed.getResponseCode());
        assertEquals(BookingStatus.PENDING_PAYMENT, booking.getStatus());
    }

    @Test
    void rejectsCashCheckoutBecauseCounterPaymentIsNotSupported() {
        Booking booking = booking(25, PaymentMethod.ONLINE);
        when(bookingRepository.findByIdAndCustomer_Account_Email(25, "customer@example.com"))
                .thenReturn(Optional.of(booking));

        assertThrows(
                IllegalArgumentException.class,
                () -> paymentCheckoutUseCaseService.createPaymentSession(
                        25,
                        "cash",
                        "full",
                        "customer@example.com"
                )
        );
    }

    @Test
    void createsDepositPaymentSessionWithVietQrWhenCheckoutUrlIsBlank() {
        sePayProperties.setCheckoutUrl(null);
        sePayProperties.setQrBankAccount("0924054707");
        sePayProperties.setQrBankCode("970422");
        sePayProperties.setQrTemplate("compact");
        Booking booking = booking(12, PaymentMethod.CASH);
        when(bookingRepository.findByIdAndCustomer_Account_Email(12, "customer@example.com"))
                .thenReturn(Optional.of(booking));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(invocation -> {
            PaymentTransaction saved = invocation.getArgument(0);
            saved.prePersist();
            return saved;
        });

        PaymentSessionResult result = paymentCheckoutUseCaseService.createPaymentSession(
                12,
                "bank_transfer",
                "deposit",
                "customer@example.com"
        );

        assertEquals(true, result.paymentUrl().startsWith("https://vietqr.app/img?"));
        assertEquals(true, result.paymentUrl().contains("acc=0924054707"));
        assertEquals(true, result.paymentUrl().contains("bank=970422"));
        assertEquals(true, result.paymentUrl().contains("amount=50000"));
        assertEquals(true, result.paymentUrl().contains("des=" + result.paymentId()));
        assertEquals(true, result.paymentUrl().contains("template=compact"));
    }

    @Test
    void pollingTransactionConfirmsSePayApiPaymentAndUpdatesBooking() {
        Booking booking = booking(12, PaymentMethod.ONLINE);
        PaymentTransaction transaction = PaymentTransaction.builder()
                .booking(booking)
                .provider(PaymentProvider.SEPAY)
                .transactionReference("PAY1234567890ABCDEF")
                .amount(new BigDecimal("50000.00"))
                .status(PaymentTransactionStatus.PENDING)
                .createdAt(LocalDateTime.now().minusSeconds(20))
                .build();
        LocalDateTime paidAt = LocalDateTime.now();

        when(paymentTransactionRepository
                .findByTransactionReferenceAndBooking_Customer_Account_Email("PAY1234567890ABCDEF", "customer@example.com"))
                .thenReturn(Optional.of(transaction));
        when(findSePayIncomingPaymentPort.findIncomingPayment(any()))
                .thenReturn(Optional.of(new SePayIncomingPayment(
                        "49682",
                        new BigDecimal("50000.00"),
                        "Thanh toan PAY1234567890ABCDEF",
                        "PAY1234567890ABCDEF",
                        paidAt
                )));

        var detail = paymentCheckoutUseCaseService.getPaymentTransactionDetail(
                "PAY1234567890ABCDEF",
                "customer@example.com"
        );

        assertEquals("success", detail.status());
        assertEquals(PaymentTransactionStatus.SUCCEEDED, transaction.getStatus());
        assertEquals("SEPAY_API_SUCCESS", transaction.getResponseCode());
        assertEquals("49682", transaction.getProviderTransactionId());
        assertEquals(BookingStatus.DEPOSIT_PAID, booking.getStatus());
        verify(bookingRepository).save(booking);
        verify(paymentTransactionRepository).save(transaction);
        verify(couponUsageTrackingService).recordPaidBookingUsage(booking);
    }

    @Test
    void pollingTransactionCancelsExpiredPaymentWhenSePayApiHasNoMatch() {
        Booking booking = booking(12, PaymentMethod.ONLINE);
        PaymentTransaction transaction = PaymentTransaction.builder()
                .booking(booking)
                .provider(PaymentProvider.SEPAY)
                .transactionReference("PAY1234567890ABCDEF")
                .amount(new BigDecimal("50000.00"))
                .status(PaymentTransactionStatus.PENDING)
                .createdAt(LocalDateTime.now().minusSeconds(301))
                .build();

        when(paymentTransactionRepository
                .findByTransactionReferenceAndBooking_Customer_Account_Email("PAY1234567890ABCDEF", "customer@example.com"))
                .thenReturn(Optional.of(transaction));
        when(findSePayIncomingPaymentPort.findIncomingPayment(any()))
                .thenReturn(Optional.empty());

        var detail = paymentCheckoutUseCaseService.getPaymentTransactionDetail(
                "PAY1234567890ABCDEF",
                "customer@example.com"
        );

        assertEquals("cancelled", detail.status());
        assertEquals(PaymentTransactionStatus.CANCELLED, transaction.getStatus());
        assertEquals("PAYMENT_TIMEOUT", transaction.getResponseCode());
        assertEquals(BookingStatus.CANCELLED, booking.getStatus());
        verify(bookingRepository).save(booking);
        verify(paymentTransactionRepository).save(transaction);
        verify(couponUsageTrackingService, never()).recordPaidBookingUsage(booking);
    }

    @Test
    void buildsSePayCheckoutFormSignedLikeOfficialSdk() throws Exception {
        sePayProperties.setSecretKey("spsk_test_secret");
        sePayProperties.setOperation("PURCHASE");
        sePayProperties.setMethod("BANK_TRANSFER");

        PaymentTransaction transaction = PaymentTransaction.builder()
                .booking(booking(12, PaymentMethod.ONLINE))
                .provider(PaymentProvider.SEPAY)
                .transactionReference("PAY123")
                .amount(new BigDecimal("50000"))
                .status(PaymentTransactionStatus.PENDING)
                .build();
        when(paymentTransactionRepository
                .findByTransactionReferenceAndBooking_Customer_Account_Email("PAY123", "customer@example.com"))
                .thenReturn(Optional.of(transaction));

        SePayCheckoutForm form = paymentCheckoutUseCaseService.getSePayCheckoutForm("PAY123", "customer@example.com");

        assertEquals("https://pay.sepay.vn/checkout", form.actionUrl());
        assertEquals(
                List.of(
                        "operation",
                        "payment_method",
                        "order_invoice_number",
                        "order_amount",
                        "currency",
                        "order_description",
                        "customer_id",
                        "merchant",
                        "signature"
                ),
                List.copyOf(form.fields().keySet())
        );
        assertEquals("merchant-1", form.fields().get("merchant"));
        assertEquals("PAY123", form.fields().get("order_invoice_number"));
        assertEquals("50000", form.fields().get("order_amount"));
        assertEquals("VND", form.fields().get("currency"));

        // Same canonical string the SePay SDK signs: key=value pairs joined by
        // commas in field order, HMAC-SHA256, base64.
        String expectedData = "operation=PURCHASE,payment_method=BANK_TRANSFER,order_invoice_number=PAY123,"
                + "order_amount=50000,currency=VND,order_description=PAY123,customer_id=7,merchant=merchant-1";
        Mac hmac = Mac.getInstance("HmacSHA256");
        hmac.init(new SecretKeySpec("spsk_test_secret".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String expectedSignature = Base64.getEncoder()
                .encodeToString(hmac.doFinal(expectedData.getBytes(StandardCharsets.UTF_8)));
        assertEquals(expectedSignature, form.fields().get("signature"));
    }

    private Booking booking(int id, PaymentMethod paymentMethod) {
        Customer customer = Customer.builder()
                .id(7)
                .account(User.builder().id(7).email("customer@example.com").build())
                .build();

        return Booking.builder()
                .id(id)
                .customer(customer)
                .status(BookingStatus.PENDING_PAYMENT)
                .paymentMethod(paymentMethod)
                .totalAmount(new BigDecimal("450000"))
                .build();
    }
}
