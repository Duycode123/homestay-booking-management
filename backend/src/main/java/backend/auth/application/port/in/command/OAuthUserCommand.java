package backend.auth.application.port.in.command;

public record OAuthUserCommand(
        String provider,
        String providerSubject,
        String email,
        boolean emailVerified,
        String fullName,
        String avatarUrl
) {
}
