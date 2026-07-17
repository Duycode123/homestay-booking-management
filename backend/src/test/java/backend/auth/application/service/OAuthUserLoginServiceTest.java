package backend.auth.application.service;

import backend.auth.application.port.in.command.OAuthUserCommand;
import backend.auth.application.port.out.AuthAccountPort;
import backend.auth.application.port.out.OAuthIdentityPort;
import backend.auth.application.port.out.OAuthSecurityPort;
import backend.dto.response.AuthResponse;
import backend.entity.Role;
import backend.entity.User;
import backend.exception.AuthException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OAuthUserLoginServiceTest {
    @Mock
    private AuthAccountPort authAccountPort;
    @Mock
    private OAuthIdentityPort oauthIdentityPort;
    @Mock
    private OAuthSecurityPort oauthSecurityPort;

    private OAuthUserLoginService service;

    @BeforeEach
    void setUp() {
        service = new OAuthUserLoginService(authAccountPort, oauthIdentityPort, oauthSecurityPort);
    }

    @Test
    void createsVerifiedCustomerAndLinksGoogleIdentity() {
        when(oauthIdentityPort.findAccountId("GOOGLE", "google-123")).thenReturn(Optional.empty());
        when(authAccountPort.loadUserByEmail("guest@example.com")).thenReturn(Optional.empty());
        when(oauthSecurityPort.encodePassword(any())).thenReturn("encoded-random-password");
        when(authAccountPort.saveUser(any())).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(42);
            return user;
        });
        when(oauthSecurityPort.generateAccessToken(any())).thenReturn("access");
        when(oauthSecurityPort.generateRefreshToken(any())).thenReturn("refresh");

        AuthResponse response = service.authenticate(command());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(authAccountPort).saveUser(userCaptor.capture());
        assertEquals(Role.CUSTOMER, userCaptor.getValue().getRole());
        assertTrue(userCaptor.getValue().isEmailVerified());
        assertEquals("https://example.com/avatar.jpg", userCaptor.getValue().getAvatarUrl());
        verify(authAccountPort).saveCustomer(any());
        verify(oauthIdentityPort).link(42, "GOOGLE", "google-123");
        assertEquals("CUSTOMER", response.getRole());
        assertEquals("access", response.getAccessToken());
    }

    @Test
    void reusesAccountAlreadyLinkedToGoogle() {
        User user = User.builder()
                .id(7)
                .email("guest@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .enabled(true)
                .build();
        when(oauthIdentityPort.findAccountId("GOOGLE", "google-123")).thenReturn(Optional.of(7));
        when(authAccountPort.loadUserById(7)).thenReturn(Optional.of(user));
        when(oauthSecurityPort.generateAccessToken(user)).thenReturn("access");
        when(oauthSecurityPort.generateRefreshToken(user)).thenReturn("refresh");

        service.authenticate(command());

        verify(oauthIdentityPort).recordLogin("GOOGLE", "google-123");
    }

    @Test
    void refusesToLinkGoogleToAdministrativeAccount() {
        User admin = User.builder()
                .email("guest@example.com")
                .password("encoded")
                .role(Role.ADMIN)
                .emailVerified(true)
                .enabled(true)
                .build();
        when(oauthIdentityPort.findAccountId("GOOGLE", "google-123")).thenReturn(Optional.empty());
        when(authAccountPort.loadUserByEmail("guest@example.com")).thenReturn(Optional.of(admin));

        assertThrows(AuthException.class, () -> service.authenticate(command()));
    }

    @Test
    void refusesUnverifiedGoogleEmail() {
        OAuthUserCommand command = new OAuthUserCommand(
                "google", "google-123", "guest@example.com", false,
                "Nguyen Van A", "https://example.com/avatar.jpg"
        );

        assertThrows(AuthException.class, () -> service.authenticate(command));
    }

    private OAuthUserCommand command() {
        return new OAuthUserCommand(
                "google", "google-123", "guest@example.com", true,
                "Nguyen Van A", "https://example.com/avatar.jpg"
        );
    }
}
