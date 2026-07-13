package backend.report.domain.model;

import java.time.LocalDate;
import java.util.List;

public record RoomPerformanceReport(
        LocalDate startDate,
        LocalDate endDate,
        long totalSuccessfulBookings,
        List<RoomPerformanceSummary> rooms
) {
}
