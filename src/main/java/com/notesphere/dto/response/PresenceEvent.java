package com.notesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Real-time event payload broadcast over WebSocket STOMP when a user's presence changes.
 * Only non-sensitive status details are broadcast.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresenceEvent {

    private String userId;
    private boolean online;
    private Instant lastSeenAt;
}
