package backend.report.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record RevenueUsageReport(
        LocalDateTime from,
        LocalDateTime to,
        ReportBucket bucket,
        BigDecimal totalRevenue,
        long totalBookings,
        BigDecimal totalUsageHours,
        List<RevenueUsagePeriod> periods,
        List<RoomUsageSummary> rooms
) {
}
