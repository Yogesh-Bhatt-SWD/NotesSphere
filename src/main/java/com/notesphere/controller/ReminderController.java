package com.notesphere.controller;

import com.notesphere.dto.request.ReminderPreferenceRequest;
import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.ReminderPreferenceResponse;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.ReminderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Reminders", description = "Endpoints for managing user journaling reminders and schedules")
public class ReminderController {

    private final ReminderService reminderService;

    @GetMapping
    @Operation(summary = "Get journaling reminder preferences for authenticated user")
    public ResponseEntity<ApiResponse<ReminderPreferenceResponse>> getPreferences(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ReminderPreferenceResponse response = reminderService.getPreferences(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping
    @Operation(summary = "Update journaling reminder preferences")
    public ResponseEntity<ApiResponse<ReminderPreferenceResponse>> updatePreferences(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ReminderPreferenceRequest request) {
        ReminderPreferenceResponse response = reminderService.updatePreferences(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Reminder preferences updated", response));
    }

    @PostMapping("/test")
    @Operation(summary = "Send a test reminder notification")
    public ResponseEntity<ApiResponse<String>> testReminder(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean sent = reminderService.sendTestReminder(currentUser.getId());
        String msg = sent
                ? "Test reminder dispatched via configured notification provider."
                : "Test reminder processed (notification provider not configured; logged locally).";
        return ResponseEntity.ok(ApiResponse.success(msg, msg));
    }
}
