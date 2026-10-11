package com.notesphere.controller;

import com.notesphere.dto.request.CommentRequest;
import com.notesphere.dto.request.CommunityRequest;
import com.notesphere.dto.request.ReportRequest;
import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.CommentResponse;
import com.notesphere.dto.response.CommunityResponse;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.CommunityService;
import com.notesphere.util.AppConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/communities")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Communities", description = "Endpoints for discovering communities, feeds, comments, reactions, and moderation")
public class CommunityController {

    private final CommunityService communityService;

    @GetMapping
    @Operation(summary = "Discover and browse communities with optional search and category filters")
    public ResponseEntity<ApiResponse<PagedResponse<CommunityResponse>>> getCommunities(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_NUMBER) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category) {

        Pageable pageable = PageRequest.of(page, Math.min(size, AppConstants.MAX_PAGE_SIZE), Sort.by("memberCount").descending());
        PagedResponse<CommunityResponse> response = communityService.getCommunities(
                currentUser.getId(), query, category, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/joined")
    @Operation(summary = "Get list of communities joined by the authenticated user")
    public ResponseEntity<ApiResponse<List<CommunityResponse>>> getJoinedCommunities(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<CommunityResponse> joined = communityService.getJoinedCommunities(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(joined));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed information about a specific community")
    public ResponseEntity<ApiResponse<CommunityResponse>> getCommunityById(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id) {
        CommunityResponse community = communityService.getCommunityById(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(community));
    }

    @PostMapping
    @Operation(summary = "Create a new community")
    public ResponseEntity<ApiResponse<CommunityResponse>> createCommunity(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CommunityRequest request) {
        CommunityResponse created = communityService.createCommunity(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Community created successfully", created));
    }

    @PostMapping("/{id}/join")
    @Operation(summary = "Join a community")
    public ResponseEntity<ApiResponse<Void>> joinCommunity(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id) {
        communityService.joinCommunity(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Joined community successfully", null));
    }

    @DeleteMapping("/{id}/leave")
    @Operation(summary = "Leave a community")
    public ResponseEntity<ApiResponse<Void>> leaveCommunity(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id) {
        communityService.leaveCommunity(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Left community successfully", null));
    }

    @GetMapping("/{id}/feed")
    @Operation(summary = "Get community feed of published journals (authorized members only)")
    public ResponseEntity<ApiResponse<PagedResponse<JournalResponse>>> getCommunityFeed(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_NUMBER) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size,
            @RequestParam(defaultValue = "publishedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, Math.min(size, AppConstants.MAX_PAGE_SIZE), sort);

        PagedResponse<JournalResponse> feed = communityService.getCommunityFeed(currentUser.getId(), id, pageable);
        return ResponseEntity.ok(ApiResponse.success(feed));
    }

    @PostMapping("/posts/{journalId}/comments")
    @Operation(summary = "Add a comment to a published community journal")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String journalId,
            @Valid @RequestBody CommentRequest request) {
        CommentResponse comment = communityService.addComment(currentUser.getId(), journalId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment posted successfully", comment));
    }

    @GetMapping("/posts/{journalId}/comments")
    @Operation(summary = "Get all comments for a published community journal")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String journalId) {
        List<CommentResponse> comments = communityService.getComments(currentUser.getId(), journalId);
        return ResponseEntity.ok(ApiResponse.success(comments));
    }

    @PostMapping("/posts/{journalId}/react")
    @Operation(summary = "Toggle like/reaction on a published community journal")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleReaction(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String journalId) {
        Map<String, Object> reactionResult = communityService.toggleReaction(currentUser.getId(), journalId);
        return ResponseEntity.ok(ApiResponse.success(reactionResult));
    }

    @PostMapping("/posts/{journalId}/report")
    @Operation(summary = "Report a published post for moderation")
    public ResponseEntity<ApiResponse<Void>> reportPost(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String journalId,
            @Valid @RequestBody ReportRequest request) {
        communityService.reportPost(currentUser.getId(), journalId, request);
        return ResponseEntity.ok(ApiResponse.success("Post reported for moderation", null));
    }

    @DeleteMapping("/posts/{journalId}")
    @Operation(summary = "Moderate or remove a published post (Moderator, Admin, or Author)")
    public ResponseEntity<ApiResponse<Void>> moderatePost(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String journalId) {
        communityService.moderatePost(currentUser.getId(), journalId, "REMOVE");
        return ResponseEntity.ok(ApiResponse.success("Post removed from community", null));
    }
}
