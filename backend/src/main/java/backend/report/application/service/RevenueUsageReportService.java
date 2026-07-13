package backend.report.application.service;

import backend.report.domain.model.ReportBucket;
import backend.report.domain.model.RevenueUsagePeriod;
import backend.report.domain.model.RevenueUsageReport;
import backend.report.domain.model.RoomUsageSummary;
import backend.report.domain.port.in.GetRevenueUsageReportQuery;
import backend.report.domain.port.in.GetRevenueUsageReportUseCase;
import backend.report.domain.port.out.RevenueUsageReportPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RevenueUsageReportService implements GetRevenueUsageReportUseCase {

    private final RevenueUsageReportPort reportPort;

    @Override
    @Transactional(readOnly = true)
    public RevenueUsageReport getRevenueUsageReport(GetRevenueUsageReportQuery query) {
        validate(query);

        ReportBucket bucket = query.bucket() == null ? ReportBucket.DAY : query.bucket();
        List<RevenueUsagePeriod> periods = reportPort.loadRevenueUsagePeriods(query.from(), query.to(), bucket);
        List<RoomUsageSummary> rooms = reportPort.loadRoomUsageSummaries(query.from(), query.to());

        BigDecimal totalRevenue = periods.stream()
                .map(RevenueUsagePeriod::revenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalUsageHours = periods.stream()
                .map(RevenueUsagePeriod::usageHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalBookings = periods.stream()
                .mapToLong(RevenueUsagePeriod::bookingCount)
                .sum();

        return new RevenueUsageReport(
                query.from(),
                query.to(),
                bucket,
                totalRevenue,
                totalBookings,
                totalUsageHours,
                periods,
                rooms
        );
    }

    private void validate(GetRevenueUsageReportQuery query) {
        if (query == null) {
            throw new IllegalArgumentException("Report query is required");
        }
        if (query.from() == null) {
            throw new IllegalArgumentException("from is required");
        }
        if (query.to() == null) {
            throw new IllegalArgumentException("to is required");
        }
        if (!query.from().isBefore(query.to())) {
            throw new IllegalArgumentException("from must be before to");
        }

        LocalDateTime maxRange = switch (query.bucket() == null ? ReportBucket.DAY : query.bucket()) {
            case DAY -> query.from().plusYears(1);
            case WEEK -> query.from().plusYears(3);
            case MONTH -> query.from().plusYears(10);
        };
        if (query.to().isAfter(maxRange)) {
            throw new IllegalArgumentException("Report range is too large for selected bucket");
        }
    }
}
