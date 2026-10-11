package com.notesphere.dto.response;

import com.notesphere.entity.enums.FriendshipStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Public user profile response containing discovery and friendship relation state.
 * Never exposes passwords, auth tokens, or sensitive user data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private String id;
    private String username;
    private String email;
    private Instant createdAt;
    private FriendshipStatus friendshipStatus;
    private String friendRequestId; // Non-null if pending
    private int mutualFriendsCount;
}
