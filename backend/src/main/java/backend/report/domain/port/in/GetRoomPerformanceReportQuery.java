package backend.report.domain.port.in;

import java.time.LocalDate;

public record GetRoomPerformanceReportQuery(
        LocalDate startDate,
        LocalDate endDate
) {
}
