package com.notesphere.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * JPA entity representing a persistent in-app notification.
 */
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notifications_user_created", columnList = "user_id, created_at"),
        @Index(name = "idx_notifications_user_unread", columnList = "user_id, is_read"),
        @Index(name = "idx_notifications_user_dedup", columnList = "user_id, type, target_id")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private String id;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(name = "type", length = 50, nullable = false)
    private String type; // "JOURNAL_PUBLISHED", "NEW_MESSAGE", "FRIEND_REQUEST_RECEIVED", "FRIEND_REQUEST_ACCEPTED"

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Lob
    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "sender_id", length = 36)
    private String senderId;

    @Column(name = "sender_username", length = 100)
    private String senderUsername;

    @Lob
    @Column(name = "sender_avatar_url", columnDefinition = "MEDIUMTEXT")
    private String senderAvatarUrl;

    @Column(name = "target_type", length = 50)
    private String targetType; // "JOURNAL", "CONVERSATION", "FRIEND_REQUEST"

    @Column(name = "target_id", length = 36)
    private String targetId;

    @Column(name = "target_url", length = 255)
    private String targetUrl;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean isRead = false;

    @Column(name = "read_at")
    private Instant readAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
