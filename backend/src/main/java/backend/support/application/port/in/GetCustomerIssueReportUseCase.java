package backend.support.application.port.in;

import backend.support.application.model.AdminCustomerIssueReportResult;

public interface GetCustomerIssueReportUseCase {

    AdminCustomerIssueReportResult getAdminIssueReport(Long reportId);
}
