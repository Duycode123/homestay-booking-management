package backend.coupon.adapter.in.web.dto;

import backend.coupon.domain.model.DiscountType;

import java.math.BigDecimal;

public record ValidateCouponResponse(
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
