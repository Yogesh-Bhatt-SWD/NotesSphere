package com.notesphere.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "post_reactions", indexes = {
        @Index(name = "idx_pr_journal_id", columnList = "journal_id"),
        @Index(name = "idx_pr_unique_reaction", columnList = "journal_id, user_id", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private String id;

    @Column(name = "journal_id", nullable = false, length = 36)
    private String journalId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "reaction_type", nullable = false, length = 30)
    @Builder.Default
    private String reactionType = "LIKE";

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
