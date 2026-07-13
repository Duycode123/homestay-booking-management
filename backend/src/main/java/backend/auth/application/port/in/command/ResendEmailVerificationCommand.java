package backend.auth.application.port.in.command;

public record ResendEmailVerificationCommand(
        String email,
        String emailVerificationUrlBase
) {
}
