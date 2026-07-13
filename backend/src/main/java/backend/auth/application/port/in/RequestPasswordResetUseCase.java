package backend.auth.application.port.in;

import backend.auth.application.port.in.command.RequestPasswordResetCommand;

public interface RequestPasswordResetUseCase {
    void requestPasswordReset(RequestPasswordResetCommand command);
}
