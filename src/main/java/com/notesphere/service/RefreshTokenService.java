package com.notesphere.service;

import com.notesphere.entity.RefreshToken;
import com.notesphere.exception.UnauthorizedException;
import com.notesphere.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Service for managing JWT refresh tokens with automatic rotation, revocation,
 * and reuse detection (RFC 6819).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    /**
     * Creates a new active refresh token for the given user.
     */
    @Transactional
    public RefreshToken createRefreshToken(String userId) {
        RefreshToken refreshToken = RefreshToken.builder()
                .userId(userId)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshTokenExpirationMs))
                .revoked(false)
                .build();
        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * Rotates a refresh token upon use.
     * Implements Reuse Detection: If a previously revoked/rotated token is used again,
     * all tokens for the user are immediately revoked.
     */
    @Transactional
    public RefreshToken rotateRefreshToken(String token) {
        RefreshToken existingToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        // Reuse detection check
        if (existingToken.isRevoked()) {
            log.warn("SECURITY ALERT: Refresh token reuse detected for user ID {}! Token: {}. Revoking all sessions.",
                    existingToken.getUserId(), token);
            refreshTokenRepository.deleteByUserId(existingToken.getUserId());
            throw new UnauthorizedException("Security violation: Refresh token reuse detected. All sessions terminated. Please login again.");
        }

        // Expiry check
        if (existingToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(existingToken);
            throw new UnauthorizedException("Refresh token has expired. Please login again.");
        }

        // Generate new rotated token
        String newTokenString = UUID.randomUUID().toString();

        // Mark existing token as revoked and track lineage
        existingToken.setRevoked(true);
        existingToken.setReplacedByToken(newTokenString);
        refreshTokenRepository.save(existingToken);

        // Issue and persist new refresh token
        RefreshToken newRefreshToken = RefreshToken.builder()
                .userId(existingToken.getUserId())
                .token(newTokenString)
                .expiryDate(Instant.now().plusMillis(refreshTokenExpirationMs))
                .revoked(false)
                .build();

        log.debug("Rotated refresh token for user: {}", existingToken.getUserId());
        return refreshTokenRepository.save(newRefreshToken);
    }

    /**
     * Validates that a refresh token exists, is active, and not expired.
     */
    @Transactional(readOnly = true)
    public RefreshToken validateRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (refreshToken.isRevoked()) {
            log.warn("Attempt to validate revoked refresh token for user {}", refreshToken.getUserId());
            refreshTokenRepository.deleteByUserId(refreshToken.getUserId());
            throw new UnauthorizedException("Refresh token has been revoked.");
        }

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token has expired. Please login again.");
        }

        return refreshToken;
    }

    /**
     * Deletes all refresh tokens for a user (session termination/logout).
     */
    @Transactional
    public void deleteByUserId(String userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    /**
     * Revokes or deletes a specific refresh token.
     */
    @Transactional
    public void deleteByToken(String token) {
        refreshTokenRepository.deleteByToken(token);
    }
}
