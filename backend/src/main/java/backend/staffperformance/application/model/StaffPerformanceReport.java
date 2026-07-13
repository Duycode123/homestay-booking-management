package backend.staffperformance.application.model;

import java.time.LocalDate;

public record StaffPerformanceReport(
        LocalDate fromDate,
        LocalDate toDate,
        StaffWorklogSummary worklog,
        StaffReviewSummary reviews
) {
}
