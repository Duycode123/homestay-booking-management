package backend.coupon.domain.port.in;

import java.math.BigDecimal;

public record ValidateCouponCommand(
        String code,
        BigDecimal orderAmount
) {
}
