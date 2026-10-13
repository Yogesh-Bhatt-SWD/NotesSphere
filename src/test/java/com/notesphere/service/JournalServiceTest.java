package com.notesphere.service;

import com.notesphere.dto.request.JournalRequest;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.dto.response.SentimentResponse;
import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.enums.SentimentLabel;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.exception.UnauthorizedException;
import com.notesphere.repository.JournalEntryRepository;
import com.notesphere.repository.JournalViewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class JournalServiceTest {

    @Mock
    private JournalEntryRepository journalRepository;

    @Mock
    private SentimentAnalysisService sentimentAnalysisService;

    @Mock
    private TaggingService taggingService;

    @Mock
    private JournalViewRepository journalViewRepository;

    @Mock
    private com.notesphere.repository.UserRepository userRepository;

    @InjectMocks
    private JournalService journalService;

    private JournalEntry journalEntry;
    private SentimentResponse sentimentResponse;

    @BeforeEach
    void setUp() {
        journalEntry = JournalEntry.builder()
                .id("j1")
                .userId("u1")
                .title("Test Title")
                .content("Test Content")
                .category("General")
                .favorite(false)
                .pinned(false)
                .sentimentLabel(SentimentLabel.POSITIVE)
                .compoundScore(0.8)
                .build();

        sentimentResponse = SentimentResponse.builder()
                .label(SentimentLabel.POSITIVE)
                .compound(0.8)
                .build();
    }

    @Test
    void createJournal_Success() {
        JournalRequest request = JournalRequest.builder()
                .title("Test Title")
                .content("Test Content")
                .tags(List.of("tag1"))
                .favorite(true)
                .pinned(false)
                .build();

        when(sentimentAnalysisService.analyzeSentiment(anyString())).thenReturn(sentimentResponse);
        when(taggingService.mergeTags(any(), anyString())).thenReturn(List.of("tag1"));
        when(journalRepository.save(any(JournalEntry.class))).thenReturn(journalEntry);

        JournalResponse response = journalService.createJournal("u1", request);

        assertNotNull(response);
        assertEquals("Test Title", response.getTitle());
        assertEquals(SentimentLabel.POSITIVE, response.getSentimentLabel());
        verify(journalRepository).save(any(JournalEntry.class));
    }

    @Test
    void getJournalById_Success() {
        when(journalRepository.findById("j1")).thenReturn(Optional.of(journalEntry));

        JournalResponse response = journalService.getJournalById("u1", "j1");

        assertNotNull(response);
        assertEquals("j1", response.getId());
        assertEquals("Test Title", response.getTitle());
    }

    @Test
    void getJournalById_ThrowsAccessDenied_WhenUserDoesNotMatch() {
        when(journalRepository.findById("j1")).thenReturn(Optional.of(journalEntry));

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> journalService.getJournalById("other-user", "j1"));
    }

    @Test
    void getJournalById_ThrowsNotFound_WhenIdDoesNotExist() {
        when(journalRepository.findById("non-existent")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> journalService.getJournalById("u1", "non-existent"));
    }

    @Test
    void updateJournal_ContentChanged_ReanalyzesSentimentAndCategory() {
        JournalRequest updateReq = JournalRequest.builder()
                .title("Updated Title")
                .content("Completely new content about my work job meeting")
                .tags(List.of("Work"))
                .build();

        when(journalRepository.findById("j1")).thenReturn(Optional.of(journalEntry));
        when(sentimentAnalysisService.analyzeSentiment("Completely new content about my work job meeting")).thenReturn(sentimentResponse);
        when(taggingService.mergeTags(any(), anyString())).thenReturn(List.of("Work"));
        when(taggingService.classifyCategory(anyString())).thenReturn("Work");
        when(journalRepository.save(any(JournalEntry.class))).thenReturn(journalEntry);

        JournalResponse response = journalService.updateJournal("u1", "j1", updateReq);

        assertNotNull(response);
        verify(sentimentAnalysisService).analyzeSentiment("Completely new content about my work job meeting");
        verify(taggingService).classifyCategory("Completely new content about my work job meeting");
        verify(journalRepository).save(journalEntry);
    }

    @Test
    void updateJournal_ContentUnchanged_DoesNotReanalyzeSentiment() {
        JournalRequest updateReq = JournalRequest.builder()
                .title("New Title Only")
                .content("Test Content") // Same content as existing journalEntry
                .build();

        when(journalRepository.findById("j1")).thenReturn(Optional.of(journalEntry));
        when(taggingService.mergeTags(any(), anyString())).thenReturn(List.of("tag1"));
        when(journalRepository.save(any(JournalEntry.class))).thenReturn(journalEntry);

        JournalResponse response = journalService.updateJournal("u1", "j1", updateReq);

        assertNotNull(response);
        verify(sentimentAnalysisService, never()).analyzeSentiment(anyString());
        verify(journalRepository).save(journalEntry);
    }

    @Test
    void deleteJournal_Success() {
        when(journalRepository.findById("j1")).thenReturn(Optional.of(journalEntry));

        journalService.deleteJournal("u1", "j1");

        verify(journalRepository).delete(journalEntry);
    }

    @Test
    void toggleFavorite_Success() {
        when(journalRepository.findById("j1")).thenReturn(Optional.of(journalEntry));
        when(journalRepository.save(any(JournalEntry.class))).thenReturn(journalEntry);

        JournalResponse response = journalService.toggleFavorite("u1", "j1");

        assertNotNull(response);
        assertTrue(journalEntry.isFavorite());
        verify(journalRepository).save(journalEntry);
    }

    @Test
    void togglePinned_Success() {
        when(journalRepository.findById("j1")).thenReturn(Optional.of(journalEntry));
        when(journalRepository.save(any(JournalEntry.class))).thenReturn(journalEntry);

        JournalResponse response = journalService.togglePinned("u1", "j1");

        assertNotNull(response);
        assertTrue(journalEntry.isPinned());
        verify(journalRepository).save(journalEntry);
    }

    @Test
    void getFilteredJournals_Success() {
        org.springframework.data.domain.Page<JournalEntry> page = new org.springframework.data.domain.PageImpl<>(List.of(journalEntry));
        when(journalRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(page);

        var result = journalService.getFilteredJournals(
                "u1", "query", SentimentLabel.POSITIVE, "General", "tag1", false, false, null, null,
                org.springframework.data.domain.PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("Test Title", result.getContent().get(0).getTitle());
    }

    @Test
    void searchJournals_Success() {
        org.springframework.data.domain.Page<JournalEntry> page = new org.springframework.data.domain.PageImpl<>(List.of(journalEntry));
        when(journalRepository.searchByUserIdAndQuery(eq("u1"), eq("test"), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(page);

        var result = journalService.searchJournals("u1", "test", org.springframework.data.domain.PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    void getUserCategories_Success() {
        JournalEntry entry1 = JournalEntry.builder().userId("u1").category("Work").build();
        JournalEntry entry2 = JournalEntry.builder().userId("u1").category("Health").build();
        when(journalRepository.findByUserIdOrderByCreatedAtDesc("u1")).thenReturn(List.of(entry1, entry2));

        List<String> categories = journalService.getUserCategories("u1");

        assertNotNull(categories);
        assertEquals(2, categories.size());
        assertTrue(categories.contains("Work"));
        assertTrue(categories.contains("Health"));
    }

    @Test
    void getJournalInsights_ActiveStreakAndWordCalculations() {
        java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneOffset.UTC);
        java.time.Instant todayInstant = today.atStartOfDay(java.time.ZoneOffset.UTC).plusSeconds(3600).toInstant();
        java.time.Instant yesterdayInstant = today.minusDays(1).atStartOfDay(java.time.ZoneOffset.UTC).plusSeconds(3600).toInstant();

        JournalEntry j1 = JournalEntry.builder()
                .id("j1")
                .userId("u1")
                .title("Day 1 Journal")
                .content("Writing five words in this journal")
                .wordCount(6)
                .createdAt(yesterdayInstant)
                .category("Mindfulness")
                .build();

        JournalEntry j2 = JournalEntry.builder()
                .id("j2")
                .userId("u1")
                .title("Day 2 Journal")
                .content("<p>Today I wrote another four words here</p>")
                .wordCount(7)
                .createdAt(todayInstant)
                .category("Goals")
                .build();

        when(journalRepository.countByUserId("u1")).thenReturn(2L);
        when(journalRepository.findByUserIdOrderByCreatedAtAsc("u1")).thenReturn(List.of(j1, j2));
        when(userRepository.findById("u1")).thenReturn(java.util.Optional.of(com.notesphere.entity.User.builder().id("u1").dailyWritingGoalWords(10).build()));

        var insights = journalService.getJournalInsights("u1");

        assertNotNull(insights);
        assertEquals(2L, insights.getTotalJournals());
        assertEquals(13L, insights.getTotalWordsWritten());
        assertEquals(2, insights.getCurrentStreakDays());
        assertTrue(insights.isActiveToday());
        assertEquals(10, insights.getDailyWordGoal());
        assertEquals(70, insights.getWeeklyWordGoal());
        // 13 words / 70 goal = ~19%
        assertEquals(19, insights.getWeeklyGoalCompletionPercent());
        assertEquals(7, insights.getDailyActivities().size());
        assertEquals(2, insights.getRecentActivities().size());
    }

    @Test
    void getJournalInsights_StreakPreservedWhenNotWrittenToday() {
        java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneOffset.UTC);
        java.time.Instant yesterdayInstant = today.minusDays(1).atStartOfDay(java.time.ZoneOffset.UTC).plusSeconds(3600).toInstant();

        JournalEntry j1 = JournalEntry.builder()
                .id("j1")
                .userId("u1")
                .title("Yesterday Entry")
                .content("Wrote something yesterday")
                .wordCount(3)
                .createdAt(yesterdayInstant)
                .build();

        when(journalRepository.countByUserId("u1")).thenReturn(1L);
        when(journalRepository.findByUserIdOrderByCreatedAtAsc("u1")).thenReturn(List.of(j1));
        when(userRepository.findById("u1")).thenReturn(java.util.Optional.empty());

        var insights = journalService.getJournalInsights("u1");

        assertNotNull(insights);
        assertEquals(1, insights.getCurrentStreakDays());
        assertFalse(insights.isActiveToday());
        assertEquals(3L, insights.getTotalWordsWritten());
    }

    @Test
    void getJournalInsights_BrokenStreakWhenInactiveTwoDays() {
        java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneOffset.UTC);
        java.time.Instant twoDaysAgo = today.minusDays(2).atStartOfDay(java.time.ZoneOffset.UTC).toInstant();

        JournalEntry j1 = JournalEntry.builder()
                .id("j1")
                .userId("u1")
                .title("Old Entry")
                .content("Old entry content")
                .wordCount(3)
                .createdAt(twoDaysAgo)
                .build();

        when(journalRepository.countByUserId("u1")).thenReturn(1L);
        when(journalRepository.findByUserIdOrderByCreatedAtAsc("u1")).thenReturn(List.of(j1));
        when(userRepository.findById("u1")).thenReturn(java.util.Optional.empty());

        var insights = journalService.getJournalInsights("u1");

        assertNotNull(insights);
        assertEquals(0, insights.getCurrentStreakDays());
        assertFalse(insights.isActiveToday());
    }

    @Test
    void getJournalInsights_EmptyState() {
        when(journalRepository.countByUserId("u-empty")).thenReturn(0L);
        when(journalRepository.findByUserIdOrderByCreatedAtAsc("u-empty")).thenReturn(List.of());
        when(userRepository.findById("u-empty")).thenReturn(java.util.Optional.empty());

        var insights = journalService.getJournalInsights("u-empty");

        assertNotNull(insights);
        assertEquals(0L, insights.getTotalJournals());
        assertEquals(0, insights.getCurrentStreakDays());
        assertEquals(0L, insights.getTotalWordsWritten());
        assertEquals(0L, insights.getWordsWrittenThisWeek());
        assertEquals(0, insights.getWeeklyGoalCompletionPercent());
        assertFalse(insights.isActiveToday());
        assertNull(insights.getLastWritingActivityDate());
        assertEquals(7, insights.getDailyActivities().size());
        assertTrue(insights.getRecentActivities().isEmpty());
    }
}
