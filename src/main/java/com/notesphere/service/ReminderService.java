package com.notesphere.service;

import com.notesphere.dto.request.ReminderPreferenceRequest;
import com.notesphere.dto.response.ReminderPreferenceResponse;
import com.notesphere.entity.ReminderPreference;
import com.notesphere.entity.User;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.repository.ReminderPreferenceRepository;
import com.notesphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Service for managing user journaling reminders and executing scheduled checks.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderPreferenceRepository reminderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    @Transactional
    public ReminderPreferenceResponse getPreferences(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        ReminderPreference pref = reminderRepository.findByUserId(userId)
                .orElseGet(() -> reminderRepository.save(ReminderPreference.builder()
                        .userId(userId)
                        .email(user.getEmail())
                        .enabled(false)
                        .reminderTime("20:00")
                        .build()));

        return mapToResponse(pref);
    }

    @Transactional
    public ReminderPreferenceResponse updatePreferences(String userId, ReminderPreferenceRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        ReminderPreference pref = reminderRepository.findByUserId(userId)
                .orElseGet(() -> ReminderPreference.builder()
                        .userId(userId)
                        .email(user.getEmail())
                        .build());

        if (request.getEnabled() != null) {
            pref.setEnabled(request.getEnabled());
        }
        if (request.getReminderTime() != null) {
            pref.setReminderTime(request.getReminderTime());
        }
        if (request.getReminderDays() != null && !request.getReminderDays().isEmpty()) {
            pref.setReminderDays(request.getReminderDays());
        }
        if (request.getNotificationChannel() != null) {
            pref.setNotificationChannel(request.getNotificationChannel());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            pref.setEmail(request.getEmail().trim());
        } else if (pref.getEmail() == null) {
            pref.setEmail(user.getEmail());
        }

        ReminderPreference saved = reminderRepository.save(pref);
        log.info("Reminder preferences updated for user: {}", userId);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public boolean sendTestReminder(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        ReminderPreference pref = reminderRepository.findByUserId(userId).orElse(null);
        String targetEmail = (pref != null && pref.getEmail() != null) ? pref.getEmail() : user.getEmail();
        String reminderTime = (pref != null) ? pref.getReminderTime() : "20:00";

        return notificationService.sendReminder(targetEmail, user.getUsername(), reminderTime);
    }

    /**
     * Periodic scheduled task to check and dispatch reminders.
     * Evaluates users with enabled reminders against current UTC time.
     */
    @Scheduled(cron = "0 * * * * *")
    public void processScheduledReminders() {
        LocalTime now = LocalTime.now(ZoneOffset.UTC);
        String currentTime = now.format(TIME_FORMATTER);
        DayOfWeek currentDay = java.time.LocalDate.now(ZoneOffset.UTC).getDayOfWeek();

        List<ReminderPreference> activePreferences = reminderRepository.findByEnabledTrue();

        for (ReminderPreference pref : activePreferences) {
            if (pref.getReminderTime().equals(currentTime) &&
                pref.getReminderDays().contains(currentDay.name())) {

                userRepository.findById(pref.getUserId()).ifPresent(user -> {
                    String targetEmail = pref.getEmail() != null ? pref.getEmail() : user.getEmail();
                    notificationService.sendReminder(targetEmail, user.getUsername(), pref.getReminderTime());
                });
            }
        }
    }

    private ReminderPreferenceResponse mapToResponse(ReminderPreference pref) {
        return ReminderPreferenceResponse.builder()
                .id(pref.getId())
                .userId(pref.getUserId())
                .enabled(pref.isEnabled())
                .reminderTime(pref.getReminderTime())
                .reminderDays(pref.getReminderDays())
                .notificationChannel(pref.getNotificationChannel())
                .email(pref.getEmail())
                .providerConfigured(notificationService.isProviderConfigured())
                .updatedAt(pref.getUpdatedAt())
                .build();
    }
}
