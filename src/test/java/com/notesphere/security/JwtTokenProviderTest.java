package com.notesphere.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private final String secret = "NoteSphereTestSecretKeyForJWTAuthenticationMustBeAtLeast256BitsLong2024SecureKey";

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(secret, 3600000L); // 1 hour expiration
    }

    @Test
    void generateAndValidateToken_Success() {
        String userId = "user-12345";
        String token = tokenProvider.generateTokenFromUserId(userId);

        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));
        assertEquals(userId, tokenProvider.getUserIdFromToken(token));
    }

    @Test
    void validateToken_ExpiredToken_ReturnsFalse() {
        // Provider with negative expiration (already expired)
        JwtTokenProvider expiredProvider = new JwtTokenProvider(secret, -1000L);
        String expiredToken = expiredProvider.generateTokenFromUserId("user-12345");

        assertFalse(tokenProvider.validateToken(expiredToken));
    }

    @Test
    void validateToken_MalformedToken_ReturnsFalse() {
        assertFalse(tokenProvider.validateToken("not-a-valid-jwt-token"));
    }

    @Test
    void validateToken_TamperedSignature_ReturnsFalse() {
        String token = tokenProvider.generateTokenFromUserId("user-12345");
        String tamperedToken = token + "xyz";

        assertFalse(tokenProvider.validateToken(tamperedToken));
    }
}
