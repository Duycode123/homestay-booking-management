package backend.auth.adapter.out.security;

import backend.auth.application.port.out.AuthSecurityPort;
import backend.entity.User;
import backend.security.JwtService;
import backend.service.TokenRevocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthSecurityAdapter implements AuthSecurityPort {

    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenRevocationService tokenRevocationService;
    private final AuthenticationManager authenticationManager;

    @Override
    public void authenticate(String email, String password) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
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

    @Override
    public String rotateRefreshToken(User user, String currentRefreshToken) {
        return jwtService.rotateRefreshToken(user, currentRefreshToken);
    }

    @Override
    public String extractUsername(String token) {
        return jwtService.extractUsername(token);
    }

    @Override
    public boolean isRefreshTokenValid(String token, User user) {
        return jwtService.isRefreshTokenValid(token, user);
    }

    @Override
    public void revokeToken(String token) {
        tokenRevocationService.revoke(token);
    }

    @Override
    public boolean isTokenRevoked(String token) {
        return tokenRevocationService.isRevoked(token);
    }
}
