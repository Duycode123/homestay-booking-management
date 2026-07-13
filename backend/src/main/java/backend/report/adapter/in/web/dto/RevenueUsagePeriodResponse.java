package backend.report.adapter.in.web.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RevenueUsagePeriodResponse(
        LocalDateTime periodStart,
        BigDecimal revenue,
        long bookingCount,
        BigDecimal usageHours
) {
}
