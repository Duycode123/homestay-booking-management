package backend.user.application.port.in;

import backend.user.application.port.in.command.ChangeCurrentUserPasswordCommand;

public interface ChangeCurrentUserPasswordUseCase {
    void changePassword(ChangeCurrentUserPasswordCommand command);
}
