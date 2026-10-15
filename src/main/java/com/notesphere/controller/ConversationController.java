package com.notesphere.controller;

import com.notesphere.dto.request.SendMessageRequest;
import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.ConversationResponse;
import com.notesphere.dto.response.MessageResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.ConversationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Conversations", description = "Endpoints for managing conversations and message history")
public class ConversationController {

    private final ConversationService conversationService;

    @GetMapping
    @Operation(summary = "List all conversations for current user")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ConversationResponse> conversations = conversationService.getConversations(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get total unread incoming message count across all conversations for current user")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        long count = conversationService.getTotalUnreadCount(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", count)));
    }

    @PostMapping("/with-friend/{friendId}")
    @Operation(summary = "Get or create conversation between current user and an accepted friend")
    public ResponseEntity<ApiResponse<ConversationResponse>> getOrCreateConversation(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("friendId") String friendId) {
        ConversationResponse response = conversationService.getOrCreateConversation(currentUser.getId(), friendId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/messages")
    @Operation(summary = "Get paginated message history for a conversation")
    public ResponseEntity<ApiResponse<PagedResponse<MessageResponse>>> getMessages(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") String conversationId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "50") int size) {
        PagedResponse<MessageResponse> messages = conversationService.getMessages(currentUser.getId(), conversationId, page, size);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/{id}/messages")
    @Operation(summary = "Send a message within a conversation (REST fallback / alternative)")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") String conversationId,
            @Valid @RequestBody SendMessageRequest request) {
        MessageResponse message = conversationService.saveMessage(currentUser.getId(), conversationId, request.getContent());
        return ResponseEntity.ok(ApiResponse.success("Message sent successfully", message));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark messages in a conversation as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") String conversationId,
            @RequestParam(value = "upToMessageId", required = false) String upToMessageId) {
        conversationService.markConversationAsRead(currentUser.getId(), conversationId, upToMessageId);
        return ResponseEntity.ok(ApiResponse.success("Conversation marked as read", null));
    }
}

