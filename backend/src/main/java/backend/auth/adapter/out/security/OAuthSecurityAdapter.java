package backend.auth.adapter.out.security;

import backend.auth.application.port.out.OAuthSecurityPort;
import backend.entity.User;
import backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OAuthSecurityAdapter implements OAuthSecurityPort {
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

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
