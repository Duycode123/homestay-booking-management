package backend.report.domain.port.out;

import backend.report.domain.model.ReportBucket;
import backend.report.domain.model.RevenueUsagePeriod;
import backend.report.domain.model.RoomUsageSummary;

import java.time.LocalDateTime;
import java.util.List;

public interface RevenueUsageReportPort {

    List<RevenueUsagePeriod> loadRevenueUsagePeriods(LocalDateTime from, LocalDateTime to, ReportBucket bucket);

    List<RoomUsageSummary> loadRoomUsageSummaries(LocalDateTime from, LocalDateTime to);
}
