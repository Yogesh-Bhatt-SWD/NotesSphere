package com.notesphere.dto.response.search;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Result DTO for a community post match in global search.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchCommunityPostResult {
    private String id;
    private String slug;
    private String title;
    private String excerpt;
    private String coverImageUrl;
    private String communityId;
    private String communityName;
    private String category;
    private List<String> tags;
    private String authorId;
    private String authorName;
    private String authorAvatarUrl;
    private Instant publishedAt;
    private long viewCount;
    private int likeCount;
    private int commentCount;
    private boolean friendAuthor;
}
