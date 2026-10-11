package com.notesphere.entity;

import com.notesphere.entity.enums.AuthProvider;
import com.notesphere.entity.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/**
 * JPA entity representing a NoteSphere user.
 */
@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36, updatable = false, nullable = false)
    private String id;

    @Column(name = "username", nullable = false, length = 100)
    private String username;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password")
    private String password;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    @Builder.Default
    private Set<Role> roles = new HashSet<>(Set.of(Role.ROLE_USER));

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", length = 50)
    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    @Column(name = "provider_id")
    private String providerId;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Lob
    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(name = "bio", length = 500)
    private String bio;

    @Column(name = "profile_label", length = 50)
    @Builder.Default
    private String profileLabel = "Writer";

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_interests", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "interest")
    @Builder.Default
    private Set<String> interests = new HashSet<>();

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "website", length = 200)
    private String website;

    @Column(name = "twitter_url", length = 200)
    private String twitterUrl;

    @Column(name = "github_url", length = 200)
    private String githubUrl;

    @Column(name = "linkedin_url", length = 200)
    private String linkedinUrl;

    // Visibility & Privacy Preferences
    @Column(name = "is_profile_public")
    @Builder.Default
    private boolean profilePublic = true;

    @Column(name = "show_location")
    @Builder.Default
    private boolean showLocation = true;

    @Column(name = "show_interests")
    @Builder.Default
    private boolean showInterests = true;

    @Column(name = "show_bio")
    @Builder.Default
    private boolean showBio = true;

    @Column(name = "default_journal_visibility", length = 30)
    @Builder.Default
    private String defaultJournalVisibility = "PRIVATE";

    // Notification Preferences
    @Column(name = "notify_friend_requests")
    @Builder.Default
    private boolean notifyFriendRequests = true;

    @Column(name = "notify_messages")
    @Builder.Default
    private boolean notifyMessages = true;

    @Column(name = "notify_comments")
    @Builder.Default
    private boolean notifyComments = true;

    @Column(name = "notify_reactions")
    @Builder.Default
    private boolean notifyReactions = true;

    @Column(name = "notify_community")
    @Builder.Default
    private boolean notifyCommunity = true;

    // Writing Goals & Habits
    @Column(name = "daily_writing_goal_words")
    @Builder.Default
    private int dailyWritingGoalWords = 500;

    @Column(name = "preferred_category", length = 50)
    @Builder.Default
    private String preferredCategory = "Mindfulness";

    @Column(name = "theme_preference", length = 30)
    @Builder.Default
    private String themePreference = "system";

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
