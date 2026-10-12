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
    private final com.notesphere.repository.CommunityRepository communityRepository;
    private final com.notesphere.repository.CommunityMemberRepository communityMemberRepository;
    private final com.notesphere.repository.UserRepository userRepository;
    private final com.notesphere.repository.PostReactionRepository postReactionRepository;
    private final com.notesphere.repository.JournalViewRepository journalViewRepository;

    @Transactional
    public JournalResponse createJournal(String userId, JournalRequest request) {
        SentimentResponse sentiment = sentimentAnalysisService.analyzeSentiment(request.getContent());
        List<String> combinedTags = taggingService.mergeTags(request.getTags(), request.getContent());

        String category = (request.getCategory() != null && !request.getCategory().isBlank())
                ? request.getCategory().trim()
                : taggingService.classifyCategory(request.getContent());

        boolean favorite = Boolean.TRUE.equals(request.getFavorite());
        boolean pinned = Boolean.TRUE.equals(request.getPinned());

        com.notesphere.entity.enums.JournalVisibility visibility = request.getVisibility() != null
                ? request.getVisibility()
                : com.notesphere.entity.enums.JournalVisibility.PRIVATE;
        String communityId = null;
        String communityName = null;
        Instant publishedAt = null;

        if (visibility == com.notesphere.entity.enums.JournalVisibility.COMMUNITY) {
            if (request.getCommunityId() == null || request.getCommunityId().isBlank()) {
                throw new com.notesphere.exception.BadRequestException("Community ID is required when publishing a journal to a community");
            }
            com.notesphere.entity.Community community = communityRepository.findById(request.getCommunityId())
                    .orElseThrow(() -> new ResourceNotFoundException("Community", "id", request.getCommunityId()));
            if (!communityMemberRepository.existsByCommunityIdAndUserId(community.getId(), userId)) {
                throw new org.springframework.security.access.AccessDeniedException("You must be a member of " + community.getName() + " to publish journals to it");
            }
            communityId = community.getId();
            communityName = community.getName();
            publishedAt = Instant.now();
        } else if (visibility == com.notesphere.entity.enums.JournalVisibility.PUBLIC) {
            publishedAt = Instant.now();
            communityId = null;
            communityName = null;
        } else {
            visibility = com.notesphere.entity.enums.JournalVisibility.PRIVATE;
            communityId = null;
            communityName = null;
            publishedAt = null;
        }

        JournalEntry entry = JournalEntry.builder()
                .userId(userId)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .tags(combinedTags)
                .category(category)
                .favorite(favorite)
                .pinned(pinned)
                .visibility(visibility)
                .communityId(communityId)
                .communityName(communityName)
                .publishedAt(publishedAt)
                .sentimentLabel(sentiment.getLabel())
                .compoundScore(sentiment.getCompound())
                .positiveScore(sentiment.getPositive())
                .negativeScore(sentiment.getNegative())
                .neutralScore(sentiment.getNeutral())
                .build();

        JournalEntry savedEntry = journalRepository.save(entry);
        log.info("Journal entry {} created for user: {} with visibility: {}", savedEntry.getId(), userId, visibility);
        return mapToResponse(savedEntry, userId);
    }

    @Transactional
    public JournalResponse getJournalById(String userId, String id) {
        JournalEntry entry = journalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", "id", id));

        // If author, allow access (author's own views are excluded from view counts)
        if (entry.getUserId().equals(userId)) {
            return mapToResponse(entry, userId);
        }

        // If PUBLIC, allow access to all authenticated users & track view
        if (entry.getVisibility() == com.notesphere.entity.enums.JournalVisibility.PUBLIC) {
            recordView(userId, id);
            JournalEntry refreshed = journalRepository.findById(id).orElse(entry);
            return mapToResponse(refreshed, userId);
        }

        // If published to a community, verify user is a member of that community & track view
        if (entry.getVisibility() == com.notesphere.entity.enums.JournalVisibility.COMMUNITY && entry.getCommunityId() != null) {
            if (communityMemberRepository.existsByCommunityIdAndUserId(entry.getCommunityId(), userId)) {
                recordView(userId, id);
                JournalEntry refreshed = journalRepository.findById(id).orElse(entry);
                return mapToResponse(refreshed, userId);
            }
        }

        throw new org.springframework.security.access.AccessDeniedException("You do not have permission to access this journal entry");
    }

    @Transactional
    public long recordView(String viewerId, String journalId) {
        JournalEntry journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", "id", journalId));

        // 1. Never count access to drafts or private content as a public view
        if (journal.getVisibility() == com.notesphere.entity.enums.JournalVisibility.PRIVATE || journal.getPublishedAt() == null) {
            return journal.getViewCount();
        }

        // 2. Author's own views are excluded on backend
        if (journal.getUserId().equals(viewerId)) {
            return journal.getViewCount();
        }

        // 3. Respect community authorization rules
        if (journal.getVisibility() == com.notesphere.entity.enums.JournalVisibility.COMMUNITY && journal.getCommunityId() != null) {
            boolean isMember = communityMemberRepository.existsByCommunityIdAndUserId(journal.getCommunityId(), viewerId);
            if (!isMember) {
                throw new org.springframework.security.access.AccessDeniedException("You do not have permission to access this community journal");
            }
        }

        // 4. Concurrency-safe deduplication with 24-hour window per unique viewer
        Instant now = Instant.now();
        java.util.Optional<com.notesphere.entity.JournalView> existingView = journalViewRepository.findByJournalIdAndViewerId(journalId, viewerId);

        if (existingView.isPresent()) {
            com.notesphere.entity.JournalView viewRecord = existingView.get();
            if (viewRecord.getLastViewedAt() != null &&
                    java.time.Duration.between(viewRecord.getLastViewedAt(), now).toHours() < 24) {
                // Already viewed within 24-hour window: prevent extra increment from re-renders or duplicate requests
                return journal.getViewCount();
            }
            viewRecord.setLastViewedAt(now);
            journalViewRepository.save(viewRecord);
        } else {
            try {
                com.notesphere.entity.JournalView newView = com.notesphere.entity.JournalView.builder()
                        .journalId(journalId)
                        .viewerId(viewerId)
                        .lastViewedAt(now)
                        .createdAt(now)
                        .build();
                journalViewRepository.save(newView);
            } catch (org.springframework.dao.DataIntegrityViolationException ex) {
                // Handled gracefully if another concurrent thread already registered this view
                return journal.getViewCount();
            }
        }

        // 5. Atomic database-side increment in MySQL
        journalRepository.incrementViewCount(journalId);
        journal.setViewCount(journal.getViewCount() + 1);

        log.info("Recorded view on journal {} by user {}. Updated view count: {}", journalId, viewerId, journal.getViewCount());
        return journal.getViewCount();
    }

    @Transactional(readOnly = true)
    public PagedResponse<JournalResponse> getUserJournals(String userId, Pageable pageable) {
        Page<JournalEntry> page = journalRepository.findByUserId(userId, pageable);
        return mapToPagedResponse(page, userId);
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
        return getFilteredJournals(userId, query, sentiment, category, tag, favorite, pinned, null, startDate, endDate, pageable);
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
            com.notesphere.entity.enums.JournalVisibility visibility,
            Instant startDate,
            Instant endDate,
            Pageable pageable) {

        Specification<JournalEntry> spec = JournalSpecification.filter(
                userId, query, sentiment, category, tag, favorite, pinned, visibility, startDate, endDate);

        Page<JournalEntry> page = journalRepository.findAll(spec, pageable);
        return mapToPagedResponse(page, userId);
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

        if (request.getVisibility() != null) {
            if (request.getVisibility() == com.notesphere.entity.enums.JournalVisibility.COMMUNITY) {
                String targetCommId = (request.getCommunityId() != null && !request.getCommunityId().isBlank())
                        ? request.getCommunityId()
                        : entry.getCommunityId();
                if (targetCommId == null || targetCommId.isBlank()) {
                    throw new com.notesphere.exception.BadRequestException("Community ID is required when publishing a journal to a community");
                }
                com.notesphere.entity.Community community = communityRepository.findById(targetCommId)
                        .orElseThrow(() -> new ResourceNotFoundException("Community", "id", targetCommId));
                if (!communityMemberRepository.existsByCommunityIdAndUserId(community.getId(), userId)) {
                    throw new org.springframework.security.access.AccessDeniedException("You must be a member of " + community.getName() + " to publish journals to it");
                }
                entry.setVisibility(com.notesphere.entity.enums.JournalVisibility.COMMUNITY);
                entry.setCommunityId(community.getId());
                entry.setCommunityName(community.getName());
                if (entry.getPublishedAt() == null) {
                    entry.setPublishedAt(Instant.now());
                }
            } else if (request.getVisibility() == com.notesphere.entity.enums.JournalVisibility.PUBLIC) {
                entry.setVisibility(com.notesphere.entity.enums.JournalVisibility.PUBLIC);
                entry.setCommunityId(null);
                entry.setCommunityName(null);
                if (entry.getPublishedAt() == null) {
                    entry.setPublishedAt(Instant.now());
                }
            } else if (request.getVisibility() == com.notesphere.entity.enums.JournalVisibility.PRIVATE) {
                entry.setVisibility(com.notesphere.entity.enums.JournalVisibility.PRIVATE);
                entry.setCommunityId(null);
                entry.setCommunityName(null);
                entry.setPublishedAt(null);
            }
        }

        JournalEntry updatedEntry = journalRepository.save(entry);
        log.info("Journal entry {} updated by user: {}", id, userId);
        return mapToResponse(updatedEntry, userId);
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
            throw new org.springframework.security.access.AccessDeniedException("You do not have permission to access this journal entry");
        }
        return entry;
    }

    @Transactional
    public JournalResponse publishJournal(String userId, String id, com.notesphere.dto.request.PublishJournalRequest request) {
        JournalEntry entry = findEntryAndVerifyOwnership(userId, id);

        com.notesphere.entity.enums.JournalVisibility targetVisibility = request.getVisibility() != null
                ? request.getVisibility()
                : (request.getCommunityId() != null && !request.getCommunityId().isBlank()
                        ? com.notesphere.entity.enums.JournalVisibility.COMMUNITY
                        : com.notesphere.entity.enums.JournalVisibility.PUBLIC);

        if (targetVisibility == com.notesphere.entity.enums.JournalVisibility.PUBLIC) {
            entry.setVisibility(com.notesphere.entity.enums.JournalVisibility.PUBLIC);
            entry.setCommunityId(null);
            entry.setCommunityName(null);
            entry.setPublishedAt(Instant.now());
            JournalEntry saved = journalRepository.save(entry);
            log.info("Journal entry {} published to public feed by user {}", id, userId);
            return mapToResponse(saved, userId);
        }

        if (request.getCommunityId() == null || request.getCommunityId().isBlank()) {
            throw new com.notesphere.exception.BadRequestException("Community ID is required for publishing to a community");
        }

        com.notesphere.entity.Community community = communityRepository.findById(request.getCommunityId())
                .orElseThrow(() -> new ResourceNotFoundException("Community", "id", request.getCommunityId()));

        if (!communityMemberRepository.existsByCommunityIdAndUserId(community.getId(), userId)) {
            throw new org.springframework.security.access.AccessDeniedException("You must be a member of " + community.getName() + " to publish journals to it");
        }

        entry.setVisibility(com.notesphere.entity.enums.JournalVisibility.COMMUNITY);
        entry.setCommunityId(community.getId());
        entry.setCommunityName(community.getName());
        entry.setPublishedAt(Instant.now());

        JournalEntry saved = journalRepository.save(entry);
        log.info("Journal entry {} published to community {} by user {}", id, community.getName(), userId);
        return mapToResponse(saved, userId);
    }

    @Transactional
    public JournalResponse unpublishJournal(String userId, String id) {
        JournalEntry entry = findEntryAndVerifyOwnership(userId, id);
        entry.setVisibility(com.notesphere.entity.enums.JournalVisibility.PRIVATE);
        entry.setCommunityId(null);
        entry.setCommunityName(null);
        entry.setPublishedAt(null);

        JournalEntry saved = journalRepository.save(entry);
        log.info("Journal entry {} unpublished to private by user {}", id, userId);
        return mapToResponse(saved, userId);
    }

    @Transactional(readOnly = true)
    public PagedResponse<JournalResponse> getPublicJournals(
            String currentUserId,
            String query,
            String category,
            String tag,
            Pageable pageable) {
        Specification<JournalEntry> spec = JournalSpecification.publicFeed(query, category, tag);
        Page<JournalEntry> page = journalRepository.findAll(spec, pageable);
        return mapToPagedResponse(page, currentUserId);
    }

    @Transactional(readOnly = true)
    public PagedResponse<JournalResponse> getUserPublishedJournals(String authorId, String viewerId, Pageable pageable) {
        Page<JournalEntry> page = journalRepository.findPublishedByUserId(authorId, pageable);
        return mapToPagedResponse(page, viewerId);
    }

    @Transactional(readOnly = true)
    public PagedResponse<JournalResponse> getUserPublishedJournals(String authorId, Pageable pageable) {
        return getUserPublishedJournals(authorId, authorId, pageable);
    }

    public JournalResponse mapToResponse(JournalEntry entry) {
        return mapToResponse(entry, null);
    }

    public JournalResponse mapToResponse(JournalEntry entry, String currentUserId) {
        String authorName = null;
        if (userRepository != null && entry.getUserId() != null) {
            authorName = userRepository.findById(entry.getUserId())
                    .map(com.notesphere.entity.User::getUsername)
                    .orElse(null);
        }

        boolean liked = false;
        if (postReactionRepository != null && currentUserId != null) {
            liked = postReactionRepository.existsByJournalIdAndUserId(entry.getId(), currentUserId);
        }

        return JournalResponse.builder()
                .id(entry.getId())
                .title(entry.getTitle())
                .content(entry.getContent())
                .tags(entry.getTags())
                .category(entry.getCategory())
                .favorite(entry.isFavorite())
                .pinned(entry.isPinned())
                .visibility(entry.getVisibility())
                .communityId(entry.getCommunityId())
                .communityName(entry.getCommunityName())
                .publishedAt(entry.getPublishedAt())
                .likeCount(entry.getLikeCount())
                .commentCount(entry.getCommentCount())
                .viewCount(entry.getViewCount())
                .likedByCurrentUser(liked)
                .authorId(entry.getUserId())
                .authorName(authorName)
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
        return mapToPagedResponse(page, null);
    }

    public PagedResponse<JournalResponse> mapToPagedResponse(Page<JournalEntry> page, String currentUserId) {
        List<JournalResponse> content = page.getContent().stream()
                .map(entry -> mapToResponse(entry, currentUserId))
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
