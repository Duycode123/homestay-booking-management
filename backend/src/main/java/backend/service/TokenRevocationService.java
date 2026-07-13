package backend.service;

import backend.auth.application.port.out.ParseTokenExpirationPort;
import backend.auth.application.port.out.RevokedTokenStorePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TokenRevocationService {

    private final RevokedTokenStorePort revokedTokenStorePort;
    private final ParseTokenExpirationPort parseTokenExpirationPort;

    @Transactional
    public void revoke(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        parseTokenExpirationPort.parseExpiration(token).ifPresent(expiresAt -> revokeUntil(token, expiresAt));
    }

    @Transactional(readOnly = true)
    public boolean isRevoked(String token) {
        return token != null
                && !token.isBlank()
                && revokedTokenStorePort.containsHash(hash(token));
    }

    private void revokeUntil(String token, LocalDateTime expiresAt) {
        LocalDateTime now = LocalDateTime.now(java.time.ZoneOffset.UTC);
        if (!expiresAt.isAfter(now)) {
            return;
        }
        revokedTokenStorePort.deleteExpiredBefore(now);
        String tokenHash = hash(token);
        if (!revokedTokenStorePort.containsHash(tokenHash)) {
            revokedTokenStorePort.save(tokenHash, expiresAt, now);
        }
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
