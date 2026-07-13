package backend.staffperformance.application.port.in.query;

import java.time.LocalDate;

public record GetMyStaffPerformanceQuery(
        String currentUserEmail,
        LocalDate fromDate,
        LocalDate toDate
) {
}
