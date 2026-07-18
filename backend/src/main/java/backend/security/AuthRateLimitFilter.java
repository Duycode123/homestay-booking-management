package backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> PROTECTED_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/resend-verification-email"
    );
    private static final Duration WINDOW = Duration.ofMinutes(15);
    // Login is intentionally protected, but this needs enough room for a user
    // who switches accounts or retries OAuth during a short test session.
    private static final int MAX_REQUESTS_PER_WINDOW = 20;

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public AuthRateLimitFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !"POST".equalsIgnoreCase(request.getMethod())
                || !PROTECTED_PATHS.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        long now = System.currentTimeMillis();
        String key = resolveClientAddress(request) + ':' + request.getRequestURI();
        WindowCounter counter = counters.computeIfAbsent(key, ignored -> new WindowCounter(now));

        RateLimitDecision decision = counter.tryAcquire(now);
        if (!decision.allowed()) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Retry-After", String.valueOf(decision.retryAfterSeconds()));
            objectMapper.writeValue(response.getOutputStream(), Map.of(
                    "success", false,
                    "message", "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
                    "retryAfterSeconds", decision.retryAfterSeconds()
            ));
            return;
        }

        if (counters.size() > 10_000) {
            counters.entrySet().removeIf(entry -> entry.getValue().isExpired(now));
        }
        filterChain.doFilter(request, response);
    }

    private String resolveClientAddress(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",", 2)[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }

    private static final class WindowCounter {
        private long windowStartedAt;
        private int requests;

        private WindowCounter(long windowStartedAt) {
            this.windowStartedAt = windowStartedAt;
        }

        private synchronized RateLimitDecision tryAcquire(long now) {
            if (now - windowStartedAt >= WINDOW.toMillis()) {
                windowStartedAt = now;
                requests = 0;
            }
            requests++;
            if (requests <= MAX_REQUESTS_PER_WINDOW) {
                return RateLimitDecision.permitted();
            }

            long remainingMillis = Math.max(1, WINDOW.toMillis() - (now - windowStartedAt));
            long retryAfterSeconds = Math.max(1, (long) Math.ceil(remainingMillis / 1_000d));
            return RateLimitDecision.rejected(retryAfterSeconds);
        }

        private synchronized boolean isExpired(long now) {
            return now - windowStartedAt >= WINDOW.toMillis();
        }
    }

    private record RateLimitDecision(boolean allowed, long retryAfterSeconds) {
        private static RateLimitDecision permitted() {
            return new RateLimitDecision(true, 0);
        }

        private static RateLimitDecision rejected(long retryAfterSeconds) {
            return new RateLimitDecision(false, retryAfterSeconds);
        }
    }
}
