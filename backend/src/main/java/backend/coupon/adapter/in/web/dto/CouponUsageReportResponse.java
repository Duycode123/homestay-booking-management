package backend.coupon.adapter.in.web.dto;

import backend.coupon.application.model.CouponTopUsagePoint;
import backend.coupon.application.model.CouponUsageReport;
import backend.coupon.application.model.CouponUsageTrendPoint;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CouponUsageReportResponse(
        long totalUsed,
        BigDecimal totalDiscountGiven,
        List<CouponUsageTrendPointResponse> trend,
        List<CouponTopUsagePointResponse> topCoupons
) {

    public static CouponUsageReportResponse from(CouponUsageReport report) {
        return new CouponUsageReportResponse(
                report.totalUsed(),
                report.totalDiscountGiven(),
                report.trend().stream().map(CouponUsageTrendPointResponse::from).toList(),
                report.topCoupons().stream().map(CouponTopUsagePointResponse::from).toList()
        );
    }

    public record CouponUsageTrendPointResponse(
            LocalDate date,
            long usageCount,
            BigDecimal discountAmount
    ) {

        private static CouponUsageTrendPointResponse from(CouponUsageTrendPoint point) {
            return new CouponUsageTrendPointResponse(
                    point.date(),
                    point.usageCount(),
                    point.discountAmount()
            );
        }
    }

    public record CouponTopUsagePointResponse(
            Integer couponId,
            String code,
            long usageCount,
            BigDecimal discountAmount
    ) {

        private static CouponTopUsagePointResponse from(CouponTopUsagePoint point) {
            return new CouponTopUsagePointResponse(
                    point.couponId(),
                    point.code(),
                    point.usageCount(),
                    point.discountAmount()
            );
        }
    }
}
