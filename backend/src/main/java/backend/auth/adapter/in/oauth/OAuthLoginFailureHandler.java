package backend.auth.adapter.in.oauth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuthLoginFailureHandler implements AuthenticationFailureHandler {
    @Value("${app.oauth.failure-url:http://localhost:3000/login}")
    private String failureUrl;

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException {
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        String redirectUrl = UriComponentsBuilder.fromUriString(failureUrl)
                .queryParam("oauthError", "google_login_failed")
                .build()
                .toUriString();
        response.sendRedirect(redirectUrl);
    }
}
