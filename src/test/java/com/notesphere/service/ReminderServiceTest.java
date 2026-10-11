package com.notesphere.service;

import com.notesphere.dto.request.ReminderPreferenceRequest;
import com.notesphere.dto.response.ReminderPreferenceResponse;
import com.notesphere.entity.ReminderPreference;
import com.notesphere.entity.User;
import com.notesphere.repository.ReminderPreferenceRepository;
import com.notesphere.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReminderServiceTest {

    @Mock
    private ReminderPreferenceRepository reminderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ReminderService reminderService;

    private User user;
    private ReminderPreference preference;

    @BeforeEach
    void setUp() {
        user = User.builder().id("u1").username("yogi").email("yogi@example.com").build();
        preference = ReminderPreference.builder()
                .id("r1")
                .userId("u1")
                .email("yogi@example.com")
                .enabled(true)
                .reminderTime("21:00")
                .reminderDays(Set.of("MONDAY", "WEDNESDAY"))
                .notificationChannel("EMAIL")
                .build();
    }

    @Test
    void getPreferences_Existing_Success() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(reminderRepository.findByUserId("u1")).thenReturn(Optional.of(preference));
        when(notificationService.isProviderConfigured()).thenReturn(false);

        ReminderPreferenceResponse response = reminderService.getPreferences("u1");

        assertNotNull(response);
        assertEquals("21:00", response.getReminderTime());
        assertTrue(response.isEnabled());
        assertFalse(response.isProviderConfigured());
    }

    @Test
    void updatePreferences_Success() {
        ReminderPreferenceRequest request = ReminderPreferenceRequest.builder()
                .enabled(false)
                .reminderTime("09:00")
                .reminderDays(Set.of("FRIDAY"))
                .notificationChannel("EMAIL")
                .email("new@example.com")
                .build();

        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(reminderRepository.findByUserId("u1")).thenReturn(Optional.of(preference));
        when(reminderRepository.save(any(ReminderPreference.class))).thenReturn(preference);
        when(notificationService.isProviderConfigured()).thenReturn(true);

        ReminderPreferenceResponse response = reminderService.updatePreferences("u1", request);

        assertNotNull(response);
        verify(reminderRepository).save(preference);
    }

    @Test
    void sendTestReminder_WhenProviderConfigured() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(reminderRepository.findByUserId("u1")).thenReturn(Optional.of(preference));
        when(notificationService.sendReminder(anyString(), anyString(), anyString())).thenReturn(true);

        boolean sent = reminderService.sendTestReminder("u1");

        assertTrue(sent);
        verify(notificationService).sendReminder("yogi@example.com", "yogi", "21:00");
    }

    @Test
    void sendTestReminder_WhenProviderNotConfigured() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(reminderRepository.findByUserId("u1")).thenReturn(Optional.of(preference));
        when(notificationService.sendReminder(anyString(), anyString(), anyString())).thenReturn(false);

        boolean sent = reminderService.sendTestReminder("u1");

        assertFalse(sent);
        verify(notificationService).sendReminder("yogi@example.com", "yogi", "21:00");
    }
}
