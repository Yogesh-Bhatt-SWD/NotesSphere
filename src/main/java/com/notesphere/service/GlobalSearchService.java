package com.notesphere.service;

import com.notesphere.dto.response.search.*;
import com.notesphere.entity.Community;
import com.notesphere.entity.CommunityMember;
import com.notesphere.entity.FriendRequest;
import com.notesphere.entity.Friendship;
import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.User;
import com.notesphere.entity.enums.FriendshipStatus;
import com.notesphere.repository.CommunityMemberRepository;
import com.notesphere.repository.CommunityRepository;
import com.notesphere.repository.FriendRequestRepository;
import com.notesphere.repository.FriendshipRepository;
import com.notesphere.repository.JournalEntryRepository;
import com.notesphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service orchestrating Global Search across People, Published Blogs/Articles,
 * Communities, and Accessible Community Posts with relevance ranking and friend priority.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GlobalSearchService {

    private final UserRepository userRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final CommunityRepository communityRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final FriendshipRepository friendshipRepository;
    private final FriendRequestRepository friendRequestRepository;

    @Transactional(readOnly = true)
    public GlobalSearchResponse search(String rawQuery, String rawType, int page, int size, String currentUserId) {
        String q = (rawQuery != null) ? rawQuery.trim() : "";
        String type = (rawType != null && !rawType.isBlank()) ? rawType.trim().toUpperCase() : "ALL";
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 50));

        if (q.isEmpty()) {
            return GlobalSearchResponse.builder()
                    .query("")
                    .type(type)
                    .people(SearchGroupResponse.empty())
                    .blogs(SearchGroupResponse.empty())
                    .communities(SearchGroupResponse.empty())
                    .communityPosts(SearchGroupResponse.empty())
                    .totalResults(0)
                    .build();
        }

        // 1. Authenticated user friendship and community memberships
        Set<String> friendUserIds = Collections.emptySet();
        Set<String> joinedCommunityIds = Collections.emptySet();

        if (currentUserId != null && !currentUserId.isBlank()) {
            List<Friendship> friendships = friendshipRepository.findAllByUserId(currentUserId);
            friendUserIds = friendships.stream()
                    .map(f -> f.getUserAId().equals(currentUserId) ? f.getUserBId() : f.getUserAId())
                    .collect(Collectors.toSet());

            List<CommunityMember> memberships = communityMemberRepository.findByUserId(currentUserId);
            joinedCommunityIds = memberships.stream()
                    .map(CommunityMember::getCommunityId)
                    .collect(Collectors.toSet());
        }

        SearchGroupResponse<SearchPersonResult> peopleResponse = SearchGroupResponse.empty();
        SearchGroupResponse<SearchBlogResult> blogsResponse = SearchGroupResponse.empty();
        SearchGroupResponse<SearchCommunityResult> communitiesResponse = SearchGroupResponse.empty();
        SearchGroupResponse<SearchCommunityPostResult> communityPostsResponse = SearchGroupResponse.empty();

        // 2. Perform Category Searches
        if ("ALL".equals(type) || "PEOPLE".equals(type)) {
            peopleResponse = searchPeople(q, currentUserId, friendUserIds, safePage, safeSize);
        }

        if ("ALL".equals(type) || "BLOGS".equals(type)) {
            blogsResponse = searchBlogs(q, friendUserIds, safePage, safeSize);
        }

        if ("ALL".equals(type) || "COMMUNITIES".equals(type)) {
            communitiesResponse = searchCommunities(q, joinedCommunityIds, safePage, safeSize);
        }

        if ("ALL".equals(type) || "COMMUNITY_POSTS".equals(type)) {
            communityPostsResponse = searchCommunityPosts(q, friendUserIds, joinedCommunityIds, safePage, safeSize);
        }

        long totalResults = peopleResponse.getTotal()
                + blogsResponse.getTotal()
                + communitiesResponse.getTotal()
                + communityPostsResponse.getTotal();

        log.debug("Global search query='{}', type='{}', totalResults={}", q, type, totalResults);

        return GlobalSearchResponse.builder()
                .query(q)
                .type(type)
                .people(peopleResponse)
                .blogs(blogsResponse)
                .communities(communitiesResponse)
                .communityPosts(communityPostsResponse)
                .totalResults(totalResults)
                .build();
    }

    private SearchGroupResponse<SearchPersonResult> searchPeople(
            String q, String currentUserId, Set<String> friendUserIds, int page, int size) {
        Set<User> matchedUsersSet = new LinkedHashSet<>();
        if (currentUserId != null && !currentUserId.isBlank()) {
            matchedUsersSet.addAll(userRepository.searchUsers(q, currentUserId));
        } else {
            matchedUsersSet.addAll(userRepository.searchAllUsers(q));
        }

        String[] tokens = q.split("\\s+");
        if (tokens.length > 1) {
            for (String token : tokens) {
                if (token.length() >= 2) {
                    if (currentUserId != null && !currentUserId.isBlank()) {
                        matchedUsersSet.addAll(userRepository.searchUsers(token, currentUserId));
                    } else {
                        matchedUsersSet.addAll(userRepository.searchAllUsers(token));
                    }
                }
            }
        }

        List<User> matchedUsers = new ArrayList<>(matchedUsersSet);
        if (matchedUsers.isEmpty()) {
            return SearchGroupResponse.empty();
        }

        // Fetch pending requests for status resolution
        Map<String, FriendRequest> sentPendingMap = new HashMap<>();
        Map<String, FriendRequest> receivedPendingMap = new HashMap<>();

        if (currentUserId != null && !currentUserId.isBlank()) {
            List<String> targetIds = matchedUsers.stream().map(User::getId).collect(Collectors.toList());
            List<FriendRequest> pendingRequests = friendRequestRepository.findPendingForUserAndTargets(currentUserId, targetIds);
            for (FriendRequest fr : pendingRequests) {
                if (fr.getSenderId().equals(currentUserId)) {
                    sentPendingMap.put(fr.getReceiverId(), fr);
                } else if (fr.getReceiverId().equals(currentUserId)) {
                    receivedPendingMap.put(fr.getSenderId(), fr);
                }
            }
        }

        String lowerQ = q.toLowerCase();

        class ScoredUser {
            final User user;
            final int score;
            ScoredUser(User user, int score) {
                this.user = user;
                this.score = score;
            }
        }

        List<ScoredUser> scoredList = new ArrayList<>();
        for (User u : matchedUsers) {
            int score = 0;
            String username = u.getUsername() != null ? u.getUsername().toLowerCase() : "";
            String fullName = u.getFullName() != null ? u.getFullName().toLowerCase() : "";

            if (username.equals(lowerQ)) score += 100;
            else if (fullName.equals(lowerQ)) score += 90;
            else if (username.startsWith(lowerQ)) score += 80;
            else if (fullName.startsWith(lowerQ)) score += 70;
            else if (username.contains(lowerQ)) score += 50;
            else if (fullName.contains(lowerQ)) score += 40;

            if (tokens.length > 1) {
                int matchedTokenCount = 0;
                for (String token : tokens) {
                    String lowerToken = token.toLowerCase();
                    if (username.contains(lowerToken)) {
                        score += 25;
                        matchedTokenCount++;
                    } else if (fullName.contains(lowerToken)) {
                        score += 20;
                        matchedTokenCount++;
                    }
                }
                if (matchedTokenCount >= tokens.length) {
                    score += 40;
                }
            }

            if (friendUserIds.contains(u.getId())) {
                score += 200; // Prioritize existing friends in people search
            }

            scoredList.add(new ScoredUser(u, score));
        }

        // Sort: highest score first, then username alphabetically
        scoredList.sort((a, b) -> {
            int cmp = Integer.compare(b.score, a.score);
            if (cmp != 0) return cmp;
            String u1 = a.user.getUsername() != null ? a.user.getUsername() : "";
            String u2 = b.user.getUsername() != null ? b.user.getUsername() : "";
            return u1.compareToIgnoreCase(u2);
        });

        List<SearchPersonResult> items = new ArrayList<>();
        for (ScoredUser su : scoredList) {
            User u = su.user;
            FriendshipStatus status = FriendshipStatus.NONE;
            String reqId = null;

            if (friendUserIds.contains(u.getId())) {
                status = FriendshipStatus.FRIENDS;
            } else if (sentPendingMap.containsKey(u.getId())) {
                status = FriendshipStatus.PENDING_SENT;
                reqId = sentPendingMap.get(u.getId()).getId();
            } else if (receivedPendingMap.containsKey(u.getId())) {
                status = FriendshipStatus.PENDING_RECEIVED;
                reqId = receivedPendingMap.get(u.getId()).getId();
            }

            items.add(SearchPersonResult.builder()
                    .id(u.getId())
                    .username(u.getUsername())
                    .fullName(u.getFullName() != null ? u.getFullName() : u.getUsername())
                    .avatarUrl(u.getAvatarUrl())
                    .bio(u.getBio())
                    .profileLabel(u.getProfileLabel())
                    .friendshipStatus(status)
                    .friendRequestId(reqId)
                    .build());
        }

        return paginate(items, page, size);
    }

    private SearchGroupResponse<SearchBlogResult> searchBlogs(
            String q, Set<String> friendUserIds, int page, int size) {
        Set<JournalEntry> matchedBlogsSet = new LinkedHashSet<>();
        matchedBlogsSet.addAll(journalEntryRepository.searchPublicBlogs(q));

        String[] tokens = q.split("\\s+");
        if (tokens.length > 1) {
            for (String token : tokens) {
                if (token.length() >= 2) {
                    matchedBlogsSet.addAll(journalEntryRepository.searchPublicBlogs(token));
                }
            }
        }

        List<JournalEntry> matchedBlogs = new ArrayList<>(matchedBlogsSet);
        if (matchedBlogs.isEmpty()) {
            return SearchGroupResponse.empty();
        }

        // Batch load author profiles to prevent N+1 queries
        Set<String> authorIds = matchedBlogs.stream().map(JournalEntry::getUserId).collect(Collectors.toSet());
        Map<String, User> authorMap = userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        String lowerQ = q.toLowerCase();

        class ScoredBlog {
            final JournalEntry blog;
            final int score;
            final boolean isFriend;
            ScoredBlog(JournalEntry blog, int score, boolean isFriend) {
                this.blog = blog;
                this.score = score;
                this.isFriend = isFriend;
            }
        }

        List<ScoredBlog> scoredList = new ArrayList<>();
        for (JournalEntry blog : matchedBlogs) {
            int score = 0;
            String title = blog.getTitle() != null ? blog.getTitle().toLowerCase() : "";
            String content = blog.getContent() != null ? blog.getContent().toLowerCase() : "";
            String category = blog.getCategory() != null ? blog.getCategory().toLowerCase() : "";
            boolean tagMatch = blog.getTags() != null && blog.getTags().stream().anyMatch(t -> t.equalsIgnoreCase(lowerQ));

            if (title.equals(lowerQ)) score += 100;
            else if (title.startsWith(lowerQ)) score += 80;
            else if (title.contains(lowerQ)) score += 60;

            if (category.equals(lowerQ)) score += 40;
            else if (category.contains(lowerQ)) score += 30;

            if (tagMatch) score += 35;
            if (content.contains(lowerQ)) score += 20;

            if (tokens.length > 1) {
                int matchedTokenCount = 0;
                for (String token : tokens) {
                    String lowerToken = token.toLowerCase();
                    if (title.contains(lowerToken)) {
                        score += 25;
                        matchedTokenCount++;
                    } else if (content.contains(lowerToken)) {
                        score += 10;
                    }
                }
                if (matchedTokenCount == tokens.length) {
                    score += 50; // All keywords present in title
                }
            }

            boolean isFriend = friendUserIds.contains(blog.getUserId());
            if (isFriend) {
                score += 1000; // Mandatory friend-first boost
            }

            scoredList.add(new ScoredBlog(blog, score, isFriend));
        }

        // Sort: score desc, publishedAt desc, viewCount desc, id asc (deterministic)
        scoredList.sort((a, b) -> {
            int cmp = Integer.compare(b.score, a.score);
            if (cmp != 0) return cmp;
            if (a.blog.getPublishedAt() != null && b.blog.getPublishedAt() != null) {
                int dateCmp = b.blog.getPublishedAt().compareTo(a.blog.getPublishedAt());
                if (dateCmp != 0) return dateCmp;
            }
            int viewCmp = Long.compare(b.blog.getViewCount(), a.blog.getViewCount());
            if (viewCmp != 0) return viewCmp;
            return a.blog.getId().compareTo(b.blog.getId());
        });

        List<SearchBlogResult> items = new ArrayList<>();
        for (ScoredBlog sb : scoredList) {
            JournalEntry b = sb.blog;
            User author = authorMap.get(b.getUserId());
            String authorName = (author != null && author.getFullName() != null && !author.getFullName().isBlank())
                    ? author.getFullName()
                    : (author != null ? author.getUsername() : "NoteSphere Writer");
            String authorAvatar = author != null ? author.getAvatarUrl() : null;

            items.add(SearchBlogResult.builder()
                    .id(b.getId())
                    .slug(b.getSlug())
                    .title(b.getTitle())
                    .excerpt(generateExcerpt(b.getContent()))
                    .coverImageUrl(b.getCoverImageUrl())
                    .category(b.getCategory())
                    .tags(b.getTags() != null ? new ArrayList<>(b.getTags()) : new ArrayList<>())
                    .authorId(b.getUserId())
                    .authorName(authorName)
                    .authorAvatarUrl(authorAvatar)
                    .publishedAt(b.getPublishedAt())
                    .viewCount(b.getViewCount())
                    .likeCount(b.getLikeCount())
                    .readingTimeMinutes(calculateReadingTime(b))
                    .friendAuthor(sb.isFriend)
                    .build());
        }

        return paginate(items, page, size);
    }

    private SearchGroupResponse<SearchCommunityResult> searchCommunities(
            String q, Set<String> joinedCommunityIds, int page, int size) {
        Set<Community> matchedCommunitiesSet = new LinkedHashSet<>();
        matchedCommunitiesSet.addAll(communityRepository.searchCommunitiesByQuery(q));

        String[] tokens = q.split("\\s+");
        if (tokens.length > 1) {
            for (String token : tokens) {
                if (token.length() >= 2) {
                    matchedCommunitiesSet.addAll(communityRepository.searchCommunitiesByQuery(token));
                }
            }
        }

        List<Community> matched = new ArrayList<>(matchedCommunitiesSet);
        if (matched.isEmpty()) {
            return SearchGroupResponse.empty();
        }

        String lowerQ = q.toLowerCase();

        class ScoredCommunity {
            final Community community;
            final int score;
            final boolean isMember;
            ScoredCommunity(Community community, int score, boolean isMember) {
                this.community = community;
                this.score = score;
                this.isMember = isMember;
            }
        }

        List<ScoredCommunity> scoredList = new ArrayList<>();
        for (Community c : matched) {
            int score = 0;
            String name = c.getName() != null ? c.getName().toLowerCase() : "";
            String desc = c.getDescription() != null ? c.getDescription().toLowerCase() : "";
            String cat = c.getCategory() != null ? c.getCategory().toLowerCase() : "";

            if (name.equals(lowerQ)) score += 100;
            else if (name.startsWith(lowerQ)) score += 80;
            else if (name.contains(lowerQ)) score += 60;
            else if (cat.contains(lowerQ)) score += 35;
            else if (desc.contains(lowerQ)) score += 20;

            if (tokens.length > 1) {
                int matchedTokenCount = 0;
                for (String token : tokens) {
                    String lowerToken = token.toLowerCase();
                    if (name.contains(lowerToken)) {
                        score += 25;
                        matchedTokenCount++;
                    } else if (cat.contains(lowerToken)) {
                        score += 15;
                    }
                }
                if (matchedTokenCount >= tokens.length) {
                    score += 40;
                }
            }

            boolean isMember = joinedCommunityIds.contains(c.getId());
            if (isMember) {
                score += 10;
            }

            scoredList.add(new ScoredCommunity(c, score, isMember));
        }

        // Sort: score desc, memberCount desc, name asc
        scoredList.sort((a, b) -> {
            int cmp = Integer.compare(b.score, a.score);
            if (cmp != 0) return cmp;
            int memCmp = Integer.compare(b.community.getMemberCount(), a.community.getMemberCount());
            if (memCmp != 0) return memCmp;
            return a.community.getName().compareToIgnoreCase(b.community.getName());
        });

        List<SearchCommunityResult> items = new ArrayList<>();
        for (ScoredCommunity sc : scoredList) {
            Community c = sc.community;
            items.add(SearchCommunityResult.builder()
                    .id(c.getId())
                    .name(c.getName())
                    .description(c.getDescription())
                    .icon(c.getIcon())
                    .category(c.getCategory())
                    .memberCount(c.getMemberCount())
                    .member(sc.isMember)
                    .build());
        }

        return paginate(items, page, size);
    }

    private SearchGroupResponse<SearchCommunityPostResult> searchCommunityPosts(
            String q, Set<String> friendUserIds, Set<String> joinedCommunityIds, int page, int size) {
        if (joinedCommunityIds == null || joinedCommunityIds.isEmpty()) {
            // Strictly protect community posts from non-members
            return SearchGroupResponse.empty();
        }

        Set<JournalEntry> matchedPostsSet = new LinkedHashSet<>();
        matchedPostsSet.addAll(journalEntryRepository.searchCommunityPostsByCommunityIds(
                q, new ArrayList<>(joinedCommunityIds)));

        String[] tokens = q.split("\\s+");
        if (tokens.length > 1) {
            for (String token : tokens) {
                if (token.length() >= 2) {
                    matchedPostsSet.addAll(journalEntryRepository.searchCommunityPostsByCommunityIds(
                            token, new ArrayList<>(joinedCommunityIds)));
                }
            }
        }

        List<JournalEntry> matchedPosts = new ArrayList<>(matchedPostsSet);
        if (matchedPosts.isEmpty()) {
            return SearchGroupResponse.empty();
        }

        Set<String> authorIds = matchedPosts.stream().map(JournalEntry::getUserId).collect(Collectors.toSet());
        Map<String, User> authorMap = userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        String lowerQ = q.toLowerCase();

        class ScoredPost {
            final JournalEntry post;
            final int score;
            final boolean isFriend;
            ScoredPost(JournalEntry post, int score, boolean isFriend) {
                this.post = post;
                this.score = score;
                this.isFriend = isFriend;
            }
        }

        List<ScoredPost> scoredList = new ArrayList<>();
        for (JournalEntry post : matchedPosts) {
            int score = 0;
            String title = post.getTitle() != null ? post.getTitle().toLowerCase() : "";
            String content = post.getContent() != null ? post.getContent().toLowerCase() : "";
            String category = post.getCategory() != null ? post.getCategory().toLowerCase() : "";
            boolean tagMatch = post.getTags() != null && post.getTags().stream().anyMatch(t -> t.equalsIgnoreCase(lowerQ));

            if (title.equals(lowerQ)) score += 100;
            else if (title.startsWith(lowerQ)) score += 80;
            else if (title.contains(lowerQ)) score += 60;

            if (category.equals(lowerQ)) score += 40;
            else if (category.contains(lowerQ)) score += 30;

            if (tagMatch) score += 35;
            if (content.contains(lowerQ)) score += 20;

            if (tokens.length > 1) {
                int matchedTokenCount = 0;
                for (String token : tokens) {
                    String lowerToken = token.toLowerCase();
                    if (title.contains(lowerToken)) {
                        score += 25;
                        matchedTokenCount++;
                    } else if (content.contains(lowerToken)) {
                        score += 10;
                    }
                }
                if (matchedTokenCount == tokens.length) {
                    score += 50; // All keywords present in title
                }
            }

            boolean isFriend = friendUserIds.contains(post.getUserId());
            if (isFriend) {
                score += 1000;
            }

            scoredList.add(new ScoredPost(post, score, isFriend));
        }

        // Sort: score desc, publishedAt desc, viewCount desc, id asc
        scoredList.sort((a, b) -> {
            int cmp = Integer.compare(b.score, a.score);
            if (cmp != 0) return cmp;
            if (a.post.getPublishedAt() != null && b.post.getPublishedAt() != null) {
                int dateCmp = b.post.getPublishedAt().compareTo(a.post.getPublishedAt());
                if (dateCmp != 0) return dateCmp;
            }
            int viewCmp = Long.compare(b.post.getViewCount(), a.post.getViewCount());
            if (viewCmp != 0) return viewCmp;
            return a.post.getId().compareTo(b.post.getId());
        });

        List<SearchCommunityPostResult> items = new ArrayList<>();
        for (ScoredPost sp : scoredList) {
            JournalEntry p = sp.post;
            User author = authorMap.get(p.getUserId());
            String authorName = (author != null && author.getFullName() != null && !author.getFullName().isBlank())
                    ? author.getFullName()
                    : (author != null ? author.getUsername() : "Community Member");
            String authorAvatar = author != null ? author.getAvatarUrl() : null;

            items.add(SearchCommunityPostResult.builder()
                    .id(p.getId())
                    .slug(p.getSlug())
                    .title(p.getTitle())
                    .excerpt(generateExcerpt(p.getContent()))
                    .coverImageUrl(p.getCoverImageUrl())
                    .communityId(p.getCommunityId())
                    .communityName(p.getCommunityName())
                    .category(p.getCategory())
                    .tags(p.getTags() != null ? new ArrayList<>(p.getTags()) : new ArrayList<>())
                    .authorId(p.getUserId())
                    .authorName(authorName)
                    .authorAvatarUrl(authorAvatar)
                    .publishedAt(p.getPublishedAt())
                    .viewCount(p.getViewCount())
                    .likeCount(p.getLikeCount())
                    .commentCount(p.getCommentCount())
                    .friendAuthor(sp.isFriend)
                    .build());
        }

        return paginate(items, page, size);
    }

    private <T> SearchGroupResponse<T> paginate(List<T> allItems, int page, int size) {
        int total = allItems.size();
        int totalPages = (total == 0) ? 0 : (int) Math.ceil((double) total / size);
        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);
        List<T> pageItems = allItems.subList(fromIndex, toIndex);
        return SearchGroupResponse.<T>builder()
                .items(new ArrayList<>(pageItems))
                .total(total)
                .page(page)
                .size(size)
                .totalPages(totalPages)
                .build();
    }

    private String generateExcerpt(String content) {
        if (content == null || content.isBlank()) {
            return "";
        }
        String cleaned = content.replaceAll("#+\\s*", "")
                .replaceAll("\\[([^\\]]+)\\]\\([^\\)]+\\)", "$1")
                .replaceAll("<[^>]*>", "")
                .replaceAll("\\s+", " ")
                .trim();
        if (cleaned.length() <= 160) {
            return cleaned;
        }
        return cleaned.substring(0, 160).trim() + "...";
    }

    private int calculateReadingTime(JournalEntry journal) {
        int words = journal.getWordCount();
        if (words <= 0 && journal.getContent() != null) {
            words = journal.getContent().trim().split("\\s+").length;
        }
        return Math.max(1, (int) Math.ceil(words / 200.0));
    }
}
