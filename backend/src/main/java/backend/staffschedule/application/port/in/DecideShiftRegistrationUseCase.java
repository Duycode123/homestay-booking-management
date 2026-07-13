package backend.staffschedule.application.port.in;

import backend.staffschedule.application.port.in.command.DecideShiftRegistrationCommand;
import backend.staffschedule.domain.model.ShiftRegistration;

public interface DecideShiftRegistrationUseCase {

    ShiftRegistration decideShiftRegistration(DecideShiftRegistrationCommand command);
}
