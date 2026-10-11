package com.notesphere.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * JPA entity representing an established friendship between two users.
 * Enforces canonical ordering: userAId is always lexicographically smaller than userBId.
 */
@Entity
@Table(name = "friendships", uniqueConstraints = {
        @UniqueConstraint(name = "idx_friendship_unique", columnNames = {"user_a_id", "user_b_id"})
}, indexes = {
        @Index(name = "idx_friendship_user_a", columnList = "user_a_id"),
        @Index(name = "idx_friendship_user_b", columnList = "user_b_id")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private String id;

    @Column(name = "user_a_id", nullable = false, length = 36)
    private String userAId;

    @Column(name = "user_b_id", nullable = false, length = 36)
    private String userBId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Factory method that creates a Friendship ensuring canonical ordering.
     */
    public static Friendship createCanonical(String userId1, String userId2) {
        if (userId1 == null || userId2 == null || userId1.equals(userId2)) {
            throw new IllegalArgumentException("Cannot create friendship with identical or null user IDs");
        }
        String a = userId1.compareTo(userId2) < 0 ? userId1 : userId2;
        String b = userId1.compareTo(userId2) < 0 ? userId2 : userId1;
        return Friendship.builder()
                .userAId(a)
                .userBId(b)
                .build();
    }
}
