package com.notesphere.service;

import com.notesphere.dto.request.JournalRequest;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.dto.response.SentimentResponse;
import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.enums.SentimentLabel;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.exception.UnauthorizedException;
import com.notesphere.repository.JournalEntryRepository;
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
    void getJournalById_ThrowsUnauthorized_WhenUserDoesNotMatch() {
        when(journalRepository.findById("j1")).thenReturn(Optional.of(journalEntry));

        assertThrows(UnauthorizedException.class, () -> journalService.getJournalById("other-user", "j1"));
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
}
