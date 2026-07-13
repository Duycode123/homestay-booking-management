package backend.exception;

/**
 * Thrown when an authenticated user lacks the role required for an action.
 * Mapped to HTTP 403 Forbidden (distinct from 401 Unauthorized for anonymous requests).
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
