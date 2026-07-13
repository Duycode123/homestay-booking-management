package backend.staffschedule.application.port.in;

import backend.staffschedule.application.port.in.command.SubmitShiftRegistrationsCommand;
import backend.staffschedule.domain.model.ShiftRegistration;

import java.util.List;

public interface SubmitShiftRegistrationsUseCase {

    List<ShiftRegistration> submitShiftRegistrations(SubmitShiftRegistrationsCommand command);
}
