package backend.coupon.application.port.in.query;

import java.time.LocalDate;

public record GetCouponUsageReportQuery(
        LocalDate startDate,
        LocalDate endDate
) {
}
