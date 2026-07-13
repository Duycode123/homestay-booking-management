package backend.service;

import backend.entity.RevokedToken;
import backend.repository.RevokedTokenRepository;
import backend.security.JwtService;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class TokenRevocationService {

    private final RevokedTokenRepository revokedTokenRepository;
    private final JwtService jwtService;

    @Transactional
    public void revoke(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        try {
            LocalDateTime expiresAt = LocalDateTime.ofInstant(
                    jwtService.extractExpiration(token).toInstant(),
                    ZoneOffset.UTC
            );
            LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

            if (!expiresAt.isAfter(now)) {
                return;
            }

            revokedTokenRepository.deleteByExpiresAtBefore(now);
            String tokenHash = hash(token);

            if (!revokedTokenRepository.existsByTokenHash(tokenHash)) {
                revokedTokenRepository.save(RevokedToken.builder()
                        .tokenHash(tokenHash)
                        .expiresAt(expiresAt)
                        .createdAt(now)
                        .build());
            }
        } catch (JwtException | IllegalArgumentException ignored) {
            // Invalid or expired tokens are already unusable, so logout stays idempotent.
        }
    }

    @Transactional(readOnly = true)
    public boolean isRevoked(String token) {
        return token != null
                && !token.isBlank()
                && revokedTokenRepository.existsByTokenHash(hash(token));
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
