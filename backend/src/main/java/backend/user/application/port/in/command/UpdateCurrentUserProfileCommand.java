package backend.user.application.port.in.command;

public record UpdateCurrentUserProfileCommand(
        String currentUserEmail,
        String fullName,
        String email,
        String phone
) {
}
