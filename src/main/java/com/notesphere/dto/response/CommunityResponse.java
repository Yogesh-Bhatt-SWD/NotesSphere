package com.notesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityResponse {

    private String id;
    private String name;
    private String description;
    private String icon;
    private String category;
    private String creatorId;
    private int memberCount;
    private boolean member;
    private String userRole;
    private Instant createdAt;
}
