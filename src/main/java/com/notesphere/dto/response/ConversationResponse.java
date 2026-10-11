package com.notesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Summary DTO of a conversation for conversation lists.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {

    private String id;
    private String friendId;
    private String friendUsername;
    private String friendEmail;
    private String lastMessage;
    private Instant lastMessageAt;
    private long unreadCount;
    private Instant createdAt;
}
