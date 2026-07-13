package backend.coupon.adapter.in.web.dto;

import backend.coupon.domain.model.DiscountCode;
import backend.coupon.domain.model.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CouponResponse(
        Integer id,
        String code,
        DiscountType type,
        BigDecimal value,
        BigDecimal minOrderValue,
        LocalDate expiresAt
) {
    public static CouponResponse from(DiscountCode coupon) {
        return new CouponResponse(
                coupon.id(),
                coupon.code(),
                coupon.type(),
                coupon.value(),
                coupon.minOrderValue(),
                coupon.expiresAt()
        );
    }
}
