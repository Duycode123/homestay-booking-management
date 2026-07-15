package backend.payment.application.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;

public record PaymentTransactionDetail(
        String paymentId,
        Integer bookingId,
        String bookingCode,
        String method,
        String paymentOption,
        String status,
        BigDecimal amount,
        LocalDateTime createdAt,
        OffsetDateTime expiresAt,
        LocalDateTime paidAt
) {
}
