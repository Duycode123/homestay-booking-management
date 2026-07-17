package backend.auth.application.service;

import backend.auth.application.port.in.AuthenticateOAuthUserUseCase;
import backend.auth.application.port.in.command.OAuthUserCommand;
import backend.auth.application.port.out.AuthAccountPort;
import backend.auth.application.port.out.AuthSecurityPort;
import backend.auth.application.port.out.OAuthIdentityPort;
import backend.dto.response.AuthResponse;
import backend.entity.Customer;
import backend.entity.Role;
import backend.entity.User;
import backend.exception.AuthException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OAuthUserLoginService implements AuthenticateOAuthUserUseCase {

    private static final String GOOGLE = "GOOGLE";

    private final AuthAccountPort authAccountPort;
    private final OAuthIdentityPort oauthIdentityPort;
    private final AuthSecurityPort authSecurityPort;

    @Override
    @Transactional
    public AuthResponse authenticate(OAuthUserCommand command) {
        String provider = normalizeProvider(command.provider());
        String subject = require(command.providerSubject(), "Google khong tra ve ma dinh danh");
        String email = require(command.email(), "Google khong tra ve email").toLowerCase(Locale.ROOT);

        if (!command.emailVerified()) {
            throw new AuthException("Email Google chua duoc xac minh");
        }

        User user = oauthIdentityPort.findAccountId(provider, subject)
                .flatMap(authAccountPort::loadUserById)
                .orElseGet(() -> linkOrCreateCustomer(command, provider, subject, email));

        if (!user.isEnabled()) {
            throw new AuthException("Tai khoan da bi khoa. Vui long lien he ho tro");
        }
        if (user.getRole() != Role.CUSTOMER) {
            throw new AuthException("Tai khoan quan tri va nhan vien khong duoc dang nhap bang Google");
        }

        oauthIdentityPort.recordLogin(provider, subject);
        return AuthResponse.builder()
                .accessToken(authSecurityPort.generateAccessToken(user))
                .refreshToken(authSecurityPort.generateRefreshToken(user))
                .role(user.getRole().name())
                .email(user.getEmail())
                .emailVerificationRequired(false)
                .build();
    }

    private User linkOrCreateCustomer(
            OAuthUserCommand command,
            String provider,
            String subject,
            String email
    ) {
        User existingUser = authAccountPort.loadUserByEmail(email).orElse(null);
        if (existingUser != null) {
            if (existingUser.getRole() != Role.CUSTOMER) {
                throw new AuthException("Email nay dang thuoc tai khoan quan tri hoac nhan vien");
            }
            if (!existingUser.isEnabled()) {
                throw new AuthException("Tai khoan da bi khoa. Vui long lien he ho tro");
            }
            existingUser.setEmailVerified(true);
            if (isBlank(existingUser.getAvatarUrl()) && !isBlank(command.avatarUrl())) {
                existingUser.setAvatarUrl(command.avatarUrl().trim());
            }
            User savedUser = authAccountPort.saveUser(existingUser);
            oauthIdentityPort.link(savedUser.getId(), provider, subject);
            return savedUser;
        }

        User newUser = User.builder()
                .email(email)
                .password(authSecurityPort.encodePassword(UUID.randomUUID().toString()))
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .enabled(true)
                .avatarUrl(isBlank(command.avatarUrl()) ? null : command.avatarUrl().trim())
                .build();
        User savedUser = authAccountPort.saveUser(newUser);

        Customer customer = Customer.builder()
                .account(savedUser)
                .fullName(resolveName(command.fullName(), email))
                .email(email)
                .build();
        authAccountPort.saveCustomer(customer);
        oauthIdentityPort.link(savedUser.getId(), provider, subject);
        return savedUser;
    }

    private String normalizeProvider(String provider) {
        String normalized = require(provider, "Nha cung cap dang nhap khong hop le").toUpperCase(Locale.ROOT);
        if (!GOOGLE.equals(normalized)) {
            throw new AuthException("Nha cung cap dang nhap chua duoc ho tro");
        }
        return normalized;
    }

    private String resolveName(String fullName, String email) {
        if (!isBlank(fullName)) {
            return fullName.trim().substring(0, Math.min(fullName.trim().length(), 100));
        }
        return email.substring(0, email.indexOf('@'));
    }

    private String require(String value, String message) {
        if (isBlank(value)) {
            throw new AuthException(message);
        }
        return value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
