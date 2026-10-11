package com.notesphere.controller;

import com.notesphere.dto.request.UpdateProfileRequest;
import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.UserResponse;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.notesphere.dto.response.PagedResponse;
import com.notesphere.dto.response.UserProfileResponse;
import com.notesphere.service.FriendRequestService;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Users", description = "Endpoints for managing user profiles and discovery")
public class UserController {

    private final UserService userService;
    private final FriendRequestService friendRequestService;

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserResponse user = userService.getUserById(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse updatedUser = userService.updateProfile(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updatedUser));
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
}
