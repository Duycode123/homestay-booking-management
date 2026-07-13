package backend.attendance.adapter.in.web.dto;

import backend.attendance.domain.model.AttendanceRecord;
import backend.attendance.domain.model.AttendanceStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AttendanceResponse(
        UUID attendanceId,
        Integer staffId,
        Integer shiftId,
        LocalDateTime checkInTime,
        LocalDateTime checkOutTime,
        BigDecimal workDuration,
        AttendanceStatus status
) {
    public static AttendanceResponse from(AttendanceRecord attendanceRecord) {
        return new AttendanceResponse(
                attendanceRecord.id(),
                attendanceRecord.staffId(),
                attendanceRecord.shiftId(),
                attendanceRecord.checkInTime(),
                attendanceRecord.checkOutTime(),
                attendanceRecord.workDurationHours(),
                attendanceRecord.status()
        );
    }
}
