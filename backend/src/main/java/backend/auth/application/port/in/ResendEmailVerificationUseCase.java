package backend.auth.application.port.in;

import backend.auth.application.port.in.command.ResendEmailVerificationCommand;

public interface ResendEmailVerificationUseCase {
    void resendVerificationEmail(ResendEmailVerificationCommand command);
}
