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
 * JPA entity representing a journal entry with sentiment analysis data.
 */
@Entity
@Table(name = "journal_entries", indexes = {
        @Index(name = "idx_journal_user_id", columnList = "user_id")
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

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "journal_entry_tags", joinColumns = @JoinColumn(name = "journal_entry_id"))
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

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
