package backend.booking.application.port.out;

import java.math.BigDecimal;

public interface LoadSuccessfulPaymentAmountPort {
    BigDecimal loadSuccessfulPaymentAmount(Integer bookingId);
}
