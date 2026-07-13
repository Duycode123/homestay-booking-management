package backend.payment.application.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentSessionResult(
        String paymentId,
        Integer bookingId,
        String bookingCode,
        String method,
        String paymentOption,
        String status,
        BigDecimal amount,
        String paymentUrl,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        LocalDateTime paidAt
) {
}
