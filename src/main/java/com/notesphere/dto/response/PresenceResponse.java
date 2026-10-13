package com.notesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO representing an authenticated user's online/offline presence status.
 * Intentionally contains no sensitive account data (e.g. email, tokens).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresenceResponse {

    private String userId;
    private boolean online;
    private Instant lastSeenAt;
}
