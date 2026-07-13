package backend.auth.adapter.out.security;

import backend.auth.application.port.out.ParseTokenExpirationPort;
import backend.security.JwtService;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtTokenExpirationAdapter implements ParseTokenExpirationPort {

    private final JwtService jwtService;

    @Override
    public Optional<LocalDateTime> parseExpiration(String token) {
        try {
            return Optional.of(LocalDateTime.ofInstant(
                    jwtService.extractExpiration(token).toInstant(),
                    ZoneOffset.UTC
            ));
        } catch (JwtException | IllegalArgumentException exception) {
            return Optional.empty();
        }
    }
}
