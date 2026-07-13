package backend.auth.application.port.in.command;

public record RequestPasswordResetCommand(
        String email,
        String resetPasswordUrlBase
) {
}
