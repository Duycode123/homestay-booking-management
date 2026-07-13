package backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import backend.entity.Role;
import backend.entity.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Service
public class JwtService {

    private static final String SECRET_KEY = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final String TOKEN_TYPE_CLAIM = "token_type";
    private static final String SESSION_STARTED_AT_CLAIM = "session_started_at";
    private static final String ROLE_CLAIM = "role";
    private static final String ACCESS_TOKEN_TYPE = "access";
    private static final String REFRESH_TOKEN_TYPE = "refresh";

    private static final long ACCESS_TOKEN_EXPIRATION = 1000L * 60 * 15;
    private static final long REFRESH_TOKEN_EXPIRATION = 1000L * 60 * 60 * 24 * 7;
    private static final long ABSOLUTE_SESSION_EXPIRATION = 1000L * 60 * 60 * 24 * 30;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = createIdentityClaims(userDetails);
        claims.put(TOKEN_TYPE_CLAIM, ACCESS_TOKEN_TYPE);
        long now = System.currentTimeMillis();
        return buildToken(claims, userDetails, now, now + ACCESS_TOKEN_EXPIRATION);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        long now = System.currentTimeMillis();
        return buildRefreshToken(userDetails, now, now);
    }

    public String rotateRefreshToken(UserDetails userDetails, String currentRefreshToken) {
        Number sessionStartedAtClaim = extractClaim(
                currentRefreshToken,
                claims -> claims.get(SESSION_STARTED_AT_CLAIM, Number.class)
        );
        if (sessionStartedAtClaim == null) {
            throw new JwtException("Refresh token không có thông tin phiên đăng nhập");
        }

        long now = System.currentTimeMillis();
        long sessionStartedAt = sessionStartedAtClaim.longValue();
        long absoluteExpiration = sessionStartedAt + ABSOLUTE_SESSION_EXPIRATION;
        if (now >= absoluteExpiration) {
            throw new JwtException("Phiên đăng nhập đã hết hạn tuyệt đối");
        }

        return buildRefreshToken(userDetails, sessionStartedAt, now);
    }

    public boolean isAccessTokenValid(String token, UserDetails userDetails) {
        return isTokenValid(token, userDetails, ACCESS_TOKEN_TYPE);
    }

    public boolean isRefreshTokenValid(String token, UserDetails userDetails) {
        return isTokenValid(token, userDetails, REFRESH_TOKEN_TYPE);
    }

    private boolean isTokenValid(String token, UserDetails userDetails, String expectedType) {
        try {
            String username = extractUsername(token);
            String tokenType = extractClaim(token, claims -> claims.get(TOKEN_TYPE_CLAIM, String.class));
            return username.equals(userDetails.getUsername())
                    && expectedType.equals(tokenType)
                    && !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    private String buildRefreshToken(UserDetails userDetails, long sessionStartedAt, long issuedAt) {
        long absoluteExpiration = sessionStartedAt + ABSOLUTE_SESSION_EXPIRATION;
        long expiration = Math.min(issuedAt + REFRESH_TOKEN_EXPIRATION, absoluteExpiration);

        Map<String, Object> claims = createIdentityClaims(userDetails);
        claims.put(TOKEN_TYPE_CLAIM, REFRESH_TOKEN_TYPE);
        claims.put(SESSION_STARTED_AT_CLAIM, sessionStartedAt);
        return buildToken(claims, userDetails, issuedAt, expiration);
    }

    private Map<String, Object> createIdentityClaims(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();

        if (userDetails instanceof User user && user.getRole() != null) {
            claims.put(ROLE_CLAIM, user.getRole().name());
        } else {
            String role = userDetails.getAuthorities().stream()
                    .map(authority -> authority.getAuthority())
                    .filter(authority -> authority.startsWith("ROLE_"))
                    .map(authority -> authority.substring("ROLE_".length()))
                    .findFirst()
                    .orElse(Role.CUSTOMER.name());
            claims.put(ROLE_CLAIM, role);
        }

        return claims;
    }

    private String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long issuedAt,
            long expiration
    ) {
        return Jwts.builder()
                .claims(extraClaims)
                .id(UUID.randomUUID().toString())
                .subject(userDetails.getUsername())
                .issuedAt(new Date(issuedAt))
                .expiration(new Date(expiration))
                .signWith(getSignInKey())
                .compact();
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
