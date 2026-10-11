package com.notesphere.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "communities", indexes = {
        @Index(name = "idx_community_name", columnList = "name"),
        @Index(name = "idx_community_category", columnList = "category")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Community {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private String id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "icon", length = 50)
    @Builder.Default
    private String icon = "Users";

    @Column(name = "category", length = 100)
    @Builder.Default
    private String category = "General";

    @Column(name = "creator_id", nullable = false, length = 36)
    private String creatorId;

    @Column(name = "member_count", nullable = false)
    @Builder.Default
    private int memberCount = 1;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
