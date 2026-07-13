package backend.auth.application.port.out;

import backend.entity.User;

public interface AuthSecurityPort {
    void authenticate(String email, String password);

    String encodePassword(String rawPassword);

    String generateAccessToken(User user);

    String generateRefreshToken(User user);

    String rotateRefreshToken(User user, String currentRefreshToken);

    String extractUsername(String token);

    boolean isRefreshTokenValid(String token, User user);

    void revokeToken(String token);

    boolean isTokenRevoked(String token);
}
