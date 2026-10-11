package com.notesphere.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * JPA entity representing a private one-to-one conversation between two friends.
 * Follows canonical user ID ordering: userAId < userBId.
 */
@Entity
@Table(name = "conversations", uniqueConstraints = {
        @UniqueConstraint(name = "idx_conversation_pair", columnNames = {"user_a_id", "user_b_id"})
}, indexes = {
        @Index(name = "idx_conversation_user_a", columnList = "user_a_id"),
        @Index(name = "idx_conversation_user_b", columnList = "user_b_id")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private String id;

    @Column(name = "user_a_id", nullable = false, length = 36)
    private String userAId;

    @Column(name = "user_b_id", nullable = false, length = 36)
    private String userBId;

    @Column(name = "last_message_content", length = 1000)
    private String lastMessageContent;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    public static Conversation createCanonical(String u1, String u2) {
        if (u1 == null || u2 == null || u1.equals(u2)) {
            throw new IllegalArgumentException("Cannot create conversation with null or identical users");
        }
        String a = u1.compareTo(u2) < 0 ? u1 : u2;
        String b = u1.compareTo(u2) < 0 ? u2 : u1;
        return Conversation.builder()
                .userAId(a)
                .userBId(b)
                .build();
    }

    public boolean isParticipant(String userId) {
        return userAId.equals(userId) || userBId.equals(userId);
    }

    public String getOtherParticipantId(String userId) {
        if (userAId.equals(userId)) return userBId;
        if (userBId.equals(userId)) return userAId;
        throw new IllegalArgumentException("User " + userId + " is not a participant in this conversation");
    }
}
