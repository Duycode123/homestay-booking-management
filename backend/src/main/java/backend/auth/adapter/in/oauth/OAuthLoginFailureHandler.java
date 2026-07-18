package backend.auth.adapter.in.oauth;

import backend.config.FrontendUrlBuilder;
import backend.security.AuthCookieService;
import backend.security.AuthenticationSessionService;
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
    private final AuthenticationSessionService authenticationSessionService;

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException {
        authenticationSessionService.clear(request);
        authCookieService.clearAuthCookies().forEach(cookie ->
                response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString())
        );
        String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrlBuilder.linkTo("/login"))
                .queryParam("oauthError", "oauth_login_failed")
                .build()
                .toUriString();
        response.sendRedirect(redirectUrl);
    }
}
