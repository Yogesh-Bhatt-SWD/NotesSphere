package com.notesphere.service;

import com.notesphere.dto.response.ConversationResponse;
import com.notesphere.dto.response.MessageResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.entity.Conversation;
import com.notesphere.entity.Message;
import com.notesphere.entity.User;
import com.notesphere.exception.BadRequestException;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.repository.ConversationRepository;
import com.notesphere.repository.FriendshipRepository;
import com.notesphere.repository.MessageRepository;
import com.notesphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing private one-to-one conversations and persistent messages.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    /**
     * Get all conversations for current user with unread counts and friend details.
     */
    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(String userId) {
        List<Conversation> conversations = conversationRepository.findAllForUser(userId);
        if (conversations.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> friendIds = conversations.stream()
                .map(c -> c.getOtherParticipantId(userId))
                .collect(Collectors.toSet());

        Map<String, User> userMap = userRepository.findAllById(friendIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return conversations.stream().map(c -> {
            String friendId = c.getOtherParticipantId(userId);
            User friend = userMap.get(friendId);
            long unread = messageRepository.countUnreadMessages(c.getId(), userId);

            return ConversationResponse.builder()
                    .id(c.getId())
                    .friendId(friendId)
                    .friendUsername(friend != null ? friend.getUsername() : "Unknown")
                    .friendEmail(friend != null ? friend.getEmail() : "")
                    .lastMessage(c.getLastMessageContent())
                    .lastMessageAt(c.getLastMessageAt() != null ? c.getLastMessageAt() : c.getCreatedAt())
                    .unreadCount(unread)
                    .createdAt(c.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Retrieve or initialize a conversation between two friends.
     */
    @Transactional
    public ConversationResponse getOrCreateConversation(String userId, String friendId) {
        if (userId.equals(friendId)) {
            throw new BadRequestException("Cannot create a conversation with yourself");
        }

        if (!friendshipRepository.areFriends(userId, friendId)) {
            throw new BadRequestException("You can only start private conversations with accepted friends");
        }

        Conversation conversation = conversationRepository.findBetween(userId, friendId)
                .orElseGet(() -> {
                    Conversation c = Conversation.createCanonical(userId, friendId);
                    return conversationRepository.save(c);
                });

        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", friendId));

        long unread = messageRepository.countUnreadMessages(conversation.getId(), userId);

        return ConversationResponse.builder()
                .id(conversation.getId())
                .friendId(friendId)
                .friendUsername(friend.getUsername())
                .friendEmail(friend.getEmail())
                .lastMessage(conversation.getLastMessageContent())
                .lastMessageAt(conversation.getLastMessageAt() != null ? conversation.getLastMessageAt() : conversation.getCreatedAt())
                .unreadCount(unread)
                .createdAt(conversation.getCreatedAt())
                .build();
    }

    /**
     * Retrieve paginated message history for a conversation.
     */
    @Transactional(readOnly = true)
    public PagedResponse<MessageResponse> getMessages(String userId, String conversationId, int page, int size) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (!conversation.isParticipant(userId)) {
            throw new AccessDeniedException("You are not authorized to view messages in this conversation");
        }

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<Message> messagePage = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);

        Set<String> senderIds = messagePage.getContent().stream()
                .map(Message::getSenderId)
                .collect(Collectors.toSet());

        Map<String, String> usernameMap = userRepository.findAllById(senderIds).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));

        List<MessageResponse> dtos = messagePage.getContent().stream().map(m ->
                MessageResponse.builder()
                        .id(m.getId())
                        .conversationId(m.getConversationId())
                        .senderId(m.getSenderId())
                        .senderUsername(usernameMap.getOrDefault(m.getSenderId(), "Unknown"))
                        .content(m.getContent())
                        .isRead(m.isRead())
                        .readAt(m.getReadAt())
                        .createdAt(m.getCreatedAt())
                        .isOutgoing(m.getSenderId().equals(userId))
                        .build()
        ).collect(Collectors.toList());

        return PagedResponse.<MessageResponse>builder()
                .content(dtos)
                .page(messagePage.getNumber())
                .size(messagePage.getSize())
                .totalElements(messagePage.getTotalElements())
                .totalPages(messagePage.getTotalPages())
                .last(messagePage.isLast())
                .build();
    }

    /**
     * Save a message to MySQL and update conversation lastMessage meta.
     */
    @Transactional
    public MessageResponse saveMessage(String senderId, String conversationId, String content) {
        if (!StringUtils.hasText(content)) {
            throw new BadRequestException("Message content cannot be empty");
        }
        if (content.length() > 4000) {
            throw new BadRequestException("Message content cannot exceed 4000 characters");
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (!conversation.isParticipant(senderId)) {
            throw new AccessDeniedException("You are not authorized to send messages in this conversation");
        }

        String recipientId = conversation.getOtherParticipantId(senderId);
        if (!friendshipRepository.areFriends(senderId, recipientId)) {
            throw new BadRequestException("Cannot send message: You and the recipient are no longer friends");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId));

        Message message = Message.builder()
                .conversationId(conversationId)
                .senderId(senderId)
                .content(content.trim())
                .isRead(false)
                .build();

        message = messageRepository.save(message);

        String preview = content.trim();
        if (preview.length() > 100) {
            preview = preview.substring(0, 97) + "...";
        }
        conversation.setLastMessageContent(preview);
        conversation.setLastMessageAt(message.getCreatedAt());
        conversationRepository.save(conversation);

        log.debug("Message {} saved in conversation {}", message.getId(), conversationId);

        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(conversationId)
                .senderId(senderId)
                .senderUsername(sender.getUsername())
                .content(message.getContent())
                .isRead(false)
                .readAt(null)
                .createdAt(message.getCreatedAt())
                .isOutgoing(true)
                .build();
    }

    /**
     * Mark all incoming messages in a conversation as read.
     */
    @Transactional
    public void markConversationAsRead(String userId, String conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        if (!conversation.isParticipant(userId)) {
            throw new AccessDeniedException("You are not authorized to access this conversation");
        }

        int updated = messageRepository.markConversationMessagesAsRead(conversationId, userId, Instant.now());
        log.debug("Marked {} messages as read in conversation {}", updated, conversationId);
    }

    /**
     * Find a conversation entity by ID.
     */
    @Transactional(readOnly = true)
    public Conversation getConversationEntity(String conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));
    }
}
