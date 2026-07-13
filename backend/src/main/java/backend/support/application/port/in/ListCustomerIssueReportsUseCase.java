package backend.support.application.port.in;

import backend.support.application.model.AdminCustomerIssueReportResult;

import java.time.LocalDate;
import java.util.List;

public interface ListCustomerIssueReportsUseCase {

    List<AdminCustomerIssueReportResult> getAdminIssueReports(
            String query,
            String status,
            String priority,
            String roomId,
            LocalDate submittedDate
    );
}
