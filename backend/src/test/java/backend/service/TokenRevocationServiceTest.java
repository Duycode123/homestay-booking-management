package backend.service;

import backend.auth.application.port.out.ParseTokenExpirationPort;
import backend.auth.application.port.out.RevokedTokenStorePort;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TokenRevocationServiceTest {

    @Test
    void storesOnlyHashForValidUnexpiredToken() {
        RevokedTokenStorePort store = mock(RevokedTokenStorePort.class);
        ParseTokenExpirationPort parser = mock(ParseTokenExpirationPort.class);
        LocalDateTime expiresAt = LocalDateTime.now(ZoneOffset.UTC).plusMinutes(10);
        when(parser.parseExpiration("raw-token")).thenReturn(Optional.of(expiresAt));

        new TokenRevocationService(store, parser).revoke("raw-token");

        verify(store).deleteExpiredBefore(any(LocalDateTime.class));
        verify(store).save(
                argThat(hash -> hash.length() == 64 && !hash.contains("raw-token")),
                eq(expiresAt),
                any(LocalDateTime.class)
        );
    }
}
