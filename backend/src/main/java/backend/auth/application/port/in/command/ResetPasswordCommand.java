package backend.auth.application.port.in.command;

public record ResetPasswordCommand(
        String token,
        String newPassword
) {
}
