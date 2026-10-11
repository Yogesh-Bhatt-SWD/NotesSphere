package com.notesphere.entity;

import com.notesphere.entity.enums.SentimentLabel;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA entity representing a journal entry with sentiment analysis and metadata.
 */
@Entity
@Table(name = "journal_entries", indexes = {
        @Index(name = "idx_journal_user_id", columnList = "user_id"),
        @Index(name = "idx_journal_created_at", columnList = "created_at"),
        @Index(name = "idx_journal_favorite", columnList = "user_id, is_favorite"),
        @Index(name = "idx_journal_pinned", columnList = "user_id, is_pinned"),
        @Index(name = "idx_journal_visibility", columnList = "visibility, community_id")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private String id;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "journal_entry_tags", joinColumns = @JoinColumn(name = "journal_entry_id"))
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Column(name = "category", length = 100)
    @Builder.Default
    private String category = "General";

    @Column(name = "is_favorite", nullable = false)
    @Builder.Default
    private boolean favorite = false;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private boolean pinned = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false, length = 30)
    @Builder.Default
    private com.notesphere.entity.enums.JournalVisibility visibility = com.notesphere.entity.enums.JournalVisibility.PRIVATE;

    @Column(name = "community_id", length = 36)
    private String communityId;

    @Column(name = "community_name", length = 100)
    private String communityName;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "like_count", nullable = false)
    @Builder.Default
    private int likeCount = 0;

    @Column(name = "comment_count", nullable = false)
    @Builder.Default
    private int commentCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "sentiment_label")
    private SentimentLabel sentimentLabel;

    @Column(name = "compound_score")
    private double compoundScore;

    @Column(name = "positive_score")
    private double positiveScore;

    @Column(name = "negative_score")
    private double negativeScore;

    @Column(name = "neutral_score")
    private double neutralScore;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
