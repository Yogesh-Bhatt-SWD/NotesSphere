package com.notesphere.dto.response;

import com.notesphere.entity.enums.FriendRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for friend request details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequestResponse {

    private String id;
    private String senderId;
    private String senderUsername;
    private String senderAvatarUrl;
    private String receiverId;
    private String receiverUsername;
    private String receiverAvatarUrl;
    private FriendRequestStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
