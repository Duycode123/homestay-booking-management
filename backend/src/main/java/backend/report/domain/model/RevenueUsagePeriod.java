package backend.report.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RevenueUsagePeriod(
        LocalDateTime periodStart,
        BigDecimal revenue,
        long bookingCount,
        BigDecimal usageHours
) {
}
