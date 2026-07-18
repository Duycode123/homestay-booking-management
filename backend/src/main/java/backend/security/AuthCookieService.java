package backend.security;

import backend.config.JwtProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

@Component
public class AuthCookieService {

    public static final String ACCESS_COOKIE_NAME = "access_token";
    public static final String REFRESH_COOKIE_NAME = "refresh_token";

    private final boolean secure;
    private final JwtProperties jwtProperties;

    public AuthCookieService(
            @Value("${app.cookie.secure:false}") boolean secure,
            JwtProperties jwtProperties
    ) {
        this.secure = secure;
        this.jwtProperties = jwtProperties;
    }

    public ResponseCookie accessCookie(String token) {
        return cookie(ACCESS_COOKIE_NAME, token, jwtProperties.getAccessTokenExpiration());
    }

    public ResponseCookie refreshCookie(String token) {
        return cookie(REFRESH_COOKIE_NAME, token, jwtProperties.getRefreshTokenExpiration());
    }

    public ResponseCookie clearAccessCookie() {
        return clearCookie(ACCESS_COOKIE_NAME, "/");
    }

    public ResponseCookie clearRefreshCookie() {
        return clearCookie(REFRESH_COOKIE_NAME, "/");
    }

    /**
     * Clear current and legacy cookie paths. Older deployments scoped auth
     * cookies to /api or /api/auth, so clearing only Path=/ can leave a valid
     * account cookie that becomes visible again after logout.
     */
    public List<ResponseCookie> clearAuthCookies() {
        return List.of(
                clearCookie(ACCESS_COOKIE_NAME, "/"),
                clearCookie(REFRESH_COOKIE_NAME, "/"),
                clearCookie(ACCESS_COOKIE_NAME, "/api"),
                clearCookie(REFRESH_COOKIE_NAME, "/api"),
                clearCookie(ACCESS_COOKIE_NAME, "/api/auth"),
                clearCookie(REFRESH_COOKIE_NAME, "/api/auth")
        );
    }

    private ResponseCookie cookie(String name, String value, Duration maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                // OAuth returns through a top-level cross-site navigation from Google.
                // Lax still blocks cross-site subrequests while supporting that redirect.
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build();
    }

    private ResponseCookie clearCookie(String name, String path) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path(path)
                .maxAge(Duration.ZERO)
                .build();
    }
}
