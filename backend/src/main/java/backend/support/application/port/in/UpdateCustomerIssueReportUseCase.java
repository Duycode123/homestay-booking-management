package backend.support.application.port.in;

import backend.support.application.model.AdminCustomerIssueReportResult;

public interface UpdateCustomerIssueReportUseCase {

    AdminCustomerIssueReportResult updateAdminIssueReportStatus(
            Long reportId,
            String status,
            String adminNote
    );
}
