package backend.staffschedule.application.port.in.command;

import java.time.LocalDate;
import java.time.LocalTime;

public record ShiftRegistrationSlotCommand(
        LocalDate workDate,
        LocalTime startTime,
        LocalTime endTime
) {
}
