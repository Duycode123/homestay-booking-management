package backend.report.adapter.in.web.dto;

import backend.report.domain.model.ReportBucket;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record RevenueUsageReportResponse(
        LocalDateTime from,
        LocalDateTime to,
        ReportBucket bucket,
        BigDecimal totalRevenue,
        long totalBookings,
        BigDecimal totalUsageHours,
        List<RevenueUsagePeriodResponse> periods,
        List<RoomUsageSummaryResponse> rooms
) {
}
