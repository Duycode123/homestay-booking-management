package backend.attendance.application.port.in;

import backend.attendance.application.port.in.query.GetCurrentShiftAttendanceQuery;
import backend.attendance.domain.model.AttendanceRecord;

import java.util.Optional;

public interface GetCurrentShiftAttendanceUseCase {
    Optional<AttendanceRecord> getCurrentAttendance(GetCurrentShiftAttendanceQuery query);
}
