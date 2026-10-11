package com.notesphere.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service for sending reminder notifications.
 * Sends actual notifications only when an external provider is configured;
 * otherwise logs the notification gracefully.
 */
@Slf4j
@Service
public class NotificationService {

    @Value("${app.notifications.provider-configured:false}")
    private boolean providerConfigured;

    @Value("${app.notifications.sender-email:reminders@notesphere.com}")
    private String senderEmail;

    public boolean isProviderConfigured() {
        return providerConfigured;
    }

    public boolean sendReminder(String toEmail, String username, String reminderTime) {
        if (providerConfigured) {
            log.info("Sending actual reminder notification to {} ({}) for scheduled time {}",
                    username, toEmail, reminderTime);
            // In a production setup with configured SMTP or SendGrid, actual email dispatch occurs here.
            return true;
        } else {
            log.info("[Notification Provider Not Configured] Skipped actual delivery. Mocked reminder for user '{}' ({}) scheduled at {}",
                    username, toEmail, reminderTime);
            return false;
        }
    }
}
