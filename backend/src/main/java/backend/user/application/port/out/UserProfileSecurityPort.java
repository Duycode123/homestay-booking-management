package backend.user.application.port.out;

import backend.entity.User;

public interface UserProfileSecurityPort {
    boolean matchesPassword(String rawPassword, String encodedPassword);

    String encodePassword(String rawPassword);

    String generateAccessToken(User user);

    String generateRefreshToken(User user);
}
