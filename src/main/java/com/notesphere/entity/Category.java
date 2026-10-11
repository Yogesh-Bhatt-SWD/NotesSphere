package com.notesphere.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * JPA entity representing a journal category.
 * Predefined categories are global (userId = null, isPredefined = true).
 * Custom categories are user-scoped (userId != null, isPredefined = false).
 */
@Entity
@Table(name = "categories", indexes = {
        @Index(name = "idx_category_user_id", columnList = "user_id"),
        @Index(name = "idx_category_name", columnList = "name")
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private String id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "is_predefined", nullable = false)
    @Builder.Default
    private boolean predefined = false;

    @Column(name = "user_id", length = 36, nullable = true)
    private String userId;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "color", length = 30)
    private String color;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
