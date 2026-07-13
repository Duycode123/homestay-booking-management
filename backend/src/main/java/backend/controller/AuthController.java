package backend.controller;

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
import backend.dto.request.LoginRequest;
import backend.dto.request.RegisterRequest;
import backend.dto.request.ResendEmailVerificationRequest;
import backend.dto.request.ResetPasswordRequest;
import backend.dto.request.VerifyEmailRequest;
import backend.dto.response.AuthResponse;
import backend.entity.User;
import backend.security.AuthCookieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final RegisterUserUseCase registerUserUseCase;
    private final LoginUserUseCase loginUserUseCase;
    private final RefreshSessionUseCase refreshSessionUseCase;
    private final LogoutUseCase logoutUseCase;
    private final RequestPasswordResetUseCase requestPasswordResetUseCase;
    private final ResetPasswordUseCase resetPasswordUseCase;
    private final VerifyEmailUseCase verifyEmailUseCase;
    private final ResendEmailVerificationUseCase resendEmailVerificationUseCase;
    private final AuthCookieService authCookieService;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody @Valid RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(registerUserUseCase.register(new RegisterUserCommand(
                        request.getFullName(),
                        request.getEmail(),
                        request.getPhone(),
                        request.getDateOfBirth(),
                        request.getPassword(),
                        frontendLink("/verify-email?token=")
                )));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request) {
        AuthResponse response = loginUserUseCase.login(new LoginUserCommand(
                request.getEmail(),
                request.getPassword()
        ));

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookieService.accessCookie(response.getAccessToken()).toString())
                .header(HttpHeaders.SET_COOKIE, authCookieService.refreshCookie(response.getRefreshToken()).toString())
                .body(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(value = AuthCookieService.REFRESH_COOKIE_NAME, required = false) String refreshToken
    ) {
        AuthResponse response = refreshSessionUseCase.refresh(new RefreshSessionCommand(refreshToken));

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookieService.accessCookie(response.getAccessToken()).toString())
                .header(HttpHeaders.SET_COOKIE, authCookieService.refreshCookie(response.getRefreshToken()).toString())
                .body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @CookieValue(value = AuthCookieService.ACCESS_COOKIE_NAME, required = false) String accessToken,
            @CookieValue(value = AuthCookieService.REFRESH_COOKIE_NAME, required = false) String refreshToken
    ) {
        logoutUseCase.logout(new LogoutCommand(accessToken, refreshToken));

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookieService.clearAccessCookie().toString())
                .header(HttpHeaders.SET_COOKIE, authCookieService.clearRefreshCookie().toString())
                .body(Map.of("message", "\u0110\u0103ng xu\u1ea5t th\u00e0nh c\u00f4ng"));
    }

    @GetMapping("/session")
    public ResponseEntity<Map<String, String>> session(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof User user)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Phien dang nhap khong hop le"));
        }

        return ResponseEntity.ok(Map.of("role", user.getRole().name()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody(required = false) Map<String, String> request) {
        String email = request == null ? null : request.get("email");

        requestPasswordResetUseCase.requestPasswordReset(new RequestPasswordResetCommand(
                email,
                frontendLink("/reset-password?token=")
        ));

        return ResponseEntity.ok(Map.of(
                "message",
                "He thong da gui lien ket dat lai mat khau vao email cua ban"
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody(required = false) ResetPasswordRequest request) {
        resetPasswordUseCase.resetPassword(new ResetPasswordCommand(
                request == null ? null : request.getToken(),
                request == null ? null : request.getNewPassword()
        ));

        return ResponseEntity.ok(Map.of("message", "Doi mat khau thanh cong"));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestBody @Valid VerifyEmailRequest request) {
        verifyEmailUseCase.verifyEmail(new VerifyEmailCommand(request.getToken()));

        return ResponseEntity.ok(Map.of("message", "Xac thuc email thanh cong"));
    }

    @PostMapping("/resend-verification-email")
    public ResponseEntity<Map<String, String>> resendVerificationEmail(
            @RequestBody @Valid ResendEmailVerificationRequest request
    ) {
        resendEmailVerificationUseCase.resendVerificationEmail(new ResendEmailVerificationCommand(
                request.getEmail(),
                frontendLink("/verify-email?token=")
        ));

        return ResponseEntity.ok(Map.of("message", "He thong da gui lai email xac thuc"));
    }

    private String frontendLink(String path) {
        return frontendBaseUrl.replaceAll("/+$", "") + path;
    }
}
