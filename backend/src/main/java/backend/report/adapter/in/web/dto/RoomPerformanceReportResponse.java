package backend.report.adapter.in.web.dto;

import java.time.LocalDate;
import java.util.List;

public record RoomPerformanceReportResponse(
        LocalDate startDate,
        LocalDate endDate,
        long totalSuccessfulBookings,
        List<RoomPerformanceSummaryResponse> rooms
) {
}
