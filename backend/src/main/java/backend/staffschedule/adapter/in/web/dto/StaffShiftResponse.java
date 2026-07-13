package backend.staffschedule.adapter.in.web.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record StaffShiftResponse(
        Integer shiftId,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime
) {
}
