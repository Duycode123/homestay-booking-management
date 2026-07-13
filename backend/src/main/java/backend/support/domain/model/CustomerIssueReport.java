package backend.support.domain.model;

import java.time.LocalDateTime;

public record CustomerIssueReport(
        Long id,
        SupportCustomer customer,
        SupportBooking booking,
        IssueType issueType,
        String description,
        String adminNote,
        IssueStatus status,
        LocalDateTime createdAt
) {
    public static CustomerIssueReport open(
            SupportCustomer customer,
            SupportBooking booking,
            IssueType issueType,
            String description
    ) {
        return new CustomerIssueReport(
                null, customer, booking, issueType, description, null, IssueStatus.OPEN, null
        );
    }

    public CustomerIssueReport updateStatus(IssueStatus newStatus, String newAdminNote) {
        return new CustomerIssueReport(
                id, customer, booking, issueType, description, newAdminNote, newStatus, createdAt
        );
    }
}
