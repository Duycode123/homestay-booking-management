package backend.auth.application.service;

import backend.auth.application.port.in.command.LoginUserCommand;
import backend.auth.application.port.in.command.LogoutCommand;
import backend.auth.application.port.in.command.RegisterUserCommand;
import backend.auth.application.port.in.command.RequestPasswordResetCommand;
import backend.auth.application.port.in.command.ResetPasswordCommand;
import backend.auth.application.port.in.command.VerifyEmailCommand;
import backend.auth.application.port.out.AuthAccountPort;
import backend.auth.application.port.out.AuthSecurityPort;
import backend.auth.application.port.out.EmailVerificationNotificationPort;
import backend.auth.application.port.out.PasswordResetNotificationPort;
import backend.entity.Role;
import backend.entity.User;
import backend.exception.AuthException;
import backend.exception.EmailDeliveryException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionAttribute;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthUseCaseServiceTest {

    @Test
    void logoutRunsInWritableTransactionDespiteReadOnlyClassDefault() throws NoSuchMethodException {
        TransactionAttribute transaction = new AnnotationTransactionAttributeSource()
                .getTransactionAttribute(
                        AuthUseCaseService.class.getMethod("logout", LogoutCommand.class),
                        AuthUseCaseService.class
                );

        assertNotNull(transaction);
        assertFalse(transaction.isReadOnly());
    }

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
    void registerReportsServiceFailureWhenVerificationEmailCannotBeSent() {
        when(authAccountPort.existsUserByEmail("customer@example.com")).thenReturn(false);
        when(authAccountPort.existsCustomerByPhone("0912345678")).thenReturn(false);
        when(authSecurityPort.encodePassword("secret123")).thenReturn("encoded");
        when(authAccountPort.saveUser(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doThrow(new RuntimeException("SMTP unavailable"))
                .when(emailVerificationNotificationPort)
                .sendVerificationEmail(eq("customer@example.com"), any());

        EmailDeliveryException exception = assertThrows(
                EmailDeliveryException.class,
                () -> authUseCaseService.register(new RegisterUserCommand(
                        "Nguyen Van A",
                        "customer@example.com",
                        "0912345678",
                        LocalDate.of(2000, 1, 1),
                        "secret123",
                        "http://localhost:3000/verify-email?token="
                ))
        );

        assertEquals("Khong the gui email xac thuc", exception.getMessage());
        assertEquals("SMTP unavailable", exception.getCause().getMessage());
        verify(authAccountPort).saveCustomer(any());
    }

    @Test
    void requestPasswordResetReportsServiceFailureWhenEmailCannotBeSent() {
        User user = User.builder()
                .email("customer@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .build();
        when(authAccountPort.loadUserByEmail("customer@example.com")).thenReturn(Optional.of(user));
        doThrow(new RuntimeException("SMTP unavailable"))
                .when(passwordResetNotificationPort)
                .sendPasswordResetEmail(eq("customer@example.com"), any());

        EmailDeliveryException exception = assertThrows(
                EmailDeliveryException.class,
                () -> authUseCaseService.requestPasswordReset(new RequestPasswordResetCommand(
                        "customer@example.com",
                        "http://localhost:3000/reset-password?token="
                ))
        );

        assertEquals("Khong the gui email dat lai mat khau", exception.getMessage());
        assertEquals("SMTP unavailable", exception.getCause().getMessage());
        verify(authAccountPort).saveUser(user);
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

        authUseCaseService.verifyEmail(new VerifyEmailCommand("91703a4f-f75b-4ebd-a9fc-476aaea62a3f"));

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

    @Test
    void registerRejectsPasswordWithoutNumberBeforePersistence() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authUseCaseService.register(new RegisterUserCommand(
                        "Nguyen Van A",
                        "customer@example.com",
                        "0912345678",
                        LocalDate.of(2000, 1, 1),
                        "onlyletters",
                        "http://localhost:3000/verify-email?token="
                ))
        );

        assertEquals("Mat khau phai co it nhat mot chu cai va mot chu so", exception.getMessage());
    }

    @Test
    void registerRejectsFullNameShorterThanTwoCharactersAfterTrimming() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authUseCaseService.register(new RegisterUserCommand(
                        " A ",
                        "customer@example.com",
                        "0912345678",
                        LocalDate.of(2000, 1, 1),
                        "password1",
                        "http://localhost:3000/verify-email?token="
                ))
        );

        assertEquals("Ho ten phai co tu 2 den 100 ky tu", exception.getMessage());
    }

    @Test
    void resetPasswordRejectsMalformedTokenBeforePersistence() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authUseCaseService.resetPassword(new ResetPasswordCommand(
                        "not-a-uuid",
                        "newPassword1"
                ))
        );

        assertEquals("Token dat lai mat khau khong hop le", exception.getMessage());
    }

    @Test
    void resetPasswordRejectsWeakPasswordBeforePersistence() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authUseCaseService.resetPassword(new ResetPasswordCommand(
                        "91703a4f-f75b-4ebd-a9fc-476aaea62a3f",
                        "onlyletters"
                ))
        );

        assertEquals("Mat khau phai co it nhat mot chu cai va mot chu so", exception.getMessage());
    }

    @Test
    void resetPasswordUsesHashedTokenAndInvalidatesExistingSessions() {
        User user = User.builder()
                .email("customer@example.com")
                .password("old-encoded")
                .role(Role.CUSTOMER)
                .credentialsVersion(4)
                .resetToken("stored-hash")
                .resetTokenExpiresAt(java.time.LocalDateTime.now().plusMinutes(10))
                .build();
        when(authAccountPort.loadUserByResetToken(any())).thenReturn(Optional.of(user));
        when(authSecurityPort.encodePassword("newPassword1")).thenReturn("new-encoded");

        authUseCaseService.resetPassword(new ResetPasswordCommand(
                "91703a4f-f75b-4ebd-a9fc-476aaea62a3f",
                "newPassword1"
        ));

        ArgumentCaptor<String> tokenHashCaptor = ArgumentCaptor.forClass(String.class);
        verify(authAccountPort).loadUserByResetToken(tokenHashCaptor.capture());
        assertEquals(64, tokenHashCaptor.getValue().length());
        assertFalse(tokenHashCaptor.getValue().contains("91703a4f"));
        assertEquals("new-encoded", user.getPassword());
        assertEquals(5, user.getCredentialsVersion());
        assertEquals(null, user.getResetToken());
        verify(authAccountPort).saveUser(user);
    }

    @Test
    void verifyEmailRejectsMalformedTokenBeforeLookup() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> authUseCaseService.verifyEmail(new VerifyEmailCommand("not-a-uuid"))
        );

        assertEquals("Token xac thuc email khong hop le", exception.getMessage());
    }
}
