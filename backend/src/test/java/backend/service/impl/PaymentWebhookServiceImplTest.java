package backend.service.impl;

import backend.config.SePayProperties;
import backend.config.VNPayProperties;
import backend.entity.Booking;
import backend.entity.BookingStatus;
import backend.entity.PaymentProvider;
import backend.entity.PaymentTransaction;
import backend.entity.PaymentTransactionStatus;
import backend.repository.PaymentTransactionRepository;
import backend.service.CouponUsageTrackingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentWebhookServiceImplTest {

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private CouponUsageTrackingService couponUsageTrackingService;

    private final VNPayProperties vnPayProperties = new VNPayProperties();
    private final SePayProperties sePayProperties = new SePayProperties();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private PaymentWebhookServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PaymentWebhookServiceImpl(
                paymentTransactionRepository,
                vnPayProperties,
                sePayProperties,
                couponUsageTrackingService,
                objectMapper
        );
    }

    @Test
    void sepayWebhookRejectsRequestWithoutSecretWhenSecretConfigured() {
        sePayProperties.setIpnSecret("super-secret");

        Map<String, Object> result = service.handleSepayWebhook(
                "{\"code\":\"PAY1\",\"transferType\":\"in\",\"transferAmount\":100000}",
                null,
                null,
                null,
                null
        );

        assertEquals(false, result.get("success"));
        verify(paymentTransactionRepository, never()).findByTransactionReference(any());
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    void sepayWebhookRejectsRequestWithWrongSecret() {
        sePayProperties.setIpnSecret("super-secret");

        Map<String, Object> result = service.handleSepayWebhook(
                "{\"code\":\"PAY1\",\"transferType\":\"in\",\"transferAmount\":100000}",
                "Apikey wrong-secret",
                null,
                null,
                null
        );

        assertEquals(false, result.get("success"));
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    void sepayWebhookConfirmsBookingWithMatchingApikeySecret() {
        sePayProperties.setIpnSecret("super-secret");
        PaymentTransaction transaction = pendingTransaction("PAY1", new BigDecimal("100000.00"));
        when(paymentTransactionRepository.findByProviderTransactionId("92704"))
                .thenReturn(Optional.empty());
        when(paymentTransactionRepository.findByTransactionReference("PAY1"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> result = service.handleSepayWebhook(
                """
                        {"id":92704,"code":"PAY1","transferType":"in","transferAmount":100000}
                        """,
                "Apikey super-secret",
                null,
                null,
                null
        );

        assertEquals(true, result.get("success"));
        assertEquals(PaymentTransactionStatus.SUCCEEDED, transaction.getStatus());
        assertEquals(BookingStatus.PAID, transaction.getBooking().getStatus());
        assertEquals("92704", transaction.getProviderTransactionId());
        verify(couponUsageTrackingService).recordPaidBookingUsage(transaction.getBooking());
        verify(paymentTransactionRepository).save(transaction);
    }

    @Test
    void sepayWebhookStaysOpenWhenNoSecretConfigured() {
        // ipnSecret left blank: local/dev behaviour, webhook is accepted without a header.
        PaymentTransaction transaction = pendingTransaction("PAY1", new BigDecimal("100000.00"));
        when(paymentTransactionRepository.findByProviderTransactionId("92704"))
                .thenReturn(Optional.empty());
        when(paymentTransactionRepository.findByTransactionReference("PAY1"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> result = service.handleSepayWebhook(
                """
                        {"id":92704,"code":"PAY1","transferType":"in","transferAmount":100000}
                        """,
                null,
                null,
                null,
                null
        );

        assertEquals(true, result.get("success"));
        assertEquals(BookingStatus.PAID, transaction.getBooking().getStatus());
    }

    @Test
    void sepayWebhookAcceptsValidHmacSignature() {
        sePayProperties.setWebhookHmacSecret("hmac-secret");
        PaymentTransaction transaction = pendingTransaction("PAY1", new BigDecimal("100000.00"));
        String body = "{\"id\":92704,\"code\":\"PAY1\",\"transferType\":\"in\",\"transferAmount\":100000}";
        String timestamp = String.valueOf(java.time.Instant.now().getEpochSecond());
        String signature = "sha256=" + hmacSha256("hmac-secret", timestamp + "." + body);

        when(paymentTransactionRepository.findByProviderTransactionId("92704"))
                .thenReturn(Optional.empty());
        when(paymentTransactionRepository.findByTransactionReference("PAY1"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> result = service.handleSepayWebhook(
                body,
                null,
                signature,
                timestamp,
                null
        );

        assertEquals(true, result.get("success"));
        assertEquals(PaymentTransactionStatus.SUCCEEDED, transaction.getStatus());
    }

    @Test
    void sepayWebhookAcknowledgesUnderpaidTransferWithoutConfirmingBooking() {
        PaymentTransaction transaction = pendingTransaction("PAY1", new BigDecimal("100000.00"));
        when(paymentTransactionRepository.findByProviderTransactionId("92704"))
                .thenReturn(Optional.empty());
        when(paymentTransactionRepository.findByTransactionReference("PAY1"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> result = service.handleSepayWebhook(
                """
                        {"id":92704,"code":"PAY1","transferType":"in","transferAmount":90000}
                        """,
                null,
                null,
                null,
                null
        );

        assertEquals(true, result.get("success"));
        assertEquals(PaymentTransactionStatus.PENDING, transaction.getStatus());
        assertEquals(BookingStatus.PENDING_PAYMENT, transaction.getBooking().getStatus());
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    void gatewayOrderPaidIpnMarksTransactionSucceededAndBookingPaid() {
        PaymentTransaction transaction = pendingTransaction("PAY0123456789ABCDEF", new BigDecimal("50000.00"));
        transaction.getBooking().setTotalAmount(new BigDecimal("50000.00"));
        when(paymentTransactionRepository.findByTransactionReference("PAY0123456789ABCDEF"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> result = service.handleSepayWebhook(
                gatewayIpnBody("ORDER_PAID", "PAY0123456789ABCDEF", "50000.00"),
                null,
                null,
                null,
                null
        );

        assertEquals(true, result.get("success"));
        assertEquals("Confirm success", result.get("message"));
        assertEquals(PaymentTransactionStatus.SUCCEEDED, transaction.getStatus());
        assertEquals(BookingStatus.PAID, transaction.getBooking().getStatus());
        assertEquals("68ba94ac80123", transaction.getProviderTransactionId());
        verify(couponUsageTrackingService).recordPaidBookingUsage(transaction.getBooking());
        verify(paymentTransactionRepository).save(transaction);
    }

    @Test
    void gatewayOrderPaidIpnMarksBookingDepositPaidWhenAmountIsPartial() {
        PaymentTransaction transaction = pendingTransaction("PAY0123456789ABCDEF", new BigDecimal("50000.00"));
        transaction.getBooking().setTotalAmount(new BigDecimal("450000.00"));
        when(paymentTransactionRepository.findByTransactionReference("PAY0123456789ABCDEF"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> result = service.handleSepayWebhook(
                gatewayIpnBody("ORDER_PAID", "PAY0123456789ABCDEF", "50000.00"),
                null,
                null,
                null,
                null
        );

        assertEquals(true, result.get("success"));
        assertEquals(PaymentTransactionStatus.SUCCEEDED, transaction.getStatus());
        assertEquals(BookingStatus.DEPOSIT_PAID, transaction.getBooking().getStatus());
        verify(couponUsageTrackingService).recordPaidBookingUsage(transaction.getBooking());
        verify(paymentTransactionRepository).save(transaction);
    }

    @Test
    void gatewayIpnWithInsufficientAmountDoesNotConfirmBooking() {
        PaymentTransaction transaction = pendingTransaction("PAY0123456789ABCDEF", new BigDecimal("50000.00"));
        when(paymentTransactionRepository.findByTransactionReference("PAY0123456789ABCDEF"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> result = service.handleSepayWebhook(
                gatewayIpnBody("ORDER_PAID", "PAY0123456789ABCDEF", "10000.00"),
                null,
                null,
                null,
                null
        );

        assertEquals(true, result.get("success"));
        assertEquals("Payment amount did not match", result.get("message"));
        assertEquals(PaymentTransactionStatus.PENDING, transaction.getStatus());
        assertEquals(BookingStatus.PENDING_PAYMENT, transaction.getBooking().getStatus());
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    void gatewayVoidIpnCancelsPendingTransactionAndBooking() {
        PaymentTransaction transaction = pendingTransaction("PAY0123456789ABCDEF", new BigDecimal("50000.00"));
        when(paymentTransactionRepository.findByTransactionReference("PAY0123456789ABCDEF"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> result = service.handleSepayWebhook(
                gatewayIpnBody("TRANSACTION_VOID", "PAY0123456789ABCDEF", "50000.00"),
                null,
                null,
                null,
                null
        );

        assertEquals(true, result.get("success"));
        assertEquals("Payment cancelled", result.get("message"));
        assertEquals(PaymentTransactionStatus.CANCELLED, transaction.getStatus());
        assertEquals("SEPAY_TRANSACTION_VOID", transaction.getResponseCode());
        assertEquals(BookingStatus.CANCELLED, transaction.getBooking().getStatus());
        verify(paymentTransactionRepository).save(transaction);
    }

    @Test
    void gatewayIpnSecretKeyHeaderIsValidatedAgainstIpnSecret() {
        sePayProperties.setIpnSecret("ipn-secret-1");

        Map<String, Object> rejected = service.handleSepayWebhook(
                gatewayIpnBody("ORDER_PAID", "PAY0123456789ABCDEF", "50000.00"),
                null,
                null,
                null,
                "wrong-secret"
        );

        assertEquals(false, rejected.get("success"));

        PaymentTransaction transaction = pendingTransaction("PAY0123456789ABCDEF", new BigDecimal("50000.00"));
        when(paymentTransactionRepository.findByTransactionReference("PAY0123456789ABCDEF"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> accepted = service.handleSepayWebhook(
                gatewayIpnBody("ORDER_PAID", "PAY0123456789ABCDEF", "50000.00"),
                null,
                null,
                null,
                "ipn-secret-1"
        );

        assertEquals(true, accepted.get("success"));
        assertEquals(PaymentTransactionStatus.SUCCEEDED, transaction.getStatus());
    }

    @Test
    void gatewaySecretKeyIpnIsAcceptedWhenHmacSecretAlsoConfigured() {
        // Regression: cấu hình webhook-hmac-secret không được chặn IPN xác thực bằng X-Secret-Key.
        sePayProperties.setIpnSecret("ipn-secret-1");
        sePayProperties.setWebhookHmacSecret("hmac-secret");
        PaymentTransaction transaction = pendingTransaction("PAY0123456789ABCDEF", new BigDecimal("50000.00"));
        when(paymentTransactionRepository.findByTransactionReference("PAY0123456789ABCDEF"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> result = service.handleSepayWebhook(
                gatewayIpnBody("ORDER_PAID", "PAY0123456789ABCDEF", "50000.00"),
                null,
                null,
                null,
                "ipn-secret-1"
        );

        assertEquals(true, result.get("success"));
        assertEquals(PaymentTransactionStatus.SUCCEEDED, transaction.getStatus());
    }

    @Test
    void webhookWithoutCredentialsIsRejectedWhenOnlyHmacSecretConfigured() {
        sePayProperties.setWebhookHmacSecret("hmac-secret");

        Map<String, Object> result = service.handleSepayWebhook(
                gatewayIpnBody("ORDER_PAID", "PAY0123456789ABCDEF", "50000.00"),
                null,
                null,
                null,
                null
        );

        assertEquals(false, result.get("success"));
        verify(paymentTransactionRepository, never()).save(any());
    }

    @Test
    void gatewayFailedIpnMarksTransactionFailedAndCancelsBooking() {
        PaymentTransaction transaction = pendingTransaction("PAY0123456789ABCDEF", new BigDecimal("50000.00"));
        when(paymentTransactionRepository.findByTransactionReference("PAY0123456789ABCDEF"))
                .thenReturn(Optional.of(transaction));

        Map<String, Object> result = service.handleSepayWebhook(
                gatewayIpnBody("ORDER_FAILED", "PAY0123456789ABCDEF", "50000.00"),
                null,
                null,
                null,
                null
        );

        assertEquals(true, result.get("success"));
        assertEquals("Payment failed", result.get("message"));
        assertEquals(PaymentTransactionStatus.FAILED, transaction.getStatus());
        assertEquals("SEPAY_ORDER_FAILED", transaction.getResponseCode());
        assertEquals(BookingStatus.CANCELLED, transaction.getBooking().getStatus());
        verify(paymentTransactionRepository).save(transaction);
    }

    private String gatewayIpnBody(String notificationType, String invoiceNumber, String orderAmount) {
        return """
                {
                  "timestamp": 1757058220,
                  "notification_type": "%s",
                  "order": {
                    "id": "e2c195be-c721-47eb-b323-99ab24e52d85",
                    "order_id": "NPSETVI00101000042R",
                    "order_status": "CAPTURED",
                    "order_currency": "VND",
                    "order_amount": "%s",
                    "order_invoice_number": "%s",
                    "order_description": "%s"
                  },
                  "transaction": {
                    "id": "384c66dd-41e6-4316-a544-b4141682595c",
                    "payment_method": "BANK_TRANSFER",
                    "transaction_id": "68ba94ac80123",
                    "transaction_type": "PAYMENT",
                    "transaction_date": "2026-07-06 10:00:15",
                    "transaction_status": "APPROVED",
                    "transaction_amount": "%s",
                    "transaction_currency": "VND"
                  }
                }
                """.formatted(notificationType, orderAmount, invoiceNumber, invoiceNumber, orderAmount);
    }

    private PaymentTransaction pendingTransaction(String reference, BigDecimal amount) {
        Booking booking = Booking.builder()
                .id(12)
                .status(BookingStatus.PENDING_PAYMENT)
                .build();

        return PaymentTransaction.builder()
                .booking(booking)
                .provider(PaymentProvider.SEPAY)
                .transactionReference(reference)
                .amount(amount)
                .status(PaymentTransactionStatus.PENDING)
                .build();
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
            throw new IllegalStateException(exception);
        }
    }
}
