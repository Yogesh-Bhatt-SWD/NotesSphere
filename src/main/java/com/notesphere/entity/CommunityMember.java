package com.notesphere.entity;

import com.notesphere.entity.enums.CommunityRole;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "community_members", indexes = {
        @Index(name = "idx_cm_community_id", columnList = "community_id"),
        @Index(name = "idx_cm_user_id", columnList = "user_id"),
        @Index(name = "idx_cm_unique_member", columnList = "community_id, user_id", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private String id;

    @Column(name = "community_id", nullable = false, length = 36)
    private String communityId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 30)
    @Builder.Default
    private CommunityRole role = CommunityRole.MEMBER;

    @CreatedDate
    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;
}
