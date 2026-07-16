package backend.config;

import backend.repository.UserRepository;
import backend.security.CsrfAccessDeniedHandler;
import backend.security.JwtAuthenticationFilter;
import backend.security.AuthRateLimitFilter;
import backend.security.UnauthenticatedHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.ObjectPostProcessor;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.beans.factory.annotation.Value;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String CSRF_COOKIE_NAME = "HOMESTAY-XSRF-TOKEN";

    private final UserRepository userRepository;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthRateLimitFilter authRateLimitFilter;
    private final UnauthenticatedHandler unauthenticatedHandler;
    private final CsrfAccessDeniedHandler csrfAccessDeniedHandler;

    @Value("${app.cookie.secure:false}")
    private boolean secureCookies;

    @Value("${app.security.csrf.enabled:true}")
    private boolean csrfEnabled;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Không tìm thấy tài khoản với email: " + username
                ));
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> {});

        if (csrfEnabled) {
            CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
            csrfTokenRepository.setCookieName(CSRF_COOKIE_NAME);
            csrfTokenRepository.setCookieCustomizer(cookie -> cookie
                    .httpOnly(false)
                    .secure(secureCookies)
                    .sameSite("Strict")
                    .path("/"));
            http.csrf(csrf -> csrf
                    .csrfTokenRepository(csrfTokenRepository)
                    .withObjectPostProcessor(new ObjectPostProcessor<CsrfFilter>() {
                        @Override
                        public <O extends CsrfFilter> O postProcess(O csrfFilter) {
                            csrfFilter.setAccessDeniedHandler(csrfAccessDeniedHandler);
                            return csrfFilter;
                        }
                    })
                    .ignoringRequestMatchers(
                            "/api/payments/vnpay/ipn",
                            "/api/payments/sepay/webhook"
                    ));
        } else {
            http.csrf(AbstractHttpConfigurer::disable);
        }

        http.sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider())
                .exceptionHandling(exceptions ->
                        exceptions.authenticationEntryPoint(unauthenticatedHandler)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/", "/api/health").permitAll()
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/api/auth/logout",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/api/auth/verify-email",
                                "/api/auth/resend-verification-email",
                                "/api/auth/csrf",
                                "/api/payments/vnpay/ipn",
                                "/api/payments/sepay/webhook",
                                "/api/ai/chat",
                                "/api/ai/suggested-questions"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/rooms/**", "/api/room-types/**", "/api/reviews", "/api/reviews/rooms/**", "/api/homepage/**", "/api/addons/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/reviews", "/api/reviews/images").hasRole("CUSTOMER")
                        .requestMatchers(HttpMethod.POST, "/api/rooms/**", "/api/room-types/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/rooms/**", "/api/room-types/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/rooms/**", "/api/room-types/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/rooms/**", "/api/room-types/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/bookings/calculate-cost").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/coupons/validate").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/coupons/new-customer-offer").permitAll()
                        .requestMatchers("/api/auth/session").authenticated()
                        .requestMatchers("/api/staff/attendance/**").hasRole("STAFF")
                        .requestMatchers("/api/staff/customers/**").hasRole("STAFF")
                        .requestMatchers("/api/staff/facility/**").hasRole("STAFF")
                        .requestMatchers("/api/staff/notifications/**").hasRole("STAFF")
                        .requestMatchers("/api/staff/performance/**").hasRole("STAFF")
                        .requestMatchers("/api/staff/shift-registrations/**").hasRole("STAFF")
                        .requestMatchers("/api/admin/equipment/**").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers("/api/admin/bookings/*/cancellation-request/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/bookings/**").hasAnyRole("ADMIN", "STAFF")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/bookings/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(authRateLimitFilter, JwtAuthenticationFilter.class);

        return http.build();
    }
}
