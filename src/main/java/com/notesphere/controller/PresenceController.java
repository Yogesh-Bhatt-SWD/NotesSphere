package com.notesphere.controller;

import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.PresenceResponse;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.PresenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller providing presence statuses for accepted friends.
 * Strictly enforces friend-only visibility rules.
 */
@RestController
@RequestMapping("/api/presence")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Presence", description = "Endpoints for checking real-time online/offline presence and last seen")
public class PresenceController {

    private final PresenceService presenceService;

    @GetMapping("/friends")
    @Operation(summary = "Get online/offline presence for all accepted friends of the current user")
    public ResponseEntity<ApiResponse<List<PresenceResponse>>> getFriendsPresence(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<PresenceResponse> response = presenceService.getFriendsPresence(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/user/{targetUserId}")
    @Operation(summary = "Get presence status for a specific accepted friend")
    public ResponseEntity<ApiResponse<PresenceResponse>> getUserPresence(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("targetUserId") String targetUserId) {
        PresenceResponse response = presenceService.getUserPresence(currentUser.getId(), targetUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
