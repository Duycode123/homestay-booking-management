package backend.staff.application.port.in;

import backend.staff.application.model.StaffAccountResult;
import backend.staff.application.port.in.command.CreateStaffAccountCommand;

public interface CreateStaffAccountUseCase {
    StaffAccountResult createStaffAccount(CreateStaffAccountCommand command);
}
