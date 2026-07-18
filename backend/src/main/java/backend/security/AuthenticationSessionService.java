package backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Removes servlet-based authentication state so JWT cookies remain the single
 * source of identity after password and OAuth login flows.
 */
@Component
public class AuthenticationSessionService {

    public void clear(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            try {
                session.invalidate();
            } catch (IllegalStateException ignored) {
                // The OAuth success/failure pipeline may already have invalidated it.
            }
        }
        SecurityContextHolder.clearContext();
    }
}
