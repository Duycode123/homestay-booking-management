package backend.report.domain.port.in;

import backend.report.domain.model.ReportBucket;

import java.time.LocalDateTime;

public record GetRevenueUsageReportQuery(
        LocalDateTime from,
        LocalDateTime to,
        ReportBucket bucket
) {
}
