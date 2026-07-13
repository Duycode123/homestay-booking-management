package backend.coupon.application.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CouponUsageTrendPoint(
        LocalDate date,
        long usageCount,
        BigDecimal discountAmount
) {
}
