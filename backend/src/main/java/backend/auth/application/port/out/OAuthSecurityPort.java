package backend.auth.application.port.out;

import backend.entity.User;

public interface OAuthSecurityPort {
    String encodePassword(String rawPassword);

    String generateAccessToken(User user);

    String generateRefreshToken(User user);
}
