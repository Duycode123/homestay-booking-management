package backend.repository;

import backend.entity.CustomerIssueReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerIssueReportRepository extends JpaRepository<CustomerIssueReport, Long> {
}
