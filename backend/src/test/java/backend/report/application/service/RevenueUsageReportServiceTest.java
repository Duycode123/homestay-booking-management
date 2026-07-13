package backend.report.application.service;

import backend.report.domain.model.ReportBucket;
import backend.report.domain.model.RevenueUsagePeriod;
import backend.report.domain.model.RevenueUsageReport;
import backend.report.domain.model.RoomUsageSummary;
import backend.report.domain.port.in.GetRevenueUsageReportQuery;
import backend.report.domain.port.out.RevenueUsageReportPort;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RevenueUsageReportServiceTest {

    @Test
    void aggregatesTotalsFromReportPeriods() {
        LocalDateTime from = LocalDateTime.of(2026, 7, 1, 0, 0);
        LocalDateTime to = LocalDateTime.of(2026, 7, 8, 0, 0);
        RevenueUsageReportService service = new RevenueUsageReportService(new StubReportPort(
                List.of(
                        new RevenueUsagePeriod(from, new BigDecimal("500000.00"), 2, new BigDecimal("4.50")),
                        new RevenueUsagePeriod(from.plusDays(1), new BigDecimal("250000.00"), 1, new BigDecimal("2.00"))
                ),
                List.of(new RoomUsageSummary(1, "Deluxe Balcony 201", "Deluxe", new BigDecimal("750000.00"), 3, new BigDecimal("6.50")))
        ));

        RevenueUsageReport report = service.getRevenueUsageReport(
                new GetRevenueUsageReportQuery(from, to, ReportBucket.DAY)
        );

        assertEquals(new BigDecimal("750000.00"), report.totalRevenue());
        assertEquals(3, report.totalBookings());
        assertEquals(new BigDecimal("6.50"), report.totalUsageHours());
        assertEquals(1, report.rooms().size());
    }

    @Test
    void rejectsInvalidTimeRange() {
        RevenueUsageReportService service = new RevenueUsageReportService(new StubReportPort(List.of(), List.of()));
        LocalDateTime time = LocalDateTime.of(2026, 7, 1, 0, 0);

        assertThrows(IllegalArgumentException.class, () -> service.getRevenueUsageReport(
                new GetRevenueUsageReportQuery(time, time, ReportBucket.DAY)
        ));
    }

    private record StubReportPort(
            List<RevenueUsagePeriod> periods,
            List<RoomUsageSummary> rooms
    ) implements RevenueUsageReportPort {

        @Override
        public List<RevenueUsagePeriod> loadRevenueUsagePeriods(
                LocalDateTime from,
                LocalDateTime to,
                ReportBucket bucket
        ) {
            return periods;
        }

        @Override
        public List<RoomUsageSummary> loadRoomUsageSummaries(LocalDateTime from, LocalDateTime to) {
            return rooms;
        }
    }
}
