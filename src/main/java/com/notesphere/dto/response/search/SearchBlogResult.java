package com.notesphere.dto.response.search;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Result DTO for a published blog/article match in global search.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchBlogResult {
    private String id;
    private String slug;
    private String title;
    private String excerpt;
    private String coverImageUrl;
    private String category;
    private List<String> tags;
    private String authorId;
    private String authorName;
    private String authorAvatarUrl;
    private Instant publishedAt;
    private long viewCount;
    private int likeCount;
    private int readingTimeMinutes;
    private boolean friendAuthor;
}
