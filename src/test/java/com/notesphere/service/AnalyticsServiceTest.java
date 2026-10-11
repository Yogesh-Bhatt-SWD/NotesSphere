package com.notesphere.service;

import com.notesphere.dto.response.JournalResponse;
import com.notesphere.dto.response.MonthlyCalendarResponse;
import com.notesphere.dto.response.StreakResponse;
import com.notesphere.dto.response.UserAnalyticsResponse;
import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.enums.SentimentLabel;
import com.notesphere.repository.JournalEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AnalyticsServiceTest {

    @Mock
    private JournalEntryRepository journalRepository;

    @Mock
    private JournalService journalService;

    @InjectMocks
    private AnalyticsService analyticsService;

    private List<JournalEntry> entries;

    @BeforeEach
    void setUp() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Instant todayInstant = today.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant yesterdayInstant = today.minusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant twoDaysAgoInstant = today.minusDays(2).atStartOfDay(ZoneOffset.UTC).toInstant();

        entries = new ArrayList<>();
        entries.add(JournalEntry.builder().id("1").userId("u1").createdAt(twoDaysAgoInstant).category("Work").sentimentLabel(SentimentLabel.POSITIVE).build());
        entries.add(JournalEntry.builder().id("2").userId("u1").createdAt(yesterdayInstant).category("Work").sentimentLabel(SentimentLabel.POSITIVE).build());
        entries.add(JournalEntry.builder().id("3").userId("u1").createdAt(todayInstant).category("Health").sentimentLabel(SentimentLabel.NEUTRAL).build());
    }

    @Test
    void getUserAnalytics_Success() {
        when(journalRepository.countByUserId("u1")).thenReturn(3L);
        when(journalRepository.countByUserIdAndFavoriteTrue("u1")).thenReturn(1L);
        when(journalRepository.countByUserIdAndPinnedTrue("u1")).thenReturn(0L);
        when(journalRepository.getAverageCompoundScoreByUserId("u1")).thenReturn(0.55);

        List<Object[]> sentimentRows = new ArrayList<>();
        sentimentRows.add(new Object[]{SentimentLabel.POSITIVE, 2L});
        sentimentRows.add(new Object[]{SentimentLabel.NEUTRAL, 1L});
        when(journalRepository.countSentimentDistributionByUserId("u1")).thenReturn(sentimentRows);

        List<Object[]> categoryRows = new ArrayList<>();
        categoryRows.add(new Object[]{"Work", 2L});
        categoryRows.add(new Object[]{"Health", 1L});
        when(journalRepository.countCategoryDistributionByUserId("u1")).thenReturn(categoryRows);

        when(journalRepository.findByUserIdOrderByCreatedAtAsc("u1")).thenReturn(entries);

        UserAnalyticsResponse response = analyticsService.getUserAnalytics("u1");

        assertNotNull(response);
        assertEquals(3L, response.getTotalJournals());
        assertEquals(1L, response.getFavoriteJournals());
        assertEquals(0.55, response.getAverageSentimentScore());
        assertEquals(2L, response.getSentimentDistribution().get("POSITIVE"));
        assertEquals(1L, response.getCategoryDistribution().get("Health"));
        assertEquals(3, response.getCurrentStreak());
        assertEquals(3, response.getLongestStreak());
    }

    @Test
    void getUserStreaks_ActiveToday() {
        when(journalRepository.findByUserIdOrderByCreatedAtAsc("u1")).thenReturn(entries);

        StreakResponse streaks = analyticsService.getUserStreaks("u1");

        assertNotNull(streaks);
        assertTrue(streaks.isActiveToday());
        assertEquals(3, streaks.getCurrentStreak());
        assertEquals(3, streaks.getLongestStreak());
    }

    @Test
    void getUserStreaks_EmptyEntries() {
        when(journalRepository.findByUserIdOrderByCreatedAtAsc("u1")).thenReturn(List.of());

        StreakResponse streaks = analyticsService.getUserStreaks("u1");

        assertNotNull(streaks);
        assertFalse(streaks.isActiveToday());
        assertEquals(0, streaks.getCurrentStreak());
        assertEquals(0, streaks.getLongestStreak());
    }

    @Test
    void getCalendarDates_Success() {
        when(journalRepository.findByUserIdOrderByCreatedAtAsc("u1")).thenReturn(entries);

        List<String> dates = analyticsService.getCalendarDates("u1");

        assertNotNull(dates);
        assertEquals(3, dates.size());
    }

    @Test
    void getMonthlyCalendar_Success() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        when(journalRepository.findByUserIdAndCreatedAtBetween(eq("u1"), any(Instant.class), any(Instant.class)))
                .thenReturn(entries);
        when(journalService.mapToResponse(any(JournalEntry.class)))
                .thenReturn(JournalResponse.builder().id("1").title("Title").build());

        MonthlyCalendarResponse response = analyticsService.getMonthlyCalendar(
                "u1", today.getYear(), today.getMonthValue());

        assertNotNull(response);
        assertEquals(3, response.getTotalEntries());
        assertFalse(response.getActiveDates().isEmpty());
    }
}
