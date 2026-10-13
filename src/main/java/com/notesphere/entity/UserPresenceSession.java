package com.notesphere.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * JPA entity tracking active WebSocket presence sessions per user and connection.
 * Supports multi-device / multi-tab presence tracking.
 */
@Entity
@Table(name = "user_presence_sessions", indexes = {
        @Index(name = "idx_presence_user_id", columnList = "user_id"),
        @Index(name = "idx_presence_heartbeat", columnList = "last_heartbeat_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPresenceSession {

    @Id
    @Column(name = "session_id", length = 100, nullable = false)
    private String sessionId;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(name = "connected_at", nullable = false)
    private Instant connectedAt;

    @Column(name = "last_heartbeat_at", nullable = false)
    private Instant lastHeartbeatAt;

    @Column(name = "instance_id", length = 100)
    private String instanceId;
}
