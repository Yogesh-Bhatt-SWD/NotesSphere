package com.notesphere.dto.response.search;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Result DTO for a community match in global search.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchCommunityResult {
    private String id;
    private String name;
    private String description;
    private String icon;
    private String category;
    private int memberCount;
    private boolean member;
}
