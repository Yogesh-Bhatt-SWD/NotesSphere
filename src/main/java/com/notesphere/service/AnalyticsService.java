package com.notesphere.service;

import com.notesphere.dto.response.JournalResponse;
import com.notesphere.dto.response.MonthlyCalendarResponse;
import com.notesphere.dto.response.StreakResponse;
import com.notesphere.dto.response.UserAnalyticsResponse;
import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.enums.SentimentLabel;
import com.notesphere.repository.JournalEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for calculating user-scoped analytics, calendar dates, and writing streaks.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final JournalEntryRepository journalRepository;
    private final JournalService journalService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    @Transactional(readOnly = true)
    public UserAnalyticsResponse getUserAnalytics(String userId) {
        long totalJournals = journalRepository.countByUserId(userId);
        long favoriteJournals = journalRepository.countByUserIdAndFavoriteTrue(userId);
        long pinnedJournals = journalRepository.countByUserIdAndPinnedTrue(userId);

        Double avgScore = journalRepository.getAverageCompoundScoreByUserId(userId);
        double averageSentimentScore = avgScore != null ? Math.round(avgScore * 10000.0) / 10000.0 : 0.0;

        // Sentiment distribution
        Map<String, Long> sentimentDistribution = new LinkedHashMap<>();
        sentimentDistribution.put(SentimentLabel.POSITIVE.name(), 0L);
        sentimentDistribution.put(SentimentLabel.NEUTRAL.name(), 0L);
        sentimentDistribution.put(SentimentLabel.NEGATIVE.name(), 0L);

        List<Object[]> sentimentRows = journalRepository.countSentimentDistributionByUserId(userId);
        for (Object[] row : sentimentRows) {
            if (row[0] != null) {
                sentimentDistribution.put(((SentimentLabel) row[0]).name(), (Long) row[1]);
            }
        }

        // Category distribution
        Map<String, Long> categoryDistribution = new LinkedHashMap<>();
        List<Object[]> categoryRows = journalRepository.countCategoryDistributionByUserId(userId);
        for (Object[] row : categoryRows) {
            String category = row[0] != null ? (String) row[0] : "General";
            categoryDistribution.put(category, (Long) row[1]);
        }

        // Entries for timeline and streak
        List<JournalEntry> entries = journalRepository.findByUserIdOrderByCreatedAtAsc(userId);

        // Activity timeline (Date -> Count)
        Map<String, Long> activityTimeline = new LinkedHashMap<>();
        for (JournalEntry entry : entries) {
            String dateKey = DATE_FORMATTER.format(entry.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate());
            activityTimeline.put(dateKey, activityTimeline.getOrDefault(dateKey, 0L) + 1);
        }

        StreakResponse streak = calculateStreak(entries);

        return UserAnalyticsResponse.builder()
                .totalJournals(totalJournals)
                .favoriteJournals(favoriteJournals)
                .pinnedJournals(pinnedJournals)
                .averageSentimentScore(averageSentimentScore)
                .sentimentDistribution(sentimentDistribution)
                .categoryDistribution(categoryDistribution)
                .currentStreak(streak.getCurrentStreak())
                .longestStreak(streak.getLongestStreak())
                .activityTimeline(activityTimeline)
                .build();
    }

    @Transactional(readOnly = true)
    public StreakResponse getUserStreaks(String userId) {
        List<JournalEntry> entries = journalRepository.findByUserIdOrderByCreatedAtAsc(userId);
        return calculateStreak(entries);
    }

    @Transactional(readOnly = true)
    public List<String> getCalendarDates(String userId) {
        List<JournalEntry> entries = journalRepository.findByUserIdOrderByCreatedAtAsc(userId);
        return entries.stream()
                .map(e -> DATE_FORMATTER.format(e.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate()))
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MonthlyCalendarResponse getMonthlyCalendar(String userId, int year, int month) {
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12");
        }

        YearMonth ym = YearMonth.of(year, month);
        Instant startDate = ym.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endDate = ym.atEndOfMonth().atTime(LocalTime.MAX).atZone(ZoneOffset.UTC).toInstant();

        List<JournalEntry> entries = journalRepository.findByUserIdAndCreatedAtBetween(userId, startDate, endDate);

        Map<String, List<JournalResponse>> entriesByDate = new TreeMap<>();
        for (JournalEntry entry : entries) {
            String dateKey = DATE_FORMATTER.format(entry.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate());
            entriesByDate.computeIfAbsent(dateKey, k -> new ArrayList<>())
                    .add(journalService.mapToResponse(entry));
        }

        List<String> activeDates = new ArrayList<>(entriesByDate.keySet());

        return MonthlyCalendarResponse.builder()
                .year(year)
                .month(month)
                .totalEntries(entries.size())
                .activeDates(activeDates)
                .entriesByDate(entriesByDate)
                .build();
    }

    private StreakResponse calculateStreak(List<JournalEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            return StreakResponse.builder()
                    .currentStreak(0)
                    .longestStreak(0)
                    .lastEntryDate(null)
                    .activeToday(false)
                    .build();
        }

        Set<LocalDate> dateSet = entries.stream()
                .map(e -> e.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate())
                .collect(Collectors.toSet());

        List<LocalDate> sortedDates = dateSet.stream().sorted().toList();
        LocalDate lastEntryDate = sortedDates.get(sortedDates.size() - 1);

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate yesterday = today.minusDays(1);
        boolean activeToday = dateSet.contains(today);

        // Current streak
        int currentStreak = 0;
        LocalDate cursor = null;
        if (activeToday) {
            cursor = today;
        } else if (dateSet.contains(yesterday)) {
            cursor = yesterday;
        }

        if (cursor != null) {
            while (dateSet.contains(cursor)) {
                currentStreak++;
                cursor = cursor.minusDays(1);
            }
        }

        // Longest streak
        int longestStreak = 0;
        int tempStreak = 0;
        LocalDate previousDate = null;

        for (LocalDate date : sortedDates) {
            if (previousDate == null) {
                tempStreak = 1;
            } else if (date.equals(previousDate.plusDays(1))) {
                tempStreak++;
            } else {
                tempStreak = 1;
            }
            if (tempStreak > longestStreak) {
                longestStreak = tempStreak;
            }
            previousDate = date;
        }

        return StreakResponse.builder()
                .currentStreak(currentStreak)
                .longestStreak(longestStreak)
                .lastEntryDate(lastEntryDate)
                .activeToday(activeToday)
                .build();
    }
}
