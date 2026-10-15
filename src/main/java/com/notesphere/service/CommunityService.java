package com.notesphere.service;

import com.notesphere.dto.request.CommentRequest;
import com.notesphere.dto.request.CommunityRequest;
import com.notesphere.dto.request.ReportRequest;
import com.notesphere.dto.response.CommentResponse;
import com.notesphere.dto.response.CommunityResponse;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.entity.*;
import com.notesphere.entity.enums.CommunityRole;
import com.notesphere.entity.enums.JournalVisibility;
import com.notesphere.exception.BadRequestException;
import com.notesphere.exception.DuplicateResourceException;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service managing communities, membership, feeds, comments, reactions, and moderation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityRepository communityRepository;
    private final CommunityMemberRepository memberRepository;
    private final JournalEntryRepository journalRepository;
    private final PostCommentRepository commentRepository;
    private final PostReactionRepository reactionRepository;
    private final PostReportRepository reportRepository;
    private final UserRepository userRepository;

    @PostConstruct
    @Transactional
    public void initDefaultCommunities() {
        if (communityRepository.count() == 0) {
            List<Community> defaults = List.of(
                    Community.builder().name("Mindful Living").description("A sanctuary for daily mindfulness, peace, and meditation reflections.").icon("Leaf").category("Mindfulness").creatorId("system").memberCount(1).build(),
                    Community.builder().name("Tech & Engineering").description("Sharing project breakthroughs, coding reflections, and system design journals.").icon("Laptop").category("Work & Projects").creatorId("system").memberCount(1).build(),
                    Community.builder().name("Creative Writers").description("Daily prompts, poetry, personal reflections, and storytelling.").icon("PenTool").category("Reflections").creatorId("system").memberCount(1).build(),
                    Community.builder().name("Fitness & Wellbeing").description("Documenting workouts, nutrition, health, and holistic vitality.").icon("Activity").category("Fitness").creatorId("system").memberCount(1).build()
            );
            communityRepository.saveAll(defaults);
            log.info("Initialized {} default communities", defaults.size());
        }
    }

    @Transactional(readOnly = true)
    public PagedResponse<CommunityResponse> getCommunities(String userId, String query, String category, Pageable pageable) {
        Page<Community> page = communityRepository.searchCommunities(
                (query != null && !query.isBlank()) ? query.trim() : null,
                (category != null && !category.isBlank() && !"ALL".equalsIgnoreCase(category)) ? category.trim() : null,
                pageable
        );

        List<CommunityResponse> content = page.getContent().stream()
                .map(c -> mapToResponse(c, userId))
                .collect(Collectors.toList());

        return PagedResponse.<CommunityResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CommunityResponse> getJoinedCommunities(String userId) {
        List<CommunityMember> memberships = memberRepository.findByUserId(userId);
        if (memberships.isEmpty()) {
            return List.of();
        }

        List<String> communityIds = memberships.stream().map(CommunityMember::getCommunityId).toList();
        return communityRepository.findAllById(communityIds).stream()
                .map(c -> mapToResponse(c, userId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CommunityResponse getCommunityById(String userId, String communityId) {
        Community community = findCommunityById(communityId);
        return mapToResponse(community, userId);
    }

    @Transactional
    public CommunityResponse createCommunity(String userId, CommunityRequest request) {
        String trimmedName = request.getName().trim();
        if (communityRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new DuplicateResourceException("Community", "name", trimmedName);
        }

        Community community = Community.builder()
                .name(trimmedName)
                .description(request.getDescription())
                .icon(request.getIcon() != null ? request.getIcon().trim() : "Users")
                .category(request.getCategory() != null ? request.getCategory().trim() : "General")
                .creatorId(userId)
                .memberCount(1)
                .build();

        Community saved = communityRepository.save(community);

        CommunityMember creatorMember = CommunityMember.builder()
                .communityId(saved.getId())
                .userId(userId)
                .role(CommunityRole.ADMIN)
                .build();
        memberRepository.save(creatorMember);

        log.info("Community {} created by user {}", saved.getName(), userId);
        return mapToResponse(saved, userId);
    }

    @Transactional
    public void joinCommunity(String userId, String communityId) {
        Community community = findCommunityById(communityId);

        if (memberRepository.existsByCommunityIdAndUserId(communityId, userId)) {
            return; // Already a member
        }

        CommunityMember member = CommunityMember.builder()
                .communityId(communityId)
                .userId(userId)
                .role(CommunityRole.MEMBER)
                .build();
        memberRepository.save(member);

        community.setMemberCount((int) memberRepository.countByCommunityId(communityId));
        communityRepository.save(community);
        log.info("User {} joined community {}", userId, community.getName());
    }

    @Transactional
    public void leaveCommunity(String userId, String communityId) {
        Community community = findCommunityById(communityId);

        memberRepository.deleteByCommunityIdAndUserId(communityId, userId);
        community.setMemberCount((int) memberRepository.countByCommunityId(communityId));
        communityRepository.save(community);
        log.info("User {} left community {}", userId, community.getName());
    }

    @Transactional(readOnly = true)
    public PagedResponse<JournalResponse> getCommunityFeed(String userId, String communityId, Pageable pageable) {
        Community community = findCommunityById(communityId);

        // Authorization: Verify user is a member of this community to access feed
        if (!memberRepository.existsByCommunityIdAndUserId(communityId, userId)) {
            throw new AccessDeniedException("You must be a member of " + community.getName() + " to view its feed.");
        }

        Page<JournalEntry> page = journalRepository.findByCommunityIdAndVisibility(
                communityId, JournalVisibility.COMMUNITY, pageable);

        List<JournalResponse> content = page.getContent().stream()
                .map(entry -> mapToFeedJournalResponse(entry, userId))
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

    @Transactional
    public CommentResponse addComment(String userId, String journalId, CommentRequest request) {
        JournalEntry journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", "id", journalId));

        if (journal.getVisibility() == JournalVisibility.PRIVATE) {
            throw new BadRequestException("Comments cannot be added to private journals.");
        }

        if (journal.getVisibility() == JournalVisibility.COMMUNITY) {
            if (journal.getCommunityId() == null || !memberRepository.existsByCommunityIdAndUserId(journal.getCommunityId(), userId)) {
                throw new AccessDeniedException("You must be a member of the community to comment.");
            }
        }

        PostComment comment = PostComment.builder()
                .journalId(journalId)
                .userId(userId)
                .content(request.getContent().trim())
                .build();

        PostComment saved = commentRepository.save(comment);

        journal.setCommentCount(commentRepository.countByJournalId(journalId));
        journalRepository.save(journal);

        var userOpt = userRepository.findById(userId);
        String authorName = userOpt.map(u -> (u.getFullName() != null && !u.getFullName().isBlank()) ? u.getFullName() : u.getUsername()).orElse("Member");
        String authorAvatarUrl = userOpt.map(User::getAvatarUrl).orElse(null);

        return CommentResponse.builder()
                .id(saved.getId())
                .journalId(journalId)
                .userId(userId)
                .authorName(authorName)
                .authorAvatarUrl(authorAvatarUrl)
                .content(saved.getContent())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(String userId, String journalId) {
        JournalEntry journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", "id", journalId));

        if (journal.getVisibility() == JournalVisibility.PRIVATE) {
            throw new BadRequestException("Comments are not accessible on private journals.");
        }

        if (journal.getVisibility() == JournalVisibility.COMMUNITY) {
            if (journal.getCommunityId() == null || !memberRepository.existsByCommunityIdAndUserId(journal.getCommunityId(), userId)) {
                throw new AccessDeniedException("You must be a member of the community to read comments.");
            }
        }

        List<PostComment> comments = commentRepository.findByJournalIdOrderByCreatedAtAsc(journalId);
        Map<String, User> userMap = userRepository.findAllById(
                comments.stream().map(PostComment::getUserId).distinct().toList()
        ).stream().collect(Collectors.toMap(User::getId, u -> u));

        return comments.stream()
                .map(c -> {
                    User commenter = userMap.get(c.getUserId());
                    String aName = commenter != null ? (commenter.getFullName() != null && !commenter.getFullName().isBlank() ? commenter.getFullName() : commenter.getUsername()) : "Member";
                    String aAvatar = commenter != null ? commenter.getAvatarUrl() : null;
                    return CommentResponse.builder()
                            .id(c.getId())
                            .journalId(c.getJournalId())
                            .userId(c.getUserId())
                            .authorName(aName)
                            .authorAvatarUrl(aAvatar)
                            .content(c.getContent())
                            .createdAt(c.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> toggleReaction(String userId, String journalId) {
        JournalEntry journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", "id", journalId));

        if (journal.getVisibility() == JournalVisibility.PRIVATE) {
            throw new BadRequestException("Reactions are not allowed on private journals.");
        }

        if (journal.getVisibility() == JournalVisibility.COMMUNITY) {
            if (journal.getCommunityId() == null || !memberRepository.existsByCommunityIdAndUserId(journal.getCommunityId(), userId)) {
                throw new AccessDeniedException("You must be a member of the community to react.");
            }
        }

        Optional<PostReaction> existing = reactionRepository.findByJournalIdAndUserId(journalId, userId);
        boolean liked;
        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
            liked = false;
        } else {
            PostReaction reaction = PostReaction.builder()
                    .journalId(journalId)
                    .userId(userId)
                    .reactionType("LIKE")
                    .build();
            reactionRepository.save(reaction);
            liked = true;
        }

        int count = reactionRepository.countByJournalId(journalId);
        journal.setLikeCount(count);
        journalRepository.save(journal);

        return Map.of("liked", liked, "likeCount", count);
    }

    @Transactional
    public void reportPost(String userId, String journalId, ReportRequest request) {
        JournalEntry journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", "id", journalId));

        if (journal.getVisibility() == JournalVisibility.PRIVATE) {
            throw new BadRequestException("Private journals cannot be reported.");
        }

        if (reportRepository.existsByJournalIdAndReporterId(journalId, userId)) {
            return; // Already reported
        }

        PostReport report = PostReport.builder()
                .journalId(journalId)
                .reporterId(userId)
                .reason(request.getReason().trim())
                .status("PENDING")
                .build();
        reportRepository.save(report);
        log.info("Post {} reported by user {}", journalId, userId);
    }

    @Transactional
    public void moderatePost(String userId, String journalId, String action) {
        JournalEntry journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", "id", journalId));

        CommunityMember member = memberRepository.findByCommunityIdAndUserId(journal.getCommunityId(), userId)
                .orElseThrow(() -> new AccessDeniedException("Not a member of this community"));

        boolean isAuthorized = member.getRole() == CommunityRole.ADMIN ||
                member.getRole() == CommunityRole.MODERATOR ||
                journal.getUserId().equals(userId);

        if (!isAuthorized) {
            throw new AccessDeniedException("You do not have moderator or author privileges to remove this post");
        }

        if ("REVERT_PRIVATE".equalsIgnoreCase(action) || "REMOVE".equalsIgnoreCase(action)) {
            journal.setVisibility(JournalVisibility.PRIVATE);
            journal.setCommunityId(null);
            journal.setCommunityName(null);
            journal.setPublishedAt(null);
            journalRepository.save(journal);
            log.info("Journal {} reverted to private by moderator/author {}", journalId, userId);
        }
    }

    public Community findCommunityById(String id) {
        return communityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Community", "id", id));
    }

    private CommunityResponse mapToResponse(Community community, String userId) {
        Optional<CommunityMember> member = memberRepository.findByCommunityIdAndUserId(community.getId(), userId);
        return CommunityResponse.builder()
                .id(community.getId())
                .name(community.getName())
                .description(community.getDescription())
                .icon(community.getIcon())
                .category(community.getCategory())
                .creatorId(community.getCreatorId())
                .memberCount(community.getMemberCount())
                .member(member.isPresent())
                .userRole(member.map(m -> m.getRole().name()).orElse(null))
                .createdAt(community.getCreatedAt())
                .build();
    }

    private JournalResponse mapToFeedJournalResponse(JournalEntry entry, String userId) {
        String authorName = userRepository.findById(entry.getUserId()).map(User::getUsername).orElse("Anonymous");
        boolean liked = reactionRepository.existsByJournalIdAndUserId(entry.getId(), userId);

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
}
