package backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class AuthCookieService {

    public static final String ACCESS_COOKIE_NAME = "access_token";
    public static final String REFRESH_COOKIE_NAME = "refresh_token";

    private final boolean secure;

    public AuthCookieService(@Value("${app.cookie.secure:false}") boolean secure) {
        this.secure = secure;
    }

    public ResponseCookie accessCookie(String token) {
        return cookie(ACCESS_COOKIE_NAME, token, Duration.ofMinutes(15));
    }

    public ResponseCookie refreshCookie(String token) {
        return cookie(REFRESH_COOKIE_NAME, token, Duration.ofDays(7));
    }

    public ResponseCookie clearAccessCookie() {
        return clearCookie(ACCESS_COOKIE_NAME);
    }

    public ResponseCookie clearRefreshCookie() {
        return clearCookie(REFRESH_COOKIE_NAME);
    }

    private ResponseCookie cookie(String name, String value, Duration maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path("/")
                .maxAge(maxAge)
                .build();
    }

    private ResponseCookie clearCookie(String name) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
    }
}
