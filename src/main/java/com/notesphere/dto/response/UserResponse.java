package com.notesphere.dto.response;

import com.notesphere.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;

/**
 * DTO for user profile responses (excludes sensitive fields like password).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private String id;
    private String username;
    private String name;
    private String fullName;
    private String email;
    private String avatarUrl;
    private String bio;
    private String profileLabel;
    private Set<String> interests;
    private String location;
    private String website;
    private String twitterUrl;
    private String githubUrl;
    private String linkedinUrl;
    private boolean profilePublic;
    private boolean showLocation;
    private boolean showInterests;
    private boolean showBio;
    private String defaultJournalVisibility;
    private boolean notifyFriendRequests;
    private boolean notifyMessages;
    private boolean notifyComments;
    private boolean notifyReactions;
    private boolean notifyCommunity;
    private int dailyWritingGoalWords;
    private String preferredCategory;
    private String themePreference;
    private int activeSessionsCount;
    private Set<Role> roles;
    private String provider;
    private Instant createdAt;
}
