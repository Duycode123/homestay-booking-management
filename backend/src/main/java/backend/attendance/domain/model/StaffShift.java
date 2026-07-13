package backend.attendance.domain.model;

import java.time.LocalDate;
import java.time.LocalTime;

public record StaffShift(
        Integer id,
        Integer staffId,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime
) {
}
