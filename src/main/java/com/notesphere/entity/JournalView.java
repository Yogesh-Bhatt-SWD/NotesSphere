package com.notesphere.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * JPA entity representing a unique recorded view for a published journal entry.
 * Used for deduplicating views within a concurrency-safe time window.
 */
@Entity
@Table(name = "journal_views", uniqueConstraints = {
        @UniqueConstraint(name = "idx_jv_unique_view", columnNames = {"journal_id", "viewer_id"})
}, indexes = {
        @Index(name = "idx_jv_journal_id", columnList = "journal_id"),
        @Index(name = "idx_jv_viewer_id", columnList = "viewer_id")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalView {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private String id;

    @Column(name = "journal_id", nullable = false, length = 36)
    private String journalId;

    @Column(name = "viewer_id", nullable = false, length = 36)
    private String viewerId;

    @Column(name = "last_viewed_at", nullable = false)
    private Instant lastViewedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
