package com.notesphere.dto.response;

import com.notesphere.entity.enums.SentimentLabel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * DTO for journal entry responses including sentiment data, categories, and flags.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalResponse {

    private String id;
    private String slug;
    private String title;
    private String content;
    private String coverImageUrl;
    private int readingTimeMinutes;
    private int wordCount;
    private List<String> tags;
    private String category;
    private boolean favorite;
    private boolean pinned;
    private com.notesphere.entity.enums.JournalVisibility visibility;
    private String communityId;
    private String communityName;
    private Instant publishedAt;
    private int likeCount;
    private int commentCount;
    private long viewCount;
    private boolean likedByCurrentUser;
    private String authorId;
    private String authorName;
    private String authorAvatarUrl;
    private SentimentLabel sentimentLabel;
    private double compoundScore;
    private double positiveScore;
    private double negativeScore;
    private double neutralScore;
    private Instant createdAt;
    private Instant updatedAt;
}
