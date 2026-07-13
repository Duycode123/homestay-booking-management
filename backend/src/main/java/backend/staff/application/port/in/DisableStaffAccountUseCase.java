package backend.staff.application.port.in;

import backend.staff.application.model.StaffAccountResult;
import backend.staff.application.port.in.command.DisableStaffAccountCommand;

public interface DisableStaffAccountUseCase {
    StaffAccountResult disableStaffAccount(DisableStaffAccountCommand command);
}

