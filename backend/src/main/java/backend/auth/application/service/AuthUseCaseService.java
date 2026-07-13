package backend.auth.application.service;

import backend.auth.application.port.in.LoginUserUseCase;
import backend.auth.application.port.in.LogoutUseCase;
import backend.auth.application.port.in.RefreshSessionUseCase;
import backend.auth.application.port.in.RegisterUserUseCase;
import backend.auth.application.port.in.ResendEmailVerificationUseCase;
import backend.auth.application.port.in.RequestPasswordResetUseCase;
import backend.auth.application.port.in.ResetPasswordUseCase;
import backend.auth.application.port.in.VerifyEmailUseCase;
import backend.auth.application.port.in.command.LoginUserCommand;
import backend.auth.application.port.in.command.LogoutCommand;
import backend.auth.application.port.in.command.RefreshSessionCommand;
import backend.auth.application.port.in.command.RegisterUserCommand;
import backend.auth.application.port.in.command.ResendEmailVerificationCommand;
import backend.auth.application.port.in.command.RequestPasswordResetCommand;
import backend.auth.application.port.in.command.ResetPasswordCommand;
import backend.auth.application.port.in.command.VerifyEmailCommand;
import backend.auth.application.port.out.AuthAccountPort;
import backend.auth.application.port.out.AuthSecurityPort;
import backend.auth.application.port.out.EmailVerificationNotificationPort;
import backend.auth.application.port.out.PasswordResetNotificationPort;
import backend.dto.response.AuthResponse;
import backend.entity.Customer;
import backend.entity.Role;
import backend.entity.User;
import backend.exception.AuthException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthUseCaseService implements
        RegisterUserUseCase,
        LoginUserUseCase,
        RefreshSessionUseCase,
        LogoutUseCase,
        RequestPasswordResetUseCase,
        ResetPasswordUseCase,
        VerifyEmailUseCase,
        ResendEmailVerificationUseCase {

    private static final int EMAIL_VERIFICATION_EXPIRATION_HOURS = 24;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MIN_CUSTOMER_AGE = 13;
    private static final Logger LOGGER = LoggerFactory.getLogger(AuthUseCaseService.class);
    private static final Set<String> BLOCKED_EMAIL_DOMAINS = Set.of(
            "10minutemail.com",
            "guerrillamail.com",
            "mailinator.com",
            "temp-mail.org",
            "tempmail.com",
            "yopmail.com"
    );

    private final AuthAccountPort authAccountPort;
    private final AuthSecurityPort authSecurityPort;
    private final PasswordResetNotificationPort passwordResetNotificationPort;
    private final EmailVerificationNotificationPort emailVerificationNotificationPort;

    @Override
    @Transactional
    public AuthResponse register(RegisterUserCommand command) {
        String fullName = normalizeRequired(command.fullName(), "Ho ten khong duoc de trong");
        String email = normalizeEmail(command.email());
        String phone = normalizeRequired(command.phone(), "So dien thoai khong duoc de trong");
        String password = normalizeRequired(command.password(), "Mat khau khong duoc de trong");
        validateDateOfBirth(command.dateOfBirth());
        String emailVerificationUrlBase = normalizeRequired(
                command.emailVerificationUrlBase(),
                "Duong dan xac thuc email khong hop le"
        );

        rejectDisposableEmail(email);
        if (authAccountPort.existsUserByEmail(email)) {
            throw new AuthException("Email nay da duoc dang ky su dung he thong!");
        }
        if (authAccountPort.existsCustomerByPhone(phone)) {
            throw new AuthException("So dien thoai nay da duoc dang ky su dung he thong!");
        }

        User account = User.builder()
                .email(email)
                .password(authSecurityPort.encodePassword(password))
                .role(Role.CUSTOMER)
                .emailVerified(false)
                .build();
        String verificationToken = prepareEmailVerification(account);

        User savedUser = authAccountPort.saveUser(account);

        Customer customer = Customer.builder()
                .account(savedUser)
                .fullName(fullName)
                .phone(phone)
                .email(email)
                .dateOfBirth(command.dateOfBirth())
                .build();

        authAccountPort.saveCustomer(customer);
        sendVerificationEmailSafely(
                savedUser.getEmail(),
                emailVerificationUrlBase + verificationToken
        );

        return AuthResponse.builder()
                .role(savedUser.getRole() != null ? savedUser.getRole().name() : Role.CUSTOMER.name())
                .email(savedUser.getEmail())
                .emailVerificationRequired(true)
                .build();
    }

    @Override
    public AuthResponse login(LoginUserCommand command) {
        String email = normalizeEmail(command.email());
        String password = normalizeRequired(command.password(), "Mat khau khong duoc de trong");

        authSecurityPort.authenticate(email, password);

        User user = authAccountPort.loadUserByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Tai khoan hoac mat khau khong chinh xac"));

        if (!user.isEnabled()) {
            throw new AuthException("Tai khoan da bi vo hieu hoa.");
        }

        if (!user.isEmailVerified()) {
            throw new AuthException("Vui long xac thuc email truoc khi dang nhap.");
        }

        return AuthResponse.builder()
                .accessToken(authSecurityPort.generateAccessToken(user))
                .refreshToken(authSecurityPort.generateRefreshToken(user))
                .role(user.getRole() != null ? user.getRole().name() : Role.CUSTOMER.name())
                .email(user.getEmail())
                .build();
    }

    @Override
    @Transactional
    public AuthResponse refresh(RefreshSessionCommand command) {
        String refreshToken = normalizeRequired(command.refreshToken(), "Khong tim thay refresh token");

        if (authSecurityPort.isTokenRevoked(refreshToken)) {
            throw new BadCredentialsException("Refresh token da bi thu hoi");
        }

        String email;
        try {
            email = authSecurityPort.extractUsername(refreshToken);
        } catch (RuntimeException ex) {
            throw new BadCredentialsException("Refresh token khong hop le", ex);
        }

        User user = authAccountPort.loadUserByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Tai khoan khong con ton tai"));

        if (!user.isEnabled()) {
            throw new BadCredentialsException("Tai khoan da bi vo hieu hoa");
        }

        if (!authSecurityPort.isRefreshTokenValid(refreshToken, user)) {
            throw new BadCredentialsException("Refresh token khong hop le hoac da het han");
        }

        String newAccessToken = authSecurityPort.generateAccessToken(user);
        String newRefreshToken;
        try {
            newRefreshToken = authSecurityPort.rotateRefreshToken(user, refreshToken);
        } catch (RuntimeException ex) {
            throw new BadCredentialsException("Phien dang nhap da het han", ex);
        }

        authSecurityPort.revokeToken(refreshToken);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .role(user.getRole() != null ? user.getRole().name() : Role.CUSTOMER.name())
                .email(user.getEmail())
                .build();
    }

    @Override
    public void logout(LogoutCommand command) {
        authSecurityPort.revokeToken(command.accessToken());
        authSecurityPort.revokeToken(command.refreshToken());
    }

    @Override
    @Transactional
    public void requestPasswordReset(RequestPasswordResetCommand command) {
        String email = normalizeEmail(command.email());
        String resetPasswordUrlBase = normalizeRequired(
                command.resetPasswordUrlBase(),
                "Duong dan dat lai mat khau khong hop le"
        );

        User user = authAccountPort.loadUserByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email khong ton tai"));

        String token = UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiresAt(LocalDateTime.now().plusMinutes(30));
        authAccountPort.saveUser(user);

        sendPasswordResetEmailSafely(
                user.getEmail(),
                resetPasswordUrlBase + token
        );
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordCommand command) {
        String token = normalizeRequired(command.token(), "Token dat lai mat khau khong hop le");
        String newPassword = normalizeRequired(command.newPassword(), "Mat khau moi khong duoc de trong");

        User user = authAccountPort.loadUserByResetToken(token)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Lien ket doi mat khau khong hop le hoac da het han!"
                ));

        if (user.getResetTokenExpiresAt() == null
                || user.getResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            user.setResetToken(null);
            user.setResetTokenExpiresAt(null);
            authAccountPort.saveUser(user);
            throw new IllegalArgumentException("Lien ket doi mat khau khong hop le hoac da het han!");
        }

        user.setPassword(authSecurityPort.encodePassword(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiresAt(null);
        authAccountPort.saveUser(user);
    }

    @Override
    @Transactional
    public void verifyEmail(VerifyEmailCommand command) {
        String token = normalizeRequired(command.token(), "Token xac thuc email khong hop le");
        String tokenHash = hashToken(token);

        User user = authAccountPort.loadUserByEmailVerificationTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Lien ket xac thuc email khong hop le hoac da het han"));

        if (user.isEmailVerified()) {
            clearEmailVerification(user);
            authAccountPort.saveUser(user);
            return;
        }

        if (user.getEmailVerificationExpiresAt() == null
                || user.getEmailVerificationExpiresAt().isBefore(LocalDateTime.now())) {
            clearEmailVerification(user);
            authAccountPort.saveUser(user);
            throw new IllegalArgumentException("Lien ket xac thuc email khong hop le hoac da het han");
        }

        user.setEmailVerified(true);
        clearEmailVerification(user);
        authAccountPort.saveUser(user);
    }

    @Override
    @Transactional
    public void resendVerificationEmail(ResendEmailVerificationCommand command) {
        String email = normalizeEmail(command.email());
        String emailVerificationUrlBase = normalizeRequired(
                command.emailVerificationUrlBase(),
                "Duong dan xac thuc email khong hop le"
        );

        User user = authAccountPort.loadUserByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email khong ton tai"));

        if (user.isEmailVerified()) {
            throw new IllegalStateException("Email nay da duoc xac thuc");
        }

        if (user.getEmailVerificationSentAt() != null
                && user.getEmailVerificationSentAt().plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
            throw new IllegalStateException("Vui long doi it nhat 60 giay truoc khi gui lai email xac thuc");
        }

        String verificationToken = prepareEmailVerification(user);
        authAccountPort.saveUser(user);
        sendVerificationEmailSafely(
                user.getEmail(),
                emailVerificationUrlBase + verificationToken
        );
    }

    private String prepareEmailVerification(User user) {
        String token = UUID.randomUUID().toString();
        user.setEmailVerificationTokenHash(hashToken(token));
        user.setEmailVerificationExpiresAt(LocalDateTime.now().plusHours(EMAIL_VERIFICATION_EXPIRATION_HOURS));
        user.setEmailVerificationSentAt(LocalDateTime.now());
        return token;
    }

    private void sendVerificationEmailSafely(String email, String verificationLink) {
        try {
            emailVerificationNotificationPort.sendVerificationEmail(email, verificationLink);
        } catch (RuntimeException ex) {
            LOGGER.warn("Could not send verification email to {}", email, ex);
        }
    }

    private void sendPasswordResetEmailSafely(String email, String resetLink) {
        try {
            passwordResetNotificationPort.sendPasswordResetEmail(email, resetLink);
        } catch (RuntimeException ex) {
            LOGGER.warn("Could not send password reset email to {}", email, ex);
        }
    }

    private void clearEmailVerification(User user) {
        user.setEmailVerificationTokenHash(null);
        user.setEmailVerificationExpiresAt(null);
        user.setEmailVerificationSentAt(null);
    }

    private void rejectDisposableEmail(String email) {
        String domain = email.substring(email.indexOf('@') + 1);
        if (BLOCKED_EMAIL_DOMAINS.contains(domain)) {
            throw new AuthException("Email tam thoi khong duoc ho tro. Vui long su dung email ca nhan hoac email doanh nghiep.");
        }
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashedBytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashedBytes);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Khong the tao ma xac thuc email", ex);
        }
    }

    private String normalizeRequired(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }

    private String normalizeEmail(String email) {
        return normalizeRequired(email, "Email khong duoc de trong").toLowerCase();
    }

    private void validateDateOfBirth(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            throw new IllegalArgumentException("Ngay sinh khong duoc de trong");
        }

        if (dateOfBirth.isAfter(LocalDate.now().minusYears(MIN_CUSTOMER_AGE))) {
            throw new IllegalArgumentException("Ban phai du 13 tuoi de tao tai khoan");
        }
    }
}
