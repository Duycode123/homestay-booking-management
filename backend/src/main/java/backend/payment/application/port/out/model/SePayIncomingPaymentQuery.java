package backend.payment.application.port.out.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record SePayIncomingPaymentQuery(
        String paymentReference,
        BigDecimal expectedAmount,
        LocalDate fromDate,
        LocalDate toDate,
        LocalDateTime createdAt
) {
}
