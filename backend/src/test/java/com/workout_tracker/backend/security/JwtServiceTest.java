package com.workout_tracker.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Pure unit test — no Spring context, no database, no network.
// We manually wire JwtProperties → JwtService and call init() ourselves.
class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails testUser;

    @BeforeEach
    void setUp() {
        JwtProperties props = new JwtProperties();
        // Base64 of "test-secret-key-for-testing-only" (32 bytes = 256 bits min for HMAC-SHA256)
        props.setSecret("dGVzdC1zZWNyZXQta2V5LWZvci10ZXN0aW5nLW9ubHk=");
        props.setExpirationMs(3_600_000L); // 1 hour

        jwtService = new JwtService(props);
        jwtService.init(); // @PostConstruct — called by Spring normally, manual here in tests

        testUser = User.withUsername("alice")
                .password("irrelevant") // JwtService never reads the password
                .authorities(new SimpleGrantedAuthority("ROLE_USER"))
                .build();
    }

    @Test
    void generateToken_returnsNonBlankToken() {
        String token = jwtService.generateToken(testUser);
        assertThat(token).isNotBlank();
    }

    @Test
    void extractUsername_returnsCorrectSubject() {
        String token = jwtService.generateToken(testUser);
        assertThat(jwtService.extractUsername(token)).isEqualTo("alice");
    }

    @Test
    void isTokenValid_returnsTrueForValidToken() {
        String token = jwtService.generateToken(testUser);
        assertThat(jwtService.isTokenValid(token, testUser)).isTrue();
    }

    @Test
    void isTokenValid_returnsFalseForExpiredToken() {
        JwtProperties expiredProps = new JwtProperties();
        expiredProps.setSecret("dGVzdC1zZWNyZXQta2V5LWZvci10ZXN0aW5nLW9ubHk=");
        expiredProps.setExpirationMs(-1000L); // already expired at issue time

        JwtService expiredService = new JwtService(expiredProps);
        expiredService.init();

        String token = expiredService.generateToken(testUser);
        assertThat(expiredService.isTokenValid(token, testUser)).isFalse();
    }

    @Test
    void isTokenValid_returnsFalseForTamperedToken() {
        String token = jwtService.generateToken(testUser);
        // Corrupt the signature (last segment after the second '.')
        String tampered = token.substring(0, token.length() - 4) + "XXXX";
        assertThat(jwtService.isTokenValid(tampered, testUser)).isFalse();
    }

    @Test
    void isTokenValid_returnsFalseForDifferentUser() {
        String token = jwtService.generateToken(testUser);

        UserDetails otherUser = User.withUsername("bob")
                .password("irrelevant")
                .authorities(List.of())
                .build();

        assertThat(jwtService.isTokenValid(token, otherUser)).isFalse();
    }
}
