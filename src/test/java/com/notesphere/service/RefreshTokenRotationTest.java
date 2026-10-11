package com.notesphere.service;

import com.notesphere.entity.RefreshToken;
import com.notesphere.exception.UnauthorizedException;
import com.notesphere.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RefreshTokenRotationTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(refreshTokenService, "refreshTokenExpirationMs", 604800000L);
    }

    @Test
    void rotateRefreshToken_Success() {
        RefreshToken oldToken = RefreshToken.builder()
                .id("t1")
                .token("old_token_xyz")
                .userId("user_100")
                .expiryDate(Instant.now().plusSeconds(3600))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByToken("old_token_xyz")).thenReturn(Optional.of(oldToken));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

        RefreshToken rotated = refreshTokenService.rotateRefreshToken("old_token_xyz");

        assertNotNull(rotated);
        assertNotEquals("old_token_xyz", rotated.getToken());
        assertEquals("user_100", rotated.getUserId());
        assertFalse(rotated.isRevoked());

        // Verify old token was revoked
        assertTrue(oldToken.isRevoked());
        assertEquals(rotated.getToken(), oldToken.getReplacedByToken());
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }

    @Test
    void rotateRefreshToken_ReuseDetection_RevokesAllSessions() {
        // Token was already revoked previously!
        RefreshToken compromisedToken = RefreshToken.builder()
                .id("t1")
                .token("stolen_token_123")
                .userId("user_100")
                .expiryDate(Instant.now().plusSeconds(3600))
                .revoked(true)
                .replacedByToken("replacement_token")
                .build();

        when(refreshTokenRepository.findByToken("stolen_token_123")).thenReturn(Optional.of(compromisedToken));

        UnauthorizedException ex = assertThrows(UnauthorizedException.class,
                () -> refreshTokenService.rotateRefreshToken("stolen_token_123"));

        assertTrue(ex.getMessage().contains("reuse detected"));
        // Verify all sessions were purged for the affected user
        verify(refreshTokenRepository).deleteByUserId("user_100");
    }

    @Test
    void rotateRefreshToken_ExpiredToken_DeletesAndThrowsUnauthorized() {
        RefreshToken expiredToken = RefreshToken.builder()
                .id("t2")
                .token("expired_token_123")
                .userId("user_100")
                .expiryDate(Instant.now().minusSeconds(3600)) // Expired 1 hour ago
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByToken("expired_token_123")).thenReturn(Optional.of(expiredToken));

        UnauthorizedException ex = assertThrows(UnauthorizedException.class,
                () -> refreshTokenService.rotateRefreshToken("expired_token_123"));

        assertTrue(ex.getMessage().contains("expired"));
        verify(refreshTokenRepository).delete(expiredToken);
    }

    @Test
    void rotateRefreshToken_NonExistentToken_ThrowsUnauthorized() {
        when(refreshTokenRepository.findByToken("non_existent")).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class,
                () -> refreshTokenService.rotateRefreshToken("non_existent"));
    }
}
