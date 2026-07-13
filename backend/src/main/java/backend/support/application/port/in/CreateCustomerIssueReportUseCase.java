package backend.support.application.port.in;

import backend.support.application.model.CustomerIssueReportResult;

public interface CreateCustomerIssueReportUseCase {

    CustomerIssueReportResult createIssueReport(
            String customerEmail,
            String issueType,
            String bookingCode,
            String description
    );
}
