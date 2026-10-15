package com.notesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Real-time notification payload pushed to clients over WebSocket.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InAppNotification {

    private String id;
    private String type; // "NEW_MESSAGE", "JOURNAL_PUBLISHED", "FRIEND_REQUEST_RECEIVED", "FRIEND_REQUEST_ACCEPTED"
    private String title;
    private String message;
    private String senderId;
    private String senderUsername;
    private String senderAvatarUrl;
    private String conversationId;
    private String targetType; // "JOURNAL", "CONVERSATION", "FRIEND_REQUEST"
    private String targetId;
    private String targetUrl;
    private Long unreadMessageCount;
    private Long unreadNotificationCount;
    private Instant timestamp;
}
