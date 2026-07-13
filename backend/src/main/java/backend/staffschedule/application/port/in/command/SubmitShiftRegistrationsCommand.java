package backend.staffschedule.application.port.in.command;

import java.util.List;

public record SubmitShiftRegistrationsCommand(
        String staffEmail,
        List<ShiftRegistrationSlotCommand> slots
) {
}
