package com.notesphere.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/**
 * JPA entity representing user reminder preferences for daily journaling.
 */
@Entity
@Table(name = "reminder_preferences", indexes = {
        @Index(name = "idx_reminder_user_id", columnList = "user_id", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private String id;

    @Column(name = "user_id", nullable = false, unique = true, length = 36)
    private String userId;

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private boolean enabled = false;

    @Column(name = "reminder_time", length = 10, nullable = false)
    @Builder.Default
    private String reminderTime = "20:00";

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "reminder_days", joinColumns = @JoinColumn(name = "reminder_id"))
    @Column(name = "day")
    @Builder.Default
    private Set<String> reminderDays = new HashSet<>(Set.of(
            "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"));

    @Column(name = "channel", length = 30)
    @Builder.Default
    private String notificationChannel = "EMAIL";

    @Column(name = "email", length = 150)
    private String email;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
