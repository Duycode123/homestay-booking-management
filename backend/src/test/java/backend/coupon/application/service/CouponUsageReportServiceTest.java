package backend.coupon.application.service;

import backend.coupon.application.model.CouponTopUsagePoint;
import backend.coupon.application.model.CouponUsageTrendPoint;
import backend.coupon.application.port.in.query.GetCouponUsageReportQuery;
import backend.coupon.application.port.out.CouponUsageReportPort;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CouponUsageReportServiceTest {

    @Test
    void aggregatesTotalsFromDailyTrend() {
        CouponUsageReportService service = new CouponUsageReportService(new StubCouponUsageReportPort(
                List.of(
                        new CouponUsageTrendPoint(LocalDate.of(2026, 7, 1), 2, new BigDecimal("150000.00")),
                        new CouponUsageTrendPoint(LocalDate.of(2026, 7, 2), 1, new BigDecimal("25000.00"))
                ),
                List.of(new CouponTopUsagePoint(7, "SUMMER10", 3, new BigDecimal("175000.00")))
        ));

        var report = service.getCouponUsageReport(new GetCouponUsageReportQuery(
                LocalDate.of(2026, 7, 1),
                LocalDate.of(2026, 7, 31)
        ));

        assertEquals(3, report.totalUsed());
        assertEquals(new BigDecimal("175000.00"), report.totalDiscountGiven());
        assertEquals(1, report.topCoupons().size());
        assertEquals("SUMMER10", report.topCoupons().getFirst().code());
    }

    @Test
    void rejectsInvertedDateRange() {
        CouponUsageReportService service = new CouponUsageReportService(new StubCouponUsageReportPort(List.of(), List.of()));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.getCouponUsageReport(new GetCouponUsageReportQuery(
                        LocalDate.of(2026, 7, 31),
                        LocalDate.of(2026, 7, 1)
                ))
        );
    }

    private record StubCouponUsageReportPort(
            List<CouponUsageTrendPoint> trend,
            List<CouponTopUsagePoint> topCoupons
    ) implements CouponUsageReportPort {

        @Override
        public List<CouponUsageTrendPoint> loadUsageTrend(LocalDateTime from, LocalDateTime to) {
            return trend;
        }

        @Override
        public List<CouponTopUsagePoint> loadTopCoupons(LocalDateTime from, LocalDateTime to) {
            return topCoupons;
        }
    }
}
