package backend.user.application.port.in.command;

public record ChangeCurrentUserPasswordCommand(
        String currentUserEmail,
        String currentPassword,
        String newPassword,
        String confirmPassword
) {
}
