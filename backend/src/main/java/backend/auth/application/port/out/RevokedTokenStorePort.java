package backend.auth.application.port.out;

import java.time.LocalDateTime;

public interface RevokedTokenStorePort {

    void deleteExpiredBefore(LocalDateTime cutoff);

    boolean containsHash(String tokenHash);

    void save(String tokenHash, LocalDateTime expiresAt, LocalDateTime createdAt);
}
