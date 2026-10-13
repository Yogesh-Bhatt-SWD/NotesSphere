package com.notesphere.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Shared event store enabling presence synchronization across multiple backend instances
 * without requiring an external message broker like Redis.
 */
@Entity
@Table(name = "presence_broadcast_events", indexes = {
        @Index(name = "idx_pbe_created", columnList = "created_at"),
        @Index(name = "idx_pbe_origin", columnList = "origin_instance_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresenceBroadcastEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(name = "is_online", nullable = false)
    private boolean online;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @Column(name = "origin_instance_id", length = 100, nullable = false)
    private String originInstanceId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
