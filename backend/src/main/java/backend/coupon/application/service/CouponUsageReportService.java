package backend.coupon.application.service;

import backend.coupon.application.model.CouponTopUsagePoint;
import backend.coupon.application.model.CouponUsageReport;
import backend.coupon.application.model.CouponUsageTrendPoint;
import backend.coupon.application.port.in.GetCouponUsageReportUseCase;
import backend.coupon.application.port.in.query.GetCouponUsageReportQuery;
import backend.coupon.application.port.out.CouponUsageReportPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponUsageReportService implements GetCouponUsageReportUseCase {

    private static final long MAX_REPORT_DAYS = 366;

    private final CouponUsageReportPort couponUsageReportPort;

    @Override
    @Transactional(readOnly = true)
    public CouponUsageReport getCouponUsageReport(GetCouponUsageReportQuery query) {
        validate(query);

        LocalDateTime from = query.startDate().atStartOfDay();
        LocalDateTime to = query.endDate().plusDays(1).atStartOfDay();
        List<CouponUsageTrendPoint> trend = couponUsageReportPort.loadUsageTrend(from, to);
        List<CouponTopUsagePoint> topCoupons = couponUsageReportPort.loadTopCoupons(from, to);

        long totalUsed = trend.stream()
                .mapToLong(CouponUsageTrendPoint::usageCount)
                .sum();
        BigDecimal totalDiscountGiven = trend.stream()
                .map(CouponUsageTrendPoint::discountAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CouponUsageReport(totalUsed, totalDiscountGiven, trend, topCoupons);
    }

    private void validate(GetCouponUsageReportQuery query) {
        if (query == null) {
            throw new IllegalArgumentException("Report query is required");
        }
        if (query.startDate() == null) {
            throw new IllegalArgumentException("startDate is required");
        }
        if (query.endDate() == null) {
            throw new IllegalArgumentException("endDate is required");
        }
        if (query.startDate().isAfter(query.endDate())) {
            throw new IllegalArgumentException("startDate must not be after endDate");
        }
        if (ChronoUnit.DAYS.between(query.startDate(), query.endDate()) + 1 > MAX_REPORT_DAYS) {
            throw new IllegalArgumentException("Report range is too large");
        }
    }
}
