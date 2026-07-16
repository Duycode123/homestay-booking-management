package backend.coupon.domain.port.in;

import java.math.BigDecimal;

public record ValidateCouponCommand(
        String code,
        BigDecimal orderAmount,
        String customerEmail,
        Integer currentBookingId
) {
    public ValidateCouponCommand(String code, BigDecimal orderAmount) {
        this(code, orderAmount, null, null);
    }
}
