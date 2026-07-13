package backend.staffschedule.domain.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record StaffShift(
        Integer id,
        Integer staffId,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime
) {

    public LocalDateTime startsAt() {
        return LocalDateTime.of(date, startTime);
    }

    public LocalDateTime endsAt() {
        return LocalDateTime.of(date, endTime);
    }
}
