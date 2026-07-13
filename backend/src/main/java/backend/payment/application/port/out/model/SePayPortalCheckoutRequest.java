package backend.payment.application.port.out.model;

import java.math.BigDecimal;

public record SePayPortalCheckoutRequest(
        String paymentId,
        Integer bookingId,
        String bookingCode,
        Integer customerId,
        String paymentOption,
        BigDecimal amount
) {
}
