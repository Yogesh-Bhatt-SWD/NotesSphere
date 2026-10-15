package com.notesphere.service;

import com.notesphere.dto.response.InAppNotification;
import com.notesphere.dto.response.NotificationResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.entity.*;
import com.notesphere.entity.enums.JournalVisibility;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.repository.CommunityMemberRepository;
import com.notesphere.repository.FriendshipRepository;
import com.notesphere.repository.NotificationRepository;
import com.notesphere.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing persistent in-app notifications, friend journal publication broadcasts,
 * and email reminder stubs.
 */
@Slf4j
@Service
public class NotificationService {

    @Value("${app.notifications.provider-configured:false}")
    private boolean providerConfigured;

    @Value("${app.notifications.sender-email:reminders@notesphere.com}")
    private String senderEmail;

    private final NotificationRepository notificationRepository;
    private final FriendshipRepository friendshipRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public NotificationService(
            NotificationRepository notificationRepository,
            FriendshipRepository friendshipRepository,
            CommunityMemberRepository communityMemberRepository,
            UserRepository userRepository,
            @Autowired(required = false) SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.friendshipRepository = friendshipRepository;
        this.communityMemberRepository = communityMemberRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public boolean isProviderConfigured() {
        return providerConfigured;
    }

    public boolean sendReminder(String toEmail, String username, String reminderTime) {
        if (providerConfigured) {
            log.info("Sending actual reminder notification to {} ({}) for scheduled time {}",
                    username, toEmail, reminderTime);
            return true;
        } else {
            log.info("[Notification Provider Not Configured] Skipped actual delivery. Mocked reminder for user '{}' ({}) scheduled at {}",
                    username, toEmail, reminderTime);
            return false;
        }
    }

    /**
     * Retrieve paginated notifications for authenticated user.
     */
    @Transactional(readOnly = true)
    public PagedResponse<NotificationResponse> getNotifications(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<Notification> notifPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        List<NotificationResponse> dtos = notifPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<NotificationResponse>builder()
                .content(dtos)
                .page(notifPage.getNumber())
                .size(notifPage.getSize())
                .totalElements(notifPage.getTotalElements())
                .totalPages(notifPage.getTotalPages())
                .last(notifPage.isLast())
                .build();
    }

    /**
     * Get count of unread notifications for a user.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Mark a single notification as read if owned by the user.
     */
    @Transactional
    public void markAsRead(String userId, String notificationId) {
        int updated = notificationRepository.markAsRead(notificationId, userId, Instant.now());
        if (updated > 0) {
            log.debug("Marked notification {} as read for user {}", notificationId, userId);
        }
    }

    /**
     * Explicitly mark all notifications as read for the user.
     */
    @Transactional
    public void markAllAsRead(String userId) {
        int updated = notificationRepository.markAllAsRead(userId, Instant.now());
        log.debug("Marked all ({} updated) notifications as read for user {}", updated, userId);
    }

    /**
     * Delete a single notification owned by the user.
     */
    @Transactional
    public void deleteNotification(String userId, String notificationId) {
        notificationRepository.deleteByIdAndUserId(notificationId, userId);
    }

    /**
     * Notify accepted friends (or community members) when a user publishes a journal.
     * Prevents notifications for PRIVATE journals, drafts, or duplicate events.
     */
    @Transactional
    public void notifyJournalPublished(JournalEntry journal, User author) {
        if (journal == null || author == null) {
            return;
        }

        // 1. Only published entries with valid publication date qualify
        if (journal.getPublishedAt() == null || journal.getVisibility() == JournalVisibility.PRIVATE) {
            log.debug("Skipping notification: journal {} is private or draft", journal.getId());
            return;
        }

        Set<String> recipientIds = new HashSet<>();

        // 2. Determine eligible recipients according to visibility and privacy rules
        if (journal.getVisibility() == JournalVisibility.PUBLIC) {
            // Find all accepted friends of the author
            List<Friendship> friendships = friendshipRepository.findAllByUserId(author.getId());
            for (Friendship f : friendships) {
                String friendId = f.getUserAId().equals(author.getId()) ? f.getUserBId() : f.getUserAId();
                if (!friendId.equals(author.getId())) {
                    recipientIds.add(friendId);
                }
            }
        } else if (journal.getVisibility() == JournalVisibility.COMMUNITY && journal.getCommunityId() != null) {
            // Find all members of the community (excluding author)
            List<CommunityMember> members = communityMemberRepository.findByCommunityId(journal.getCommunityId());
            for (CommunityMember m : members) {
                if (!m.getUserId().equals(author.getId())) {
                    recipientIds.add(m.getUserId());
                }
            }
        }

        if (recipientIds.isEmpty()) {
            log.debug("No eligible recipients found for journal {} publication", journal.getId());
            return;
        }

        String targetUrl = (journal.getSlug() != null && !journal.getSlug().isBlank())
                ? "/blogs/" + journal.getSlug()
                : "/blogs/" + journal.getId();

        String notifTitle = "New Journal Published";
        String notifMessage = author.getUsername() + " published a new journal: \"" + journal.getTitle() + "\"";

        for (String recipientId : recipientIds) {
            // 3. Deduplication check: Avoid duplicate notifications for repeated publication/edit events
            if (notificationRepository.existsByUserIdAndTypeAndTargetId(recipientId, "JOURNAL_PUBLISHED", journal.getId())) {
                log.debug("Notification for journal {} already exists for recipient {}", journal.getId(), recipientId);
                continue;
            }

            Notification notification = Notification.builder()
                    .userId(recipientId)
                    .type("JOURNAL_PUBLISHED")
                    .title(notifTitle)
                    .message(notifMessage)
                    .senderId(author.getId())
                    .senderUsername(author.getUsername())
                    .senderAvatarUrl(author.getAvatarUrl())
                    .targetType("JOURNAL")
                    .targetId(journal.getId())
                    .targetUrl(targetUrl)
                    .isRead(false)
                    .build();

            notification = notificationRepository.save(notification);

            // 4. Dispatch WebSocket frame to recipient's personal topic
            try {
                if (messagingTemplate != null) {
                    long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(recipientId);
                    InAppNotification wsPayload = InAppNotification.builder()
                            .id(notification.getId())
                            .type("JOURNAL_PUBLISHED")
                            .title(notification.getTitle())
                            .message(notification.getMessage())
                            .senderId(author.getId())
                            .senderUsername(author.getUsername())
                            .senderAvatarUrl(author.getAvatarUrl())
                            .targetType("JOURNAL")
                            .targetId(journal.getId())
                            .targetUrl(targetUrl)
                            .unreadNotificationCount(unreadCount)
                            .timestamp(notification.getCreatedAt())
                            .build();

                    messagingTemplate.convertAndSend("/topic/notifications." + recipientId, wsPayload);
                }
            } catch (Exception ex) {
                log.warn("Could not dispatch WebSocket notification for journal publication to user {}: {}",
                        recipientId, ex.getMessage());
            }
        }
    }

    /**
     * Create and broadcast friend request in-app notification.
     */
    @Transactional
    public void notifyFriendRequest(String recipientId, String type, String title, String message, User sender, String requestId) {
        try {
            Notification notification = Notification.builder()
                    .userId(recipientId)
                    .type(type)
                    .title(title)
                    .message(message)
                    .senderId(sender != null ? sender.getId() : null)
                    .senderUsername(sender != null ? sender.getUsername() : null)
                    .senderAvatarUrl(sender != null ? sender.getAvatarUrl() : null)
                    .targetType("FRIEND_REQUEST")
                    .targetId(requestId)
                    .targetUrl("/friends")
                    .isRead(false)
                    .build();

            notification = notificationRepository.save(notification);

            if (messagingTemplate != null) {
                long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(recipientId);
                InAppNotification wsPayload = InAppNotification.builder()
                        .id(notification.getId())
                        .type(type)
                        .title(title)
                        .message(message)
                        .senderId(sender != null ? sender.getId() : null)
                        .senderUsername(sender != null ? sender.getUsername() : null)
                        .senderAvatarUrl(sender != null ? sender.getAvatarUrl() : null)
                        .targetType("FRIEND_REQUEST")
                        .targetId(requestId)
                        .targetUrl("/friends")
                        .unreadNotificationCount(unreadCount)
                        .timestamp(notification.getCreatedAt())
                        .build();

                messagingTemplate.convertAndSend("/topic/notifications." + recipientId, wsPayload);
            }
        } catch (Exception ex) {
            log.warn("Could not dispatch friend request notification to user {}: {}", recipientId, ex.getMessage());
        }
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .senderId(n.getSenderId())
                .senderUsername(n.getSenderUsername())
                .senderAvatarUrl(n.getSenderAvatarUrl())
                .targetType(n.getTargetType())
                .targetId(n.getTargetId())
                .targetUrl(n.getTargetUrl())
                .isRead(n.isRead())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
