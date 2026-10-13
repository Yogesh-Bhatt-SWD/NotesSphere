package com.notesphere.dto.response.search;

import com.notesphere.entity.enums.FriendshipStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Result DTO for a person match in global search.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchPersonResult {
    private String id;
    private String username;
    private String fullName;
    private String avatarUrl;
    private String bio;
    private String profileLabel;
    private FriendshipStatus friendshipStatus;
    private String friendRequestId;
}
