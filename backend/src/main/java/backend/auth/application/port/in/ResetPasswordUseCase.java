package backend.auth.application.port.in;

import backend.auth.application.port.in.command.ResetPasswordCommand;

public interface ResetPasswordUseCase {
    void resetPassword(ResetPasswordCommand command);
}
