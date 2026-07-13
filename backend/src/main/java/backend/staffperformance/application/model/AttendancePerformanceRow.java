package backend.staffperformance.application.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record AttendancePerformanceRow(
        String status,
        LocalDateTime checkInTime,
        BigDecimal workDurationHours,
        LocalTime shiftStartTime
) {
}
