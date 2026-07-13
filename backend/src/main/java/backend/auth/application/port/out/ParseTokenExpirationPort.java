package backend.auth.application.port.out;

import java.time.LocalDateTime;
import java.util.Optional;

public interface ParseTokenExpirationPort {

    Optional<LocalDateTime> parseExpiration(String token);
}
