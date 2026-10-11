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
    private String title;
    private String content;
    private List<String> tags;
    private String category;
    private boolean favorite;
    private boolean pinned;
    private SentimentLabel sentimentLabel;
    private double compoundScore;
    private double positiveScore;
    private double negativeScore;
    private double neutralScore;
    private Instant createdAt;
    private Instant updatedAt;
}
