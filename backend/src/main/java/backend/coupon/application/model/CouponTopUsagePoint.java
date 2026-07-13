package backend.coupon.application.model;

import java.math.BigDecimal;

public record CouponTopUsagePoint(
        Integer couponId,
        String code,
        long usageCount,
        BigDecimal discountAmount
) {
}
