package backend.auth.application.service;

import backend.auth.application.port.in.command.LoginUserCommand;
import backend.auth.application.port.in.command.RegisterUserCommand;
import backend.auth.application.port.in.command.VerifyEmailCommand;
import backend.auth.application.port.out.AuthAccountPort;
import backend.auth.application.port.out.AuthSecurityPort;
import backend.auth.application.port.out.EmailVerificationNotificationPort;
import backend.auth.application.port.out.PasswordResetNotificationPort;
import backend.entity.Role;
import backend.entity.User;
import backend.exception.AuthException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthUseCaseServiceTest {

    @Mock
    private AuthAccountPort authAccountPort;

    @Mock
    private AuthSecurityPort authSecurityPort;

    @Mock
    private PasswordResetNotificationPort passwordResetNotificationPort;

    @Mock
    private EmailVerificationNotificationPort emailVerificationNotificationPort;

    private AuthUseCaseService authUseCaseService;

    @BeforeEach
    void setUp() {
        authUseCaseService = new AuthUseCaseService(
                authAccountPort,
                authSecurityPort,
                passwordResetNotificationPort,
                emailVerificationNotificationPort
        );
    }

    @Test
    void registerCreatesUnverifiedAccountAndSendsVerificationEmail() {
        when(authAccountPort.existsUserByEmail("customer@example.com")).thenReturn(false);
        when(authAccountPort.existsCustomerByPhone("0912345678")).thenReturn(false);
        when(authSecurityPort.encodePassword("secret123")).thenReturn("encoded");
        when(authAccountPort.saveUser(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authUseCaseService.register(new RegisterUserCommand(
                "Nguyen Van A",
                "customer@example.com",
                "0912345678",
                LocalDate.of(2000, 1, 1),
                "secret123",
                "http://localhost:3000/verify-email?token="
        ));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(authAccountPort).saveUser(userCaptor.capture());
        User savedUser = userCaptor.getValue();

        assertFalse(savedUser.isEmailVerified());
        assertTrue(savedUser.getEmailVerificationTokenHash() != null && !savedUser.getEmailVerificationTokenHash().isBlank());
        assertTrue(savedUser.getEmailVerificationExpiresAt() != null);
        verify(emailVerificationNotificationPort).sendVerificationEmail(
                eq("customer@example.com"),
                org.mockito.ArgumentMatchers.startsWith("http://localhost:3000/verify-email?token=")
        );
    }

    @Test
    void registerDoesNotFailWhenVerificationEmailCannotBeSent() {
        when(authAccountPort.existsUserByEmail("customer@example.com")).thenReturn(false);
        when(authAccountPort.existsCustomerByPhone("0912345678")).thenReturn(false);
        when(authSecurityPort.encodePassword("secret123")).thenReturn("encoded");
        when(authAccountPort.saveUser(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doThrow(new RuntimeException("SMTP unavailable"))
                .when(emailVerificationNotificationPort)
                .sendVerificationEmail(eq("customer@example.com"), any());

        assertDoesNotThrow(() -> authUseCaseService.register(new RegisterUserCommand(
                "Nguyen Van A",
                "customer@example.com",
                "0912345678",
                LocalDate.of(2000, 1, 1),
                "secret123",
                "http://localhost:3000/verify-email?token="
        )));

        verify(authAccountPort).saveCustomer(any());
    }

    @Test
    void loginRejectsUnverifiedAccount() {
        User user = User.builder()
                .email("customer@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .emailVerified(false)
                .build();

        when(authAccountPort.loadUserByEmail("customer@example.com")).thenReturn(Optional.of(user));

        assertThrows(
                AuthException.class,
                () -> authUseCaseService.login(new LoginUserCommand("customer@example.com", "secret123"))
        );
    }

    @Test
    void verifyEmailMarksAccountVerifiedAndClearsToken() {
        when(authAccountPort.loadUserByEmailVerificationTokenHash(any())).thenReturn(Optional.of(User.builder()
                .email("customer@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .emailVerified(false)
                .emailVerificationTokenHash("hash")
                .emailVerificationExpiresAt(java.time.LocalDateTime.now().plusHours(1))
                .emailVerificationSentAt(java.time.LocalDateTime.now())
                .build()));

        authUseCaseService.verifyEmail(new VerifyEmailCommand("raw-token"));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(authAccountPort).saveUser(userCaptor.capture());
        User verifiedUser = userCaptor.getValue();

        assertTrue(verifiedUser.isEmailVerified());
        assertTrue(verifiedUser.getEmailVerificationTokenHash() == null);
        assertTrue(verifiedUser.getEmailVerificationExpiresAt() == null);
    }

    @Test
    void registerRejectsDisposableEmailDomain() {
        assertThrows(
                AuthException.class,
                () -> authUseCaseService.register(new RegisterUserCommand(
                        "Nguyen Van A",
                        "customer@mailinator.com",
                        "0912345678",
                        LocalDate.of(2000, 1, 1),
                        "secret123",
                        "http://localhost:3000/verify-email?token="
                ))
        );
    }
}
