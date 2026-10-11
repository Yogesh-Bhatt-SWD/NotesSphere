package com.notesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO for comprehensive user analytics: volume, sentiment, category, activity, and streaks.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAnalyticsResponse {

    private long totalJournals;
    private long favoriteJournals;
    private long pinnedJournals;
    private double averageSentimentScore;
    private Map<String, Long> sentimentDistribution;
    private Map<String, Long> categoryDistribution;
    private int currentStreak;
    private int longestStreak;
    private Map<String, Long> activityTimeline;
}
