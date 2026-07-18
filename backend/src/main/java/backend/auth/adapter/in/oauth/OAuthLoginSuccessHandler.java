package backend.auth.adapter.in.oauth;

import backend.auth.application.port.in.AuthenticateOAuthUserUseCase;
import backend.auth.application.port.in.command.OAuthUserCommand;
import backend.config.FrontendUrlBuilder;
import backend.dto.response.AuthResponse;
import backend.security.AuthCookieService;
import backend.security.AuthenticationSessionService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuthLoginSuccessHandler implements AuthenticationSuccessHandler {
    private final AuthenticateOAuthUserUseCase authenticateOAuthUserUseCase;
    private final AuthCookieService authCookieService;
    private final AuthenticationSessionService authenticationSessionService;
    private final OAuthLoginFailureHandler failureHandler;
    private final FrontendUrlBuilder frontendUrlBuilder;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        if (!(authentication instanceof OAuth2AuthenticationToken oauthToken)) {
            throw new ServletException("OAuth authentication type is not supported");
        }

        try {
            OAuth2User principal = oauthToken.getPrincipal();
            AuthResponse authResponse = authenticateOAuthUserUseCase.authenticate(new OAuthUserCommand(
                    oauthToken.getAuthorizedClientRegistrationId(),
                    principal.getAttribute("sub"),
                    principal.getAttribute("email"),
                    Boolean.TRUE.equals(principal.<Boolean>getAttribute("email_verified")),
                    principal.getAttribute("name"),
                    principal.getAttribute("picture")
            ));

            authenticationSessionService.clear(request);
            authCookieService.clearAuthCookies().forEach(cookie ->
                    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString())
            );
            response.addHeader(HttpHeaders.SET_COOKIE, authCookieService.accessCookie(authResponse.getAccessToken()).toString());
            response.addHeader(HttpHeaders.SET_COOKIE, authCookieService.refreshCookie(authResponse.getRefreshToken()).toString());
            response.sendRedirect(frontendUrlBuilder.linkTo("/oauth/callback"));
        } catch (RuntimeException exception) {
            failureHandler.onAuthenticationFailure(
                    request,
                    response,
                    new OAuth2AuthenticationException(
                            new OAuth2Error("oauth_account_rejected"),
                            "OAuth account could not be accepted",
                            exception
                    )
            );
        }
    }
}
