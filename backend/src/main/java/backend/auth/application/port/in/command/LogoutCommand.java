package backend.auth.application.port.in.command;

public record LogoutCommand(
        String accessToken,
        String refreshToken
) {
}
