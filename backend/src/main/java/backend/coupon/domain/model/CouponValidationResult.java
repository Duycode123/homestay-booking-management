package backend.coupon.domain.model;

import java.math.BigDecimal;

public record CouponValidationResult(
        boolean valid,
        String reason,
        String code,
        DiscountType type,
        BigDecimal discountValue,
        BigDecimal minOrderValue,
        BigDecimal orderAmount,
        BigDecimal discountAmount,
        BigDecimal payableAmount
) {
}
