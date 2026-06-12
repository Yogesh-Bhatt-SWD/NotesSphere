package com.notesphere.service;

import com.notesphere.dto.request.JournalRequest;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.dto.response.SentimentResponse;
import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.enums.SentimentLabel;
import com.notesphere.repository.JournalEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

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
                .sentimentLabel(SentimentLabel.POSITIVE)
                .build();

        sentimentResponse = SentimentResponse.builder()
                .label(SentimentLabel.POSITIVE)
                .compound(0.8)
                .build();
    }

    @Test
    void createJournal_Success() {
        JournalRequest request = new JournalRequest("Test Title", "Test Content", List.of("tag1"));

        when(sentimentAnalysisService.analyzeSentiment(anyString())).thenReturn(sentimentResponse);
        when(taggingService.mergeTags(any(), anyString())).thenReturn(List.of("tag1"));
        when(journalRepository.save(any(JournalEntry.class))).thenReturn(journalEntry);

        JournalResponse response = journalService.createJournal("u1", request);

        assertNotNull(response);
        assertEquals("Test Title", response.getTitle());
        assertEquals(SentimentLabel.POSITIVE, response.getSentimentLabel());
    }
}
