package backend.coupon.application.model;

import java.math.BigDecimal;
import java.util.List;

public record CouponUsageReport(
        long totalUsed,
        BigDecimal totalDiscountGiven,
        List<CouponUsageTrendPoint> trend,
        List<CouponTopUsagePoint> topCoupons
) {
}
