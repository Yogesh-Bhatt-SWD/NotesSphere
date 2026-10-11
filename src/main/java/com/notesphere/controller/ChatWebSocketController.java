package com.notesphere.controller;

import com.notesphere.dto.request.SendMessageRequest;
import com.notesphere.dto.response.InAppNotification;
import com.notesphere.dto.response.MessageResponse;
import com.notesphere.entity.Conversation;
import com.notesphere.service.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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

    @MessageMapping("/chat.send")
    public void sendMessage(Principal principal, @Payload @Valid SendMessageRequest request) {
        if (principal == null) {
            log.error("Attempted to send WebSocket message with unauthenticated principal");
            return;
        }

        // Derive sender identity strictly from authenticated principal
        String senderId = principal.getName();
        String conversationId = request.getConversationId();

        log.debug("Processing WebSocket chat message from user {} in conversation {}", senderId, conversationId);

        // Save message to MySQL database
        MessageResponse messageResponse = conversationService.saveMessage(
                senderId, conversationId, request.getContent());

        // Broadcast message to active conversation subscribers
        String conversationDestination = "/topic/conversation." + conversationId;
        messagingTemplate.convertAndSend(conversationDestination, messageResponse);

        // Find recipient and send real-time notification
        try {
            Conversation conversation = conversationService.getConversationEntity(conversationId);
            String recipientId = conversation.getOtherParticipantId(senderId);

            InAppNotification notification = InAppNotification.builder()
                    .type("NEW_MESSAGE")
                    .title("New message from " + messageResponse.getSenderUsername())
                    .message(messageResponse.getContent())
                    .senderId(senderId)
                    .senderUsername(messageResponse.getSenderUsername())
                    .conversationId(conversationId)
                    .timestamp(Instant.now())
                    .build();

            messagingTemplate.convertAndSend("/topic/notifications." + recipientId, notification);
        } catch (Exception ex) {
            log.warn("Could not dispatch notification for message {}: {}", messageResponse.getId(), ex.getMessage());
        }
    }
}
