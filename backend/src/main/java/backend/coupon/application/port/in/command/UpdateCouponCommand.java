package backend.coupon.application.port.in.command;

import backend.coupon.domain.model.DiscountType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateCouponCommand(
        Integer couponId,
        String code,
        DiscountType type,
        BigDecimal value,
        BigDecimal minOrderValue,
        LocalDate expiresAt
) {
}
