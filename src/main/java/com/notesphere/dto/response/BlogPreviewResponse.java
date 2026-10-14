package com.notesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Public preview DTO for published blog/journal articles.
 * Contains only non-sensitive metadata and an introductory excerpt.
 * The full article content and private user data are strictly excluded.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogPreviewResponse {

    private String id;
    private String slug;
    private String title;
    private String excerpt;
    private String content;
    private String coverImageUrl;
    private String category;
    private List<String> tags;
    private Instant publishedAt;
    private int readingTimeMinutes;
    private long viewCount;
    private int likeCount;
    private String authorName;
    private String authorAvatarUrl;
    private boolean communityPost;
    private String communityName;
}
