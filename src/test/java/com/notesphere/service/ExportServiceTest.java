package com.notesphere.service;

import com.notesphere.dto.response.JournalResponse;
import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.enums.SentimentLabel;
import com.notesphere.repository.JournalEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ExportServiceTest {

    @Mock
    private JournalEntryRepository journalRepository;

    @Mock
    private JournalService journalService;

    @InjectMocks
    private ExportService exportService;

    private JournalEntry entry;

    @BeforeEach
    void setUp() {
        entry = JournalEntry.builder()
                .id("j1")
                .userId("u1")
                .title("Trip to Mountains")
                .content("Had an awesome hiking experience today!")
                .category("Travel")
                .tags(List.of("Travel", "Hiking"))
                .sentimentLabel(SentimentLabel.POSITIVE)
                .compoundScore(0.85)
                .favorite(true)
                .pinned(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    void exportJournalsAsJson_Success() {
        when(journalRepository.findByUserIdOrderByCreatedAtDesc("u1")).thenReturn(List.of(entry));
        when(journalService.mapToResponse(any(JournalEntry.class))).thenReturn(
                JournalResponse.builder().id("j1").title("Trip to Mountains").build());

        byte[] jsonBytes = exportService.exportJournalsAsJson("u1");

        assertNotNull(jsonBytes);
        assertTrue(jsonBytes.length > 0);
        String jsonString = new String(jsonBytes, StandardCharsets.UTF_8);
        assertTrue(jsonString.contains("Trip to Mountains"));
    }

    @Test
    void exportJournalsAsCsv_Success() {
        when(journalRepository.findByUserIdOrderByCreatedAtDesc("u1")).thenReturn(List.of(entry));

        byte[] csvBytes = exportService.exportJournalsAsCsv("u1");

        assertNotNull(csvBytes);
        assertTrue(csvBytes.length > 0);
        String csvString = new String(csvBytes, StandardCharsets.UTF_8);
        assertTrue(csvString.contains("ID,Title,Content,Category,Tags,Sentiment,CompoundScore,Favorite,Pinned,CreatedAt,UpdatedAt"));
        assertTrue(csvString.contains("Trip to Mountains"));
        assertTrue(csvString.contains("Travel;Hiking"));
    }
}
