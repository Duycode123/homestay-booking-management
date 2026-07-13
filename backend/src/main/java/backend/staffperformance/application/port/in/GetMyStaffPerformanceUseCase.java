package backend.staffperformance.application.port.in;

import backend.staffperformance.application.model.StaffPerformanceReport;
import backend.staffperformance.application.port.in.query.GetMyStaffPerformanceQuery;

public interface GetMyStaffPerformanceUseCase {
    StaffPerformanceReport getMyPerformance(GetMyStaffPerformanceQuery query);
}
