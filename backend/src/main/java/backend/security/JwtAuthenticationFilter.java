package backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;
import backend.service.TokenRevocationService;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.Enumeration;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Set<String> PUBLIC_AUTH_PATHS = Set.of(
            "/api/auth/csrf",
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/auth/logout",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/verify-email",
            "/api/auth/resend-verification-email"
    );

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final TokenRevocationService tokenRevocationService;

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return PUBLIC_AUTH_PATHS.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        List<String> tokens = resolveTokens(request);
        if (tokens.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        AuthenticationCandidate newestCandidate = null;
        for (String jwt : tokens) {
            if (tokenRevocationService.isRevoked(jwt)) {
                continue;
            }

            try {
                String userEmail = jwtService.extractUsername(jwt);
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                if (userDetails == null
                        || !userDetails.isEnabled()
                        || !jwtService.isAccessTokenValid(jwt, userDetails)) {
                    continue;
                }

                Date issuedAt = jwtService.extractIssuedAt(jwt);
                if (issuedAt == null) {
                    continue;
                }
                if (newestCandidate == null || !issuedAt.before(newestCandidate.issuedAt())) {
                    newestCandidate = new AuthenticationCandidate(userDetails, issuedAt);
                }
            } catch (JwtException | IllegalArgumentException | UsernameNotFoundException ex) {
                // A browser can retain legacy cookies with the same name but a different path/domain.
                // Ignore each invalid candidate and keep looking for the newest valid access token.
            }
        }

        if (newestCandidate != null) {
            UserDetails userDetails = newestCandidate.userDetails();
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }
        filterChain.doFilter(request, response);
    }

    private List<String> resolveTokens(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return List.of(authHeader.substring(7));
        }

        List<String> tokens = new ArrayList<>();
        Enumeration<String> cookieHeaders = request.getHeaders("Cookie");
        while (cookieHeaders != null && cookieHeaders.hasMoreElements()) {
            addAccessTokensFromRawCookieHeader(cookieHeaders.nextElement(), tokens);
        }
        if (!tokens.isEmpty()) {
            return tokens;
        }

        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (AuthCookieService.ACCESS_COOKIE_NAME.equals(cookie.getName())
                        && cookie.getValue() != null
                        && !cookie.getValue().isBlank()) {
                    tokens.add(cookie.getValue());
                }
            }
        }
        return tokens;
    }

    private void addAccessTokensFromRawCookieHeader(String cookieHeader, List<String> tokens) {
        if (cookieHeader == null || cookieHeader.isBlank()) {
            return;
        }

        for (String cookiePart : cookieHeader.split(";")) {
            int separatorIndex = cookiePart.indexOf('=');
            if (separatorIndex <= 0) {
                continue;
            }

            String name = cookiePart.substring(0, separatorIndex).trim();
            String value = cookiePart.substring(separatorIndex + 1).trim();
            if (AuthCookieService.ACCESS_COOKIE_NAME.equals(name) && !value.isBlank()) {
                tokens.add(value);
            }
        }
    }

    private record AuthenticationCandidate(UserDetails userDetails, Date issuedAt) {
    }
}
