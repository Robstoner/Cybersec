package com.workout_tracker.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import org.springframework.security.core.GrantedAuthority;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class JwtService {

    private final JwtProperties jwtProperties;

    // The derived signing key — built once at startup from the Base64-encoded secret.
    // We store it here so we don't re-derive it on every request.
    private SecretKey secretKey;

    @PostConstruct
    void init() {
        // JWT_SECRET must be a Base64-encoded string that decodes to at least 32 bytes (256 bits).
        // HMAC-SHA256 requires a minimum 256-bit key — shorter keys are rejected by jjwt.
        byte[] keyBytes = Decoders.BASE64URL.decode(jwtProperties.getSecret());
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                "JWT_SECRET decodes to only " + keyBytes.length + " bytes. " +
                "Minimum is 32 bytes (256 bits) for HMAC-SHA256. " +
                "Generate a new secret: openssl rand -base64 32 | tr '+/' '-_' | tr -d '='");
        }
        secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    // Build a signed JWT for the given user.
    // Payload contains: subject (username), roles claim, issued-at, expiration.
    public String generateToken(UserDetails userDetails) {
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("roles", roles)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtProperties.getExpirationMs()))
                .signWith(secretKey)
                .compact();
    }

    // Pull the username (subject) out of a token without checking validity.
    // Used by the filter to know which user to load from DB before full validation.
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    // Full check: signature valid + not expired + username matches the loaded UserDetails.
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String username = extractUsername(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    // Parse and verify the token's signature. Throws JwtException if tampered or malformed.
    // jjwt 0.13.x API: parseSignedClaims (replaces the old parseClaimsJws).
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
