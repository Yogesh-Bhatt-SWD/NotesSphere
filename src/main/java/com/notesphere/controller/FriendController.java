package com.notesphere.controller;

import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.FriendResponse;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.FriendshipService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Friends", description = "Endpoints for listing connections and removing friends")
public class FriendController {

    private final FriendshipService friendshipService;

    @GetMapping
    @Operation(summary = "List all accepted friends for current user")
    public ResponseEntity<ApiResponse<List<FriendResponse>>> getFriends(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<FriendResponse> friends = friendshipService.getFriends(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(friends));
    }

    @DeleteMapping("/{friendId}")
    @Operation(summary = "Remove an established friend")
    public ResponseEntity<ApiResponse<Void>> removeFriend(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("friendId") String friendId) {
        friendshipService.removeFriend(currentUser.getId(), friendId);
        return ResponseEntity.ok(ApiResponse.success("Friend removed successfully", null));
    }
}
