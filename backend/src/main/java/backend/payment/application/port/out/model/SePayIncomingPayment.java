package backend.payment.application.port.out.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SePayIncomingPayment(
        String providerTransactionId,
        BigDecimal amount,
        String content,
        String code,
        LocalDateTime transactionDate
) {
}
