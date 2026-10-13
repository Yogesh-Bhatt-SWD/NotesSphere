package com.notesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Typed DTO for personal Journal Insights and statistics.
 * Reflects real user data: volume, streaks, actual word counts, weekly goals, and daily activity.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalInsightsResponse {

    private long totalJournals;
    private int currentStreakDays;
    private int longestStreakDays;
    private long totalWordsWritten;
    private long wordsWrittenThisWeek;
    private int dailyWordGoal;
    private int weeklyWordGoal;
    private int weeklyGoalCompletionPercent;
    private LocalDate lastWritingActivityDate;
    private boolean activeToday;
    private List<DailyActivityDto> dailyActivities;
    private List<RecentJournalActivityDto> recentActivities;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyActivityDto {
        private String date; // YYYY-MM-DD
        private String dayLabel; // e.g. "Mon", "Tue"
        private long wordCount;
        private int journalCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentJournalActivityDto {
        private String id;
        private String title;
        private String category;
        private int wordCount;
        private java.time.Instant createdAt;
    }
}
