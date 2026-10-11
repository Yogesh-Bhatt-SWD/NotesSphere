package com.notesphere.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.entity.JournalEntry;
import com.notesphere.repository.JournalEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for exporting authenticated user's journals in JSON and CSV formats.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private final JournalEntryRepository journalRepository;
    private final JournalService journalService;

    @Transactional(readOnly = true)
    public byte[] exportJournalsAsJson(String userId) {
        List<JournalEntry> entries = journalRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<JournalResponse> responseList = entries.stream()
                .map(journalService::mapToResponse)
                .collect(Collectors.toList());

        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.enable(SerializationFeature.INDENT_OUTPUT);
            return mapper.writeValueAsBytes(responseList);
        } catch (Exception e) {
            log.error("Failed to export journals as JSON for user: {}", userId, e);
            throw new RuntimeException("Failed to generate JSON export", e);
        }
    }

    @Transactional(readOnly = true)
    public byte[] exportJournalsAsCsv(String userId) {
        List<JournalEntry> entries = journalRepository.findByUserIdOrderByCreatedAtDesc(userId);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8))) {
            // Write CSV Header
            writer.println("ID,Title,Content,Category,Tags,Sentiment,CompoundScore,Favorite,Pinned,CreatedAt,UpdatedAt");

            for (JournalEntry entry : entries) {
                String tagsString = entry.getTags() != null ? String.join(";", entry.getTags()) : "";
                String sentiment = entry.getSentimentLabel() != null ? entry.getSentimentLabel().name() : "";
                String createdAt = entry.getCreatedAt() != null ? entry.getCreatedAt().toString() : "";
                String updatedAt = entry.getUpdatedAt() != null ? entry.getUpdatedAt().toString() : "";

                writer.println(String.format("%s,%s,%s,%s,%s,%s,%.4f,%b,%b,%s,%s",
                        escapeCsv(entry.getId()),
                        escapeCsv(entry.getTitle()),
                        escapeCsv(entry.getContent()),
                        escapeCsv(entry.getCategory()),
                        escapeCsv(tagsString),
                        escapeCsv(sentiment),
                        entry.getCompoundScore(),
                        entry.isFavorite(),
                        entry.isPinned(),
                        escapeCsv(createdAt),
                        escapeCsv(updatedAt)
                ));
            }
            writer.flush();
            return out.toByteArray();
        }
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "\"\"";
        }
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
