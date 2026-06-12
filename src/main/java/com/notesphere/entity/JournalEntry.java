package com.notesphere.entity;

import com.notesphere.entity.enums.SentimentLabel;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * MongoDB document representing a journal entry with sentiment analysis data.
 */
@Document(collection = "journal_entries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntry {

    @Id
    private String id;

    private String title;

    private String content;

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    private SentimentLabel sentimentLabel;

    private double compoundScore;

    private double positiveScore;

    private double negativeScore;

    private double neutralScore;

    @Indexed
    private String userId;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
