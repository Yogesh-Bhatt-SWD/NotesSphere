package com.notesphere.service;

import com.notesphere.dto.request.JournalRequest;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.dto.response.SentimentResponse;
import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.enums.SentimentLabel;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.exception.UnauthorizedException;
import com.notesphere.repository.JournalEntryRepository;
import com.notesphere.repository.JournalSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing journal entries with validation, ownership checks,
 * sentiment analysis, categorization, favorites, pinning, and advanced filtering.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JournalService {

    private final JournalEntryRepository journalRepository;
    private final SentimentAnalysisService sentimentAnalysisService;
    private final TaggingService taggingService;

    @Transactional
    public JournalResponse createJournal(String userId, JournalRequest request) {
        SentimentResponse sentiment = sentimentAnalysisService.analyzeSentiment(request.getContent());
        List<String> combinedTags = taggingService.mergeTags(request.getTags(), request.getContent());

        String category = (request.getCategory() != null && !request.getCategory().isBlank())
                ? request.getCategory().trim()
                : taggingService.classifyCategory(request.getContent());

        boolean favorite = Boolean.TRUE.equals(request.getFavorite());
        boolean pinned = Boolean.TRUE.equals(request.getPinned());

        JournalEntry entry = JournalEntry.builder()
                .userId(userId)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .tags(combinedTags)
                .category(category)
                .favorite(favorite)
                .pinned(pinned)
                .sentimentLabel(sentiment.getLabel())
                .compoundScore(sentiment.getCompound())
                .positiveScore(sentiment.getPositive())
                .negativeScore(sentiment.getNegative())
                .neutralScore(sentiment.getNeutral())
                .build();

        JournalEntry savedEntry = journalRepository.save(entry);
        log.info("Journal entry {} created for user: {}", savedEntry.getId(), userId);
        return mapToResponse(savedEntry);
    }

    @Transactional(readOnly = true)
    public JournalResponse getJournalById(String userId, String id) {
        JournalEntry entry = findEntryAndVerifyOwnership(userId, id);
        return mapToResponse(entry);
    }

    @Transactional(readOnly = true)
    public PagedResponse<JournalResponse> getUserJournals(String userId, Pageable pageable) {
        Page<JournalEntry> page = journalRepository.findByUserId(userId, pageable);
        return mapToPagedResponse(page);
    }

    @Transactional(readOnly = true)
    public PagedResponse<JournalResponse> getFilteredJournals(
            String userId,
            String query,
            SentimentLabel sentiment,
            String category,
            String tag,
            Boolean favorite,
            Boolean pinned,
            Instant startDate,
            Instant endDate,
            Pageable pageable) {

        Specification<JournalEntry> spec = JournalSpecification.filter(
                userId, query, sentiment, category, tag, favorite, pinned, startDate, endDate);

        Page<JournalEntry> page = journalRepository.findAll(spec, pageable);
        return mapToPagedResponse(page);
    }

    @Transactional
    public JournalResponse updateJournal(String userId, String id, JournalRequest request) {
        JournalEntry entry = findEntryAndVerifyOwnership(userId, id);

        boolean contentChanged = !entry.getContent().equals(request.getContent().trim());

        if (contentChanged) {
            SentimentResponse sentiment = sentimentAnalysisService.analyzeSentiment(request.getContent());
            entry.setSentimentLabel(sentiment.getLabel());
            entry.setCompoundScore(sentiment.getCompound());
            entry.setPositiveScore(sentiment.getPositive());
            entry.setNegativeScore(sentiment.getNegative());
            entry.setNeutralScore(sentiment.getNeutral());
        }

        List<String> combinedTags = taggingService.mergeTags(request.getTags(), request.getContent());
        entry.setTitle(request.getTitle().trim());
        entry.setContent(request.getContent().trim());
        entry.setTags(combinedTags);

        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            entry.setCategory(request.getCategory().trim());
        } else if (contentChanged) {
            entry.setCategory(taggingService.classifyCategory(request.getContent()));
        }

        if (request.getFavorite() != null) {
            entry.setFavorite(request.getFavorite());
        }
        if (request.getPinned() != null) {
            entry.setPinned(request.getPinned());
        }

        JournalEntry updatedEntry = journalRepository.save(entry);
        log.info("Journal entry {} updated by user: {}", id, userId);
        return mapToResponse(updatedEntry);
    }

    @Transactional
    public void deleteJournal(String userId, String id) {
        JournalEntry entry = findEntryAndVerifyOwnership(userId, id);
        journalRepository.delete(entry);
        log.info("Journal entry {} deleted by user: {}", id, userId);
    }

    @Transactional
    public JournalResponse toggleFavorite(String userId, String id) {
        JournalEntry entry = findEntryAndVerifyOwnership(userId, id);
        entry.setFavorite(!entry.isFavorite());
        JournalEntry updated = journalRepository.save(entry);
        log.info("Journal entry {} favorite status changed to {} by user: {}", id, entry.isFavorite(), userId);
        return mapToResponse(updated);
    }

    @Transactional
    public JournalResponse togglePinned(String userId, String id) {
        JournalEntry entry = findEntryAndVerifyOwnership(userId, id);
        entry.setPinned(!entry.isPinned());
        JournalEntry updated = journalRepository.save(entry);
        log.info("Journal entry {} pinned status changed to {} by user: {}", id, entry.isPinned(), userId);
        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public PagedResponse<JournalResponse> searchJournals(String userId, String query, Pageable pageable) {
        Page<JournalEntry> page = journalRepository.searchByUserIdAndQuery(userId, query, pageable);
        return mapToPagedResponse(page);
    }

    @Transactional(readOnly = true)
    public List<String> getUserTags(String userId) {
        List<JournalEntry> entries = journalRepository.findTagsByUserId(userId);
        return entries.stream()
                .flatMap(entry -> entry.getTags().stream())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getUserCategories(String userId) {
        List<JournalEntry> entries = journalRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return entries.stream()
                .map(JournalEntry::getCategory)
                .filter(c -> c != null && !c.isBlank())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    private String determineCategory(List<String> tags) {
        if (tags != null && !tags.isEmpty()) {
            return tags.get(0);
        }
        return "General";
    }

    private JournalEntry findEntryAndVerifyOwnership(String userId, String id) {
        JournalEntry entry = journalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", "id", id));

        if (!entry.getUserId().equals(userId)) {
            throw new UnauthorizedException("You do not have permission to access this journal entry");
        }
        return entry;
    }

    public JournalResponse mapToResponse(JournalEntry entry) {
        return JournalResponse.builder()
                .id(entry.getId())
                .title(entry.getTitle())
                .content(entry.getContent())
                .tags(entry.getTags())
                .category(entry.getCategory())
                .favorite(entry.isFavorite())
                .pinned(entry.isPinned())
                .sentimentLabel(entry.getSentimentLabel())
                .compoundScore(entry.getCompoundScore())
                .positiveScore(entry.getPositiveScore())
                .negativeScore(entry.getNegativeScore())
                .neutralScore(entry.getNeutralScore())
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }

    public PagedResponse<JournalResponse> mapToPagedResponse(Page<JournalEntry> page) {
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
