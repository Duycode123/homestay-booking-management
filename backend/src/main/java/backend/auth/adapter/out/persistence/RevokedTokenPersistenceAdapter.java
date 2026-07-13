package backend.auth.adapter.out.persistence;

import backend.auth.application.port.out.RevokedTokenStorePort;
import backend.entity.RevokedToken;
import backend.repository.RevokedTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class RevokedTokenPersistenceAdapter implements RevokedTokenStorePort {

    private final RevokedTokenRepository revokedTokenRepository;

    @Override
    public void deleteExpiredBefore(LocalDateTime cutoff) {
        revokedTokenRepository.deleteByExpiresAtBefore(cutoff);
    }

    @Override
    public boolean containsHash(String tokenHash) {
        return revokedTokenRepository.existsByTokenHash(tokenHash);
    }

    @Override
    public void save(String tokenHash, LocalDateTime expiresAt, LocalDateTime createdAt) {
        revokedTokenRepository.save(RevokedToken.builder()
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .createdAt(createdAt)
                .build());
    }
}
