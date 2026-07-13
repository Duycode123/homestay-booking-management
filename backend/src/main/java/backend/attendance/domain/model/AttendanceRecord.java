package backend.attendance.domain.model;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Builder(toBuilder = true)
public record AttendanceRecord(
        UUID id,
        Integer staffId,
        Integer shiftId,
        LocalDateTime checkInTime,
        LocalDateTime checkOutTime,
        BigDecimal workDurationHours,
        AttendanceStatus status
) {
}
