package backend.security;

import backend.config.JwtProperties;
import backend.entity.Role;
import backend.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=");
        jwtService = new JwtService(properties);
    }

    @Test
    void passwordCredentialVersionChangeInvalidatesAccessAndRefreshTokens() {
        User user = User.builder()
                .email("customer@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .credentialsVersion(2)
                .build();
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        assertTrue(jwtService.isAccessTokenValid(accessToken, user));
        assertTrue(jwtService.isRefreshTokenValid(refreshToken, user));

        user.setCredentialsVersion(3);

        assertFalse(jwtService.isAccessTokenValid(accessToken, user));
        assertFalse(jwtService.isRefreshTokenValid(refreshToken, user));
    }
}
