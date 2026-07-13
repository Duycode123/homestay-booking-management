package backend.attendance.application.port.out;

import backend.attendance.domain.model.AttendanceRecord;

import java.util.Optional;

public interface AttendanceRecordPort {
    boolean existsAttendanceForShift(Integer staffId, Integer shiftId);

    boolean existsWorkingAttendance(Integer staffId, Integer shiftId);

    Optional<AttendanceRecord> loadWorkingAttendance(Integer staffId);

    Optional<AttendanceRecord> loadLatestAttendanceForShift(Integer staffId, Integer shiftId);

    AttendanceRecord save(AttendanceRecord attendanceRecord);

    void markMissingCheckoutsBefore(java.time.LocalDateTime cutoffTime);
}
