package com.notesphere.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating user app preferences, privacy toggles, and writing habits.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePreferencesRequest {

    // Privacy toggles
    private Boolean profilePublic;
    private Boolean showLocation;
    private Boolean showInterests;
    private Boolean showBio;
    private String defaultJournalVisibility; // PRIVATE, PUBLIC, COMMUNITY

    // Notification toggles
    private Boolean notifyFriendRequests;
    private Boolean notifyMessages;
    private Boolean notifyComments;
    private Boolean notifyReactions;
    private Boolean notifyCommunity;

    // Writing goals & theme
    @Min(value = 50, message = "Daily writing goal must be at least 50 words")
    @Max(value = 50000, message = "Daily writing goal cannot exceed 50,000 words")
    private Integer dailyWritingGoalWords;

    private String preferredCategory;
    private String themePreference;
}
