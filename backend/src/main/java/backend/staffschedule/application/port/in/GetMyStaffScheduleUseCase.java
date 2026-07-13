package backend.staffschedule.application.port.in;

import backend.staffschedule.application.port.in.query.GetMyStaffScheduleQuery;
import backend.staffschedule.domain.model.StaffShift;

import java.util.List;

public interface GetMyStaffScheduleUseCase {

    List<StaffShift> getMySchedule(GetMyStaffScheduleQuery query);
}
