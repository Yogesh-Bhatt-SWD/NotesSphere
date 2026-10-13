package com.notesphere.controller;

import com.notesphere.util.AppConstants;
import com.notesphere.dto.request.ChangeEmailRequest;
import com.notesphere.dto.request.ChangePasswordRequest;
import com.notesphere.dto.request.DeleteAccountRequest;
import com.notesphere.dto.request.UpdatePreferencesRequest;
import com.notesphere.dto.request.UpdateProfileRequest;
import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.dto.response.UserProfileResponse;
import com.notesphere.dto.response.UserResponse;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.FriendRequestService;
import com.notesphere.service.JournalService;
import com.notesphere.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Users", description = "Endpoints for managing user profiles, preferences, and account security")
public class UserController {

    private final UserService userService;
    private final FriendRequestService friendRequestService;
    private final JournalService journalService;

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserResponse user = userService.getUserById(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload current user profile avatar via multipart file")
    public ResponseEntity<ApiResponse<UserResponse>> uploadAvatarMultipart(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam("file") MultipartFile file) {
        UserResponse response = userService.uploadAvatar(currentUser.getId(), file, null);
        return ResponseEntity.ok(ApiResponse.success("Avatar uploaded successfully", response));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Upload current user profile avatar via JSON data URL")
    public ResponseEntity<ApiResponse<UserResponse>> uploadAvatarJson(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, String> request) {
        String dataUrl = request.getOrDefault("avatarUrl", request.get("avatar"));
        UserResponse response = userService.uploadAvatar(currentUser.getId(), null, dataUrl);
        return ResponseEntity.ok(ApiResponse.success("Avatar updated successfully", response));
    }

    @DeleteMapping("/me/avatar")
    @Operation(summary = "Delete current user profile avatar")
    public ResponseEntity<ApiResponse<UserResponse>> deleteAvatar(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserResponse response = userService.deleteAvatar(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Avatar deleted successfully", response));
    }

    @GetMapping(value = "/{userId}/avatar")
    @Operation(summary = "Get raw avatar image bytes for a user")
    public ResponseEntity<byte[]> getAvatar(@PathVariable("userId") String userId) {
        byte[] bytes = userService.getAvatarBytes(userId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "image/jpeg")
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(bytes);
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse updatedUser = userService.updateProfile(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updatedUser));
    }

    @PutMapping("/me/preferences")
    @Operation(summary = "Update current user app preferences and privacy settings")
    public ResponseEntity<ApiResponse<UserResponse>> updatePreferences(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdatePreferencesRequest request) {
        UserResponse updatedUser = userService.updatePreferences(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Preferences updated successfully", updatedUser));
    }

    @PostMapping("/me/change-password")
    @Operation(summary = "Change password securely with current password verification")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @PostMapping("/me/change-email")
    @Operation(summary = "Change account email address with password confirmation")
    public ResponseEntity<ApiResponse<UserResponse>> changeEmail(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ChangeEmailRequest request) {
        UserResponse updatedUser = userService.changeEmail(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Email changed successfully", updatedUser));
    }

    @GetMapping("/me/sessions")
    @Operation(summary = "Get number of active refresh sessions")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getActiveSessions(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        int count = userService.getActiveSessionsCount(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("activeSessions", count)));
    }

    @PostMapping("/me/signout-all")
    @Operation(summary = "Sign out of all sessions everywhere by invalidating refresh tokens")
    public ResponseEntity<ApiResponse<Map<String, Object>>> signOutAllSessions(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        int cleared = userService.signOutAllSessions(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("All other sessions signed out successfully", Map.of("clearedSessions", cleared)));
    }

    @DeleteMapping("/me")
    @Operation(summary = "Delete account and all associated user data permanently")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody DeleteAccountRequest request) {
        userService.deleteAccount(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Account permanently deleted", null));
    }

    @GetMapping("/search")
    @Operation(summary = "Search users by username with relationship status")
    public ResponseEntity<ApiResponse<PagedResponse<UserProfileResponse>>> searchUsers(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        PagedResponse<UserProfileResponse> results = friendRequestService.searchUsers(
                currentUser.getId(), query, page, size);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/{id}/profile")
    @Operation(summary = "Get public profile and friend relation status for a user")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") String targetUserId) {
        UserProfileResponse profile = friendRequestService.getUserProfile(
                currentUser.getId(), targetUserId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/{id}/published-journals")
    @Operation(summary = "Get published journals and community posts for a user")
    public ResponseEntity<ApiResponse<PagedResponse<JournalResponse>>> getPublishedJournals(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") String targetUserId,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_NUMBER) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, AppConstants.MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        PagedResponse<JournalResponse> journals = journalService.getUserPublishedJournals(
                targetUserId, currentUser != null ? currentUser.getId() : null, pageable);
        return ResponseEntity.ok(ApiResponse.success(journals));
    }
}
