package com.notesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO representing an in-app notification returned by REST API.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private String id;
    private String type;
    private String title;
    private String message;
    private String senderId;
    private String senderUsername;
    private String senderAvatarUrl;
    private String targetType;
    private String targetId;
    private String targetUrl;
    private boolean isRead;
    private Instant readAt;
    private Instant createdAt;
}
