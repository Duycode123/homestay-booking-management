package backend.repository;

import backend.entity.RevokedToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, Long> {
    boolean existsByTokenHash(String tokenHash);

    void deleteByExpiresAtBefore(LocalDateTime expiresAt);
}
