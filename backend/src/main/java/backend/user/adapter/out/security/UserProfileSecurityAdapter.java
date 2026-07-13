package backend.user.adapter.out.security;

import backend.entity.User;
import backend.security.JwtService;
import backend.user.application.port.out.UserProfileSecurityPort;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserProfileSecurityAdapter implements UserProfileSecurityPort {

    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    public boolean matchesPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    @Override
    public String encodePassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    @Override
    public String generateAccessToken(User user) {
        return jwtService.generateAccessToken(user);
    }

    @Override
    public String generateRefreshToken(User user) {
        return jwtService.generateRefreshToken(user);
    }
}
