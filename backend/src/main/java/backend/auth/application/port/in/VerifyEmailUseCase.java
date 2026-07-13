package backend.auth.application.port.in;

import backend.auth.application.port.in.command.VerifyEmailCommand;

public interface VerifyEmailUseCase {
    void verifyEmail(VerifyEmailCommand command);
}
