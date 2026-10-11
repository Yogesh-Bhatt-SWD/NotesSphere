package com.notesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for an established friend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendResponse {

    private String friendshipId;
    private String friendId;
    private String username;
    private String email;
    private Instant connectedAt;
}
