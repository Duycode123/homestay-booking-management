package backend.staffperformance.adapter.in.web.dto;

import backend.staffperformance.application.model.StaffPerformanceReport;

import java.time.LocalDate;

public record StaffPerformanceReportResponse(
        LocalDate fromDate,
        LocalDate toDate,
        StaffWorklogSummaryResponse worklog,
        StaffReviewSummaryResponse reviews
) {
    public static StaffPerformanceReportResponse from(StaffPerformanceReport report) {
        return new StaffPerformanceReportResponse(
                report.fromDate(),
                report.toDate(),
                StaffWorklogSummaryResponse.from(report.worklog()),
                StaffReviewSummaryResponse.from(report.reviews())
        );
    }
}
