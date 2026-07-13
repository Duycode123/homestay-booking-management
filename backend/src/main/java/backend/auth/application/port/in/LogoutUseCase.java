package backend.auth.application.port.in;

import backend.auth.application.port.in.command.LogoutCommand;

public interface LogoutUseCase {
    void logout(LogoutCommand command);
}
