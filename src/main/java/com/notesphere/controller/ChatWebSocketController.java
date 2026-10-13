package com.notesphere.controller;

import com.notesphere.dto.request.SendMessageRequest;
import com.notesphere.dto.response.InAppNotification;
import com.notesphere.dto.response.MessageResponse;
import com.notesphere.entity.Conversation;
import com.notesphere.entity.User;
import com.notesphere.repository.UserRepository;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.Instant;

/**
 * WebSocket STOMP controller handling real-time chat messages.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationService conversationService;
    private final UserRepository userRepository;

    @MessageMapping("/chat.send")
    public void sendMessage(Principal principal, @Payload @Valid SendMessageRequest request) {
        if (principal == null) {
            log.error("Attempted to send WebSocket message with unauthenticated principal");
            return;
        }

        // Derive sender identity strictly from authenticated principal
        String senderId = resolveUserId(principal);
        String conversationId = request.getConversationId();

        log.debug("Processing WebSocket chat message from user {} in conversation {}", senderId, conversationId);

        // Save message to MySQL database and broadcast to active conversation subscribers & recipient notifications
        conversationService.saveMessage(senderId, conversationId, request.getContent());
    }

    private String resolveUserId(Principal principal) {
        if (principal == null) {
            return null;
        }
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof UserPrincipal userPrincipal) {
                return userPrincipal.getId();
            }
        }
        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getId();
        }
        String name = principal.getName();
        return userRepository.findByUsername(name)
                .map(User::getId)
                .or(() -> userRepository.findByEmail(name).map(User::getId))
                .or(() -> userRepository.findById(name).map(User::getId))
                .orElse(name);
    }
}
