package backend.security;

import backend.config.JwtProperties;
import backend.entity.Role;
import backend.entity.User;
import backend.service.TokenRevocationService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtAuthenticationFilterTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void ignoresStaleDuplicateCookieAndAuthenticatesWithValidCookie() throws Exception {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=");
        JwtService jwtService = new JwtService(properties);
        CustomUserDetailsService userDetailsService = mock(CustomUserDetailsService.class);
        TokenRevocationService tokenRevocationService = mock(TokenRevocationService.class);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(
                jwtService,
                userDetailsService,
                tokenRevocationService
        );
        User user = User.builder()
                .email("customer@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .enabled(true)
                .build();
        String validToken = jwtService.generateAccessToken(user);
        when(userDetailsService.loadUserByUsername(user.getEmail())).thenReturn(user);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/me");
        request.addHeader(
                "Cookie",
                "access_token=legacy-invalid-token; access_token=" + validToken
        );
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals(user.getEmail(), SecurityContextHolder.getContext().getAuthentication().getName());
        verify(chain).doFilter(request, response);
    }

    @Test
    void validJwtReplacesAuthenticationLeftByAnOlderServletSession() throws Exception {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=");
        JwtService jwtService = new JwtService(properties);
        CustomUserDetailsService userDetailsService = mock(CustomUserDetailsService.class);
        TokenRevocationService tokenRevocationService = mock(TokenRevocationService.class);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(
                jwtService,
                userDetailsService,
                tokenRevocationService
        );
        User oldAdmin = User.builder()
                .email("old-admin@example.com")
                .password("encoded")
                .role(Role.ADMIN)
                .enabled(true)
                .build();
        User newCustomer = User.builder()
                .email("new-customer@example.com")
                .password("encoded")
                .role(Role.CUSTOMER)
                .enabled(true)
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        oldAdmin,
                        null,
                        oldAdmin.getAuthorities()
                )
        );
        String customerToken = jwtService.generateAccessToken(newCustomer);
        when(userDetailsService.loadUserByUsername(newCustomer.getEmail())).thenReturn(newCustomer);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/me");
        request.addHeader("Cookie", "access_token=" + customerToken);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals(
                newCustomer.getEmail(),
                SecurityContextHolder.getContext().getAuthentication().getName()
        );
        verify(chain).doFilter(request, response);
    }
}
