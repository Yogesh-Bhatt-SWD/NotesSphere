package com.notesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;

/**
 * DTO for reminder preferences response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderPreferenceResponse {

    private String id;
    private String userId;
    private boolean enabled;
    private String reminderTime;
    private Set<String> reminderDays;
    private String notificationChannel;
    private String email;
    private boolean providerConfigured;
    private Instant updatedAt;
}
