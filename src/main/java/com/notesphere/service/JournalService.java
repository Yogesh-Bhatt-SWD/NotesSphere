package com.notesphere.service;

import com.notesphere.dto.request.JournalRequest;
import com.notesphere.dto.response.BlogPreviewResponse;
import com.notesphere.dto.response.JournalInsightsResponse;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.dto.response.SentimentResponse;
import com.notesphere.dto.response.TagCountResponse;
import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.User;
import com.notesphere.entity.enums.SentimentLabel;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.exception.UnauthorizedException;
import com.notesphere.repository.JournalEntryRepository;
import com.notesphere.repository.JournalSpecification;
import com.notesphere.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
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
    private final NotificationService notificationService;


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

        String slug = SlugUtils.toSlug(request.getTitle(), java.util.UUID.randomUUID().toString());

        JournalEntry entry = JournalEntry.builder()
                .userId(userId)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .slug(slug)
                .coverImageUrl(request.getCoverImageUrl() != null && !request.getCoverImageUrl().isBlank() ? request.getCoverImageUrl().trim() : null)
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
                .wordCount(SlugUtils.countWords(request.getContent()))
                .build();

        JournalEntry savedEntry = journalRepository.save(entry);
        log.info("Journal entry {} created for user: {} with visibility: {}", savedEntry.getId(), userId, visibility);

        if (savedEntry.getVisibility() == com.notesphere.entity.enums.JournalVisibility.PUBLIC
                || savedEntry.getVisibility() == com.notesphere.entity.enums.JournalVisibility.COMMUNITY) {
            userRepository.findById(userId).ifPresent(author ->
                    notificationService.notifyJournalPublished(savedEntry, author));
        }

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
            entry.setWordCount(SlugUtils.countWords(request.getContent()));
        } else if (entry.getWordCount() <= 0 && request.getContent() != null) {
            entry.setWordCount(SlugUtils.countWords(request.getContent()));
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

        if (request.getCoverImageUrl() != null) {
            entry.setCoverImageUrl(request.getCoverImageUrl().isBlank() ? null : request.getCoverImageUrl().trim());
        }
        if (entry.getSlug() == null || entry.getSlug().isBlank()) {
            entry.setSlug(SlugUtils.toSlug(entry.getTitle(), entry.getId()));
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

        if (updatedEntry.getVisibility() == com.notesphere.entity.enums.JournalVisibility.PUBLIC
                || updatedEntry.getVisibility() == com.notesphere.entity.enums.JournalVisibility.COMMUNITY) {
            userRepository.findById(userId).ifPresent(author ->
                    notificationService.notifyJournalPublished(updatedEntry, author));
        }

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
    public List<TagCountResponse> getUserTagsWithCounts(String userId) {
        List<JournalEntry> entries = journalRepository.findTagsByUserId(userId);
        Map<String, Long> countMap = new LinkedHashMap<>();
        for (JournalEntry entry : entries) {
            if (entry.getTags() != null) {
                for (String tag : entry.getTags()) {
                    if (tag != null && !tag.isBlank()) {
                        String normalized = tag.trim().toLowerCase();
                        countMap.put(normalized, countMap.getOrDefault(normalized, 0L) + 1);
                    }
                }
            }
        }
        return countMap.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .map(e -> TagCountResponse.builder()
                        .name(e.getKey())
                        .count(e.getValue())
                        .build())
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
    public JournalResponse uploadCoverImage(String userId, String id, org.springframework.web.multipart.MultipartFile file, String dataUrl) {
        JournalEntry entry = findEntryAndVerifyOwnership(userId, id);

        if (file != null && !file.isEmpty()) {
            if (file.getSize() > 5 * 1024 * 1024) {
                throw new com.notesphere.exception.BadRequestException("Cover image file must be under 5MB");
            }
            String ct = file.getContentType();
            if (ct != null && !ct.startsWith("image/")) {
                throw new com.notesphere.exception.BadRequestException("Uploaded file must be a valid image");
            }
            try {
                byte[] bytes = file.getBytes();
                String contentType = ct != null ? ct : "image/jpeg";
                String base64 = "data:" + contentType + ";base64," + java.util.Base64.getEncoder().encodeToString(bytes);
                entry.setCoverImageUrl(base64);
            } catch (java.io.IOException e) {
                log.error("Failed to read cover image bytes for journal {}", id, e);
                throw new com.notesphere.exception.BadRequestException("Failed to process cover image file");
            }
        } else if (org.springframework.util.StringUtils.hasText(dataUrl)) {
            entry.setCoverImageUrl(dataUrl.trim());
        } else {
            throw new com.notesphere.exception.BadRequestException("No cover image file or URL provided");
        }

        JournalEntry saved = journalRepository.save(entry);
        log.info("Cover image updated for journal entry: {} by user: {}", id, userId);
        return mapToResponse(saved, userId);
    }

    @Transactional
    public JournalResponse deleteCoverImage(String userId, String id) {
        JournalEntry entry = findEntryAndVerifyOwnership(userId, id);
        entry.setCoverImageUrl(null);
        JournalEntry saved = journalRepository.save(entry);
        log.info("Cover image removed for journal entry: {} by user: {}", id, userId);
        return mapToResponse(saved, userId);
    }

    @Transactional
    public JournalResponse publishJournal(String userId, String id, com.notesphere.dto.request.PublishJournalRequest request) {
        JournalEntry entry = findEntryAndVerifyOwnership(userId, id);

        com.notesphere.entity.enums.JournalVisibility targetVisibility = request.getVisibility() != null
                ? request.getVisibility()
                : (request.getCommunityId() != null && !request.getCommunityId().isBlank()
                        ? com.notesphere.entity.enums.JournalVisibility.COMMUNITY
                        : com.notesphere.entity.enums.JournalVisibility.PUBLIC);

        if (entry.getSlug() == null || entry.getSlug().isBlank()) {
            entry.setSlug(SlugUtils.toSlug(entry.getTitle(), entry.getId()));
        }
        if (request.getCoverImageUrl() != null && !request.getCoverImageUrl().isBlank()) {
            entry.setCoverImageUrl(request.getCoverImageUrl().trim());
        }

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
        String authorAvatarUrl = null;
        if (userRepository != null && entry.getUserId() != null) {
            var userOpt = userRepository.findById(entry.getUserId());
            if (userOpt.isPresent()) {
                var u = userOpt.get();
                authorName = (u.getFullName() != null && !u.getFullName().isBlank()) ? u.getFullName() : u.getUsername();
                authorAvatarUrl = u.getAvatarUrl();
            }
        }

        boolean liked = false;
        if (postReactionRepository != null && currentUserId != null) {
            liked = postReactionRepository.existsByJournalIdAndUserId(entry.getId(), currentUserId);
        }

        int readingTime = SlugUtils.estimateReadingTime(entry.getContent());

        return JournalResponse.builder()
                .id(entry.getId())
                .slug(entry.getSlug())
                .title(entry.getTitle())
                .content(entry.getContent())
                .coverImageUrl(entry.getCoverImageUrl())
                .readingTimeMinutes(readingTime)
                .wordCount(entry.getWordCount() > 0 ? entry.getWordCount() : SlugUtils.countWords(entry.getContent()))
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
                .authorAvatarUrl(authorAvatarUrl)
                .sentimentLabel(entry.getSentimentLabel())
                .compoundScore(entry.getCompoundScore())
                .positiveScore(entry.getPositiveScore())
                .negativeScore(entry.getNegativeScore())
                .neutralScore(entry.getNeutralScore())
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public BlogPreviewResponse getPublicBlogPreview(String identifier) {
        JournalEntry entry = journalRepository.findBySlugOrId(identifier)
                .orElseThrow(() -> new ResourceNotFoundException("Blog", "identifier", identifier));

        if (entry.getPublishedAt() == null || entry.getVisibility() == com.notesphere.entity.enums.JournalVisibility.PRIVATE) {
            throw new ResourceNotFoundException("Blog", "identifier", identifier);
        }

        String authorName = null;
        String authorAvatarUrl = null;
        if (userRepository != null && entry.getUserId() != null) {
            var userOpt = userRepository.findById(entry.getUserId());
            if (userOpt.isPresent()) {
                var u = userOpt.get();
                authorName = (u.getFullName() != null && !u.getFullName().isBlank()) ? u.getFullName() : u.getUsername();
                authorAvatarUrl = u.getAvatarUrl();
            }
        }

        String excerpt = SlugUtils.extractExcerpt(entry.getContent(), 260);
        int readingTime = SlugUtils.estimateReadingTime(entry.getContent());
        String publicContent = (entry.getVisibility() == com.notesphere.entity.enums.JournalVisibility.PUBLIC)
                ? entry.getContent()
                : null;

        return BlogPreviewResponse.builder()
                .id(entry.getId())
                .slug(entry.getSlug())
                .title(entry.getTitle())
                .excerpt(excerpt)
                .content(publicContent)
                .coverImageUrl(entry.getCoverImageUrl())
                .category(entry.getCategory())
                .tags(entry.getTags())
                .publishedAt(entry.getPublishedAt())
                .readingTimeMinutes(readingTime)
                .viewCount(entry.getViewCount())
                .likeCount(entry.getLikeCount())
                .authorName(authorName)
                .authorAvatarUrl(authorAvatarUrl)
                .communityPost(entry.getVisibility() == com.notesphere.entity.enums.JournalVisibility.COMMUNITY)
                .communityName(entry.getCommunityName())
                .build();
    }

    @Transactional
    public JournalResponse getFullBlog(String currentUserId, String identifier) {
        if (currentUserId == null || currentUserId.isBlank()) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("Authentication required to access full article");
        }

        JournalEntry entry = journalRepository.findBySlugOrId(identifier)
                .orElseThrow(() -> new ResourceNotFoundException("Blog", "identifier", identifier));

        // Author can always access their own journal
        if (entry.getUserId().equals(currentUserId)) {
            return mapToResponse(entry, currentUserId);
        }

        // Draft or Private content: never expose to non-author
        if (entry.getPublishedAt() == null || entry.getVisibility() == com.notesphere.entity.enums.JournalVisibility.PRIVATE) {
            throw new ResourceNotFoundException("Blog", "identifier", identifier);
        }

        // If PUBLIC: allow access and record view
        if (entry.getVisibility() == com.notesphere.entity.enums.JournalVisibility.PUBLIC) {
            recordView(currentUserId, entry.getId());
            JournalEntry refreshed = journalRepository.findById(entry.getId()).orElse(entry);
            return mapToResponse(refreshed, currentUserId);
        }

        // If COMMUNITY: verify community membership
        if (entry.getVisibility() == com.notesphere.entity.enums.JournalVisibility.COMMUNITY && entry.getCommunityId() != null) {
            if (communityMemberRepository.existsByCommunityIdAndUserId(entry.getCommunityId(), currentUserId)) {
                recordView(currentUserId, entry.getId());
                JournalEntry refreshed = journalRepository.findById(entry.getId()).orElse(entry);
                return mapToResponse(refreshed, currentUserId);
            }
            throw new org.springframework.security.access.AccessDeniedException("You must be a member of " + entry.getCommunityName() + " to read this article");
        }

        throw new org.springframework.security.access.AccessDeniedException("You do not have permission to access this blog");
    }

    @Transactional(readOnly = true)
    public String getBlogOgMetadata(String identifier, String baseUrl) {
        JournalEntry entry = journalRepository.findBySlugOrId(identifier)
                .orElse(null);

        if (entry == null || entry.getPublishedAt() == null || entry.getVisibility() == com.notesphere.entity.enums.JournalVisibility.PRIVATE) {
            return "<!DOCTYPE html><html><head><title>NoteSphere - Article Not Found</title></head><body><p>Article not found or private.</p></body></html>";
        }

        String authorName = "NoteSphere Author";
        if (userRepository != null && entry.getUserId() != null) {
            var u = userRepository.findById(entry.getUserId());
            if (u.isPresent()) {
                var user = u.get();
                authorName = (user.getFullName() != null && !user.getFullName().isBlank()) ? user.getFullName() : user.getUsername();
            }
        }

        String excerpt = SlugUtils.extractExcerpt(entry.getContent(), 200);
        String title = entry.getTitle() != null ? entry.getTitle().replace("\"", "&quot;") : "NoteSphere Article";
        String description = excerpt != null ? excerpt.replace("\"", "&quot;") : "Read this article on NoteSphere.";
        String slug = entry.getSlug() != null ? entry.getSlug() : entry.getId();
        String fullUrl = (baseUrl != null ? baseUrl : "https://notes-sphere-d2m4.vercel.app") + "/blogs/" + slug;
        String coverImage = entry.getCoverImageUrl() != null && !entry.getCoverImageUrl().isBlank()
                ? entry.getCoverImageUrl()
                : "https://notes-sphere-d2m4.vercel.app/og-image.png";

        return "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <title>" + title + " | NoteSphere</title>\n" +
                "    <meta name=\"description\" content=\"" + description + "\">\n" +
                "    <meta name=\"author\" content=\"" + authorName + "\">\n" +
                "    <!-- Open Graph -->\n" +
                "    <meta property=\"og:title\" content=\"" + title + "\">\n" +
                "    <meta property=\"og:description\" content=\"" + description + "\">\n" +
                "    <meta property=\"og:image\" content=\"" + coverImage + "\">\n" +
                "    <meta property=\"og:url\" content=\"" + fullUrl + "\">\n" +
                "    <meta property=\"og:type\" content=\"article\">\n" +
                "    <meta property=\"og:site_name\" content=\"NoteSphere\">\n" +
                "    <!-- Twitter Card -->\n" +
                "    <meta name=\"twitter:card\" content=\"summary_large_image\">\n" +
                "    <meta name=\"twitter:title\" content=\"" + title + "\">\n" +
                "    <meta name=\"twitter:description\" content=\"" + description + "\">\n" +
                "    <meta name=\"twitter:image\" content=\"" + coverImage + "\">\n" +
                "    <!-- Auto-redirect human users if opened directly in browser -->\n" +
                "    <meta http-equiv=\"refresh\" content=\"0;url=" + fullUrl + "\">\n" +
                "</head>\n" +
                "<body>\n" +
                "    <h1>" + title + "</h1>\n" +
                "    <p>" + description + "</p>\n" +
                "    <p>By " + authorName + "</p>\n" +
                "    <a href=\"" + fullUrl + "\">Read full article on NoteSphere</a>\n" +
                "</body>\n" +
                "</html>";
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

    /**
     * Calculates personal writing insights and statistics for the authenticated user.
     * Guaranteed to reflect real persisted user data (word count, streak, weekly progress).
     */
    @Transactional(readOnly = true)
    public JournalInsightsResponse getJournalInsights(String userId) {
        // 1. Daily & Weekly goal calculation from authenticated user's profile
        int dailyWordGoal = 500;
        if (userRepository != null) {
            dailyWordGoal = userRepository.findById(userId)
                    .map(User::getDailyWritingGoalWords)
                    .orElse(500);
        }
        int weeklyWordGoal = dailyWordGoal * 7;

        // 2. Fetch all entries for user
        long totalJournals = journalRepository.countByUserId(userId);
        List<JournalEntry> entries = journalRepository.findByUserIdOrderByCreatedAtAsc(userId);

        // 3. Word counts and activity dates
        long totalWordsWritten = 0L;
        long wordsWrittenThisWeek = 0L;
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        Instant startOfWeekInstant = startOfWeek.atStartOfDay(ZoneOffset.UTC).toInstant();

        Set<LocalDate> activityDates = new HashSet<>();
        Map<LocalDate, Long> wordsByDate = new HashMap<>();
        Map<LocalDate, Integer> entriesByDate = new HashMap<>();

        for (JournalEntry entry : entries) {
            int words = entry.getWordCount() > 0 ? entry.getWordCount() : SlugUtils.countWords(entry.getContent());
            totalWordsWritten += words;

            LocalDate createdDate = entry.getCreatedAt() != null
                    ? entry.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate()
                    : today;

            activityDates.add(createdDate);
            wordsByDate.put(createdDate, wordsByDate.getOrDefault(createdDate, 0L) + words);
            entriesByDate.put(createdDate, entriesByDate.getOrDefault(createdDate, 0) + 1);

            if (entry.getUpdatedAt() != null) {
                LocalDate updatedDate = entry.getUpdatedAt().atZone(ZoneOffset.UTC).toLocalDate();
                activityDates.add(updatedDate);
            }

            if (entry.getCreatedAt() != null && !entry.getCreatedAt().isBefore(startOfWeekInstant)) {
                wordsWrittenThisWeek += words;
            }
        }

        // 4. Streak Calculation:
        // Consecutive calendar days up to today, or up to yesterday if user hasn't written today yet.
        // If last activity was > 1 day ago, current streak is 0.
        boolean activeToday = activityDates.contains(today);
        LocalDate yesterday = today.minusDays(1);
        int currentStreak = 0;
        LocalDate cursor = null;

        if (activeToday) {
            cursor = today;
        } else if (activityDates.contains(yesterday)) {
            cursor = yesterday;
        }

        if (cursor != null) {
            while (activityDates.contains(cursor)) {
                currentStreak++;
                cursor = cursor.minusDays(1);
            }
        }

        // Longest Streak across all active dates
        List<LocalDate> sortedDates = activityDates.stream().sorted().toList();
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

        LocalDate lastWritingActivityDate = sortedDates.isEmpty() ? null : sortedDates.get(sortedDates.size() - 1);

        // 5. Weekly Goal Completion Percentage (0 to 100)
        int weeklyGoalCompletionPercent = weeklyWordGoal > 0
                ? (int) Math.min(100L, Math.round(((double) wordsWrittenThisWeek / weeklyWordGoal) * 100.0))
                : 0;

        // 6. Last 7 Days Activity (for chart)
        List<JournalInsightsResponse.DailyActivityDto> dailyActivities = new ArrayList<>();
        DateTimeFormatter dayLabelFormatter = DateTimeFormatter.ofPattern("EEE", Locale.ENGLISH);
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            dailyActivities.add(JournalInsightsResponse.DailyActivityDto.builder()
                    .date(d.toString())
                    .dayLabel(d.format(dayLabelFormatter))
                    .wordCount(wordsByDate.getOrDefault(d, 0L))
                    .journalCount(entriesByDate.getOrDefault(d, 0))
                    .build());
        }

        // 7. Recent activities (top 5 most recent)
        List<JournalInsightsResponse.RecentJournalActivityDto> recentActivities = entries.stream()
                .sorted(Comparator.comparing(JournalEntry::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .map(e -> JournalInsightsResponse.RecentJournalActivityDto.builder()
                        .id(e.getId())
                        .title(e.getTitle())
                        .category(e.getCategory())
                        .wordCount(e.getWordCount() > 0 ? e.getWordCount() : SlugUtils.countWords(e.getContent()))
                        .createdAt(e.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return JournalInsightsResponse.builder()
                .totalJournals(totalJournals)
                .currentStreakDays(currentStreak)
                .longestStreakDays(longestStreak)
                .totalWordsWritten(totalWordsWritten)
                .wordsWrittenThisWeek(wordsWrittenThisWeek)
                .dailyWordGoal(dailyWordGoal)
                .weeklyWordGoal(weeklyWordGoal)
                .weeklyGoalCompletionPercent(weeklyGoalCompletionPercent)
                .lastWritingActivityDate(lastWritingActivityDate)
                .activeToday(activeToday)
                .dailyActivities(dailyActivities)
                .recentActivities(recentActivities)
                .build();
    }
}
