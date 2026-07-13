package backend.coupon.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DiscountCode(
        Integer id,
        String code,
        DiscountType type,
        BigDecimal value,
        BigDecimal minOrderValue,
        LocalDate expiresAt
) {
}
