package backend.support.application.model;

import java.time.LocalDateTime;

public record CustomerIssueReportResult(
        Long reportId,
        String issueType,
        String status,
        Integer bookingId,
        String bookingCode,
        LocalDateTime createdAt
) {
}
