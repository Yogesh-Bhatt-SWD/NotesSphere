package com.notesphere.controller;

import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.FriendRequestResponse;
import com.notesphere.dto.response.FriendResponse;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.FriendRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friend-requests")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Friend Requests", description = "Endpoints for sending, accepting, rejecting, and canceling friend requests")
public class FriendRequestController {

    private final FriendRequestService friendRequestService;

    @PostMapping("/{receiverId}")
    @Operation(summary = "Send a friend request to a target user")
    public ResponseEntity<ApiResponse<FriendRequestResponse>> sendRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("receiverId") String receiverId) {
        FriendRequestResponse response = friendRequestService.sendFriendRequest(currentUser.getId(), receiverId);
        return ResponseEntity.ok(ApiResponse.success("Friend request sent successfully", response));
    }

    @GetMapping("/incoming")
    @Operation(summary = "List pending received friend requests")
    public ResponseEntity<ApiResponse<List<FriendRequestResponse>>> getIncomingRequests(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<FriendRequestResponse> requests = friendRequestService.getIncomingRequests(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @GetMapping("/outgoing")
    @Operation(summary = "List pending sent friend requests")
    public ResponseEntity<ApiResponse<List<FriendRequestResponse>>> getOutgoingRequests(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<FriendRequestResponse> requests = friendRequestService.getOutgoingRequests(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @PostMapping("/{requestId}/accept")
    @Operation(summary = "Accept an incoming friend request")
    public ResponseEntity<ApiResponse<FriendResponse>> acceptRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("requestId") String requestId) {
        FriendResponse friend = friendRequestService.acceptFriendRequest(currentUser.getId(), requestId);
        return ResponseEntity.ok(ApiResponse.success("Friend request accepted", friend));
    }

    @PostMapping("/{requestId}/reject")
    @Operation(summary = "Reject an incoming friend request")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("requestId") String requestId) {
        friendRequestService.rejectFriendRequest(currentUser.getId(), requestId);
        return ResponseEntity.ok(ApiResponse.success("Friend request rejected", null));
    }

    @DeleteMapping("/{requestId}/cancel")
    @Operation(summary = "Cancel an outgoing pending friend request")
    public ResponseEntity<ApiResponse<Void>> cancelRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("requestId") String requestId) {
        friendRequestService.cancelFriendRequest(currentUser.getId(), requestId);
        return ResponseEntity.ok(ApiResponse.success("Friend request cancelled", null));
    }
}
