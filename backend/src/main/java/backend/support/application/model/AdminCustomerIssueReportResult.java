package backend.support.application.model;

import java.time.LocalDateTime;

public record AdminCustomerIssueReportResult(
        String id,
        String reportCode,
        String customerName,
        String customerEmail,
        String customerPhone,
        String roomId,
        String roomName,
        String bookingId,
        String title,
        String description,
        String priority,
        String status,
        LocalDateTime submittedAt,
        String adminNote
) {
}
