package com.notesphere.service;

import com.notesphere.dto.request.JournalRequest;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.dto.response.SentimentResponse;
import com.notesphere.entity.JournalEntry;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.exception.UnauthorizedException;
import com.notesphere.repository.JournalEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing journal entries.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JournalService {

    private final JournalEntryRepository journalRepository;
    private final SentimentAnalysisService sentimentAnalysisService;
    private final TaggingService taggingService;

    public JournalResponse createJournal(String userId, JournalRequest request) {
        SentimentResponse sentiment = sentimentAnalysisService.analyzeSentiment(request.getContent());
        List<String> combinedTags = taggingService.mergeTags(request.getTags(), request.getContent());

        JournalEntry entry = JournalEntry.builder()
                .userId(userId)
                .title(request.getTitle())
                .content(request.getContent())
                .tags(combinedTags)
                .sentimentLabel(sentiment.getLabel())
                .compoundScore(sentiment.getCompound())
                .positiveScore(sentiment.getPositive())
                .negativeScore(sentiment.getNegative())
                .neutralScore(sentiment.getNeutral())
                .build();

        JournalEntry savedEntry = journalRepository.save(entry);
        log.info("Journal entry created for user: {}", userId);
        return mapToResponse(savedEntry);
    }

    public JournalResponse getJournalById(String userId, String id) {
        JournalEntry entry = findEntryAndVerifyOwnership(userId, id);
        return mapToResponse(entry);
    }

    public PagedResponse<JournalResponse> getUserJournals(String userId, Pageable pageable) {
        Page<JournalEntry> page = journalRepository.findByUserId(userId, pageable);
        return mapToPagedResponse(page);
    }

    public JournalResponse updateJournal(String userId, String id, JournalRequest request) {
        JournalEntry entry = findEntryAndVerifyOwnership(userId, id);

        SentimentResponse sentiment = sentimentAnalysisService.analyzeSentiment(request.getContent());
        List<String> combinedTags = taggingService.mergeTags(request.getTags(), request.getContent());

        entry.setTitle(request.getTitle());
        entry.setContent(request.getContent());
        entry.setTags(combinedTags);
        entry.setSentimentLabel(sentiment.getLabel());
        entry.setCompoundScore(sentiment.getCompound());
        entry.setPositiveScore(sentiment.getPositive());
        entry.setNegativeScore(sentiment.getNegative());
        entry.setNeutralScore(sentiment.getNeutral());

        JournalEntry updatedEntry = journalRepository.save(entry);
        log.info("Journal entry {} updated by user: {}", id, userId);
        return mapToResponse(updatedEntry);
    }

    public void deleteJournal(String userId, String id) {
        JournalEntry entry = findEntryAndVerifyOwnership(userId, id);
        journalRepository.delete(entry);
        log.info("Journal entry {} deleted by user: {}", id, userId);
    }

    public PagedResponse<JournalResponse> searchJournals(String userId, String query, Pageable pageable) {
        Page<JournalEntry> page = journalRepository.searchByUserIdAndQuery(userId, query, pageable);
        return mapToPagedResponse(page);
    }

    public List<String> getUserTags(String userId) {
        List<JournalEntry> entries = journalRepository.findTagsByUserId(userId);
        return entries.stream()
                .flatMap(entry -> entry.getTags().stream())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    private JournalEntry findEntryAndVerifyOwnership(String userId, String id) {
        JournalEntry entry = journalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", "id", id));

        if (!entry.getUserId().equals(userId)) {
            throw new UnauthorizedException("You do not have permission to access this journal entry");
        }
        return entry;
    }

    private JournalResponse mapToResponse(JournalEntry entry) {
        return JournalResponse.builder()
                .id(entry.getId())
                .title(entry.getTitle())
                .content(entry.getContent())
                .tags(entry.getTags())
                .sentimentLabel(entry.getSentimentLabel())
                .compoundScore(entry.getCompoundScore())
                .positiveScore(entry.getPositiveScore())
                .negativeScore(entry.getNegativeScore())
                .neutralScore(entry.getNeutralScore())
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }

    private PagedResponse<JournalResponse> mapToPagedResponse(Page<JournalEntry> page) {
        List<JournalResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<JournalResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
