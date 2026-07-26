package backend.attendance.domain.model;

import java.time.LocalDate;
import java.time.LocalTime;
import java.math.BigDecimal;

public record StaffShift(
        Integer id,
        Integer staffId,
        Integer roomId,
        String roomName,
        BigDecimal latitude,
        BigDecimal longitude,
        Integer checkInRadiusMeters,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime
) {
    public StaffShift(
            Integer id,
            Integer staffId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime
    ) {
        this(id, staffId, null, null, null, null, null, date, startTime, endTime);
    }
}
