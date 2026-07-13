package backend.support.application.port.out;

import backend.support.domain.model.CustomerIssueReport;

import java.util.List;
import java.util.Optional;

public interface CustomerIssueReportPort {

    CustomerIssueReport save(CustomerIssueReport report);

    List<CustomerIssueReport> findAllNewestFirst();

    Optional<CustomerIssueReport> findById(Long reportId);
}
