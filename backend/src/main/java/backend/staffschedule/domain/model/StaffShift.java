package backend.staffschedule.domain.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.math.BigDecimal;

public record StaffShift(
        Integer id,
        Integer staffId,
        Integer roomId,
        String roomName,
        String roomAddress,
        BigDecimal roomLatitude,
        BigDecimal roomLongitude,
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
        this(id, staffId, null, null, null, null, null, null, date, startTime, endTime);
    }

    public LocalDateTime startsAt() {
        return LocalDateTime.of(date, startTime);
    }

    public LocalDateTime endsAt() {
        return LocalDateTime.of(date, endTime);
    }
}
