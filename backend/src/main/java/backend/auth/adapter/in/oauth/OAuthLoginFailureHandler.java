package backend.auth.adapter.in.oauth;

import backend.config.FrontendUrlBuilder;
import backend.security.AuthCookieService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuthLoginFailureHandler implements AuthenticationFailureHandler {
    private final FrontendUrlBuilder frontendUrlBuilder;
    private final AuthCookieService authCookieService;

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException {
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        authCookieService.clearAuthCookies().forEach(cookie ->
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString())
        );
        String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrlBuilder.linkTo("/login"))
                .queryParam("oauthError", "google_login_failed")
                .build()
                .toUriString();
        response.sendRedirect(redirectUrl);
    }
}
