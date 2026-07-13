package backend.report.domain.port.in;

import backend.report.domain.model.RevenueUsageReport;

public interface GetRevenueUsageReportUseCase {

    RevenueUsageReport getRevenueUsageReport(GetRevenueUsageReportQuery query);
}
