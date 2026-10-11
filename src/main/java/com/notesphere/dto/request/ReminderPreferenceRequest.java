package com.notesphere.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * DTO for updating journaling reminder preferences.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderPreferenceRequest {

    private Boolean enabled;

    @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Reminder time must be in HH:mm 24-hour format")
    private String reminderTime;

    private Set<String> reminderDays;

    private String notificationChannel;

    @Email(message = "Notification email must be a valid email address")
    private String email;
}
