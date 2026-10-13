package com.notesphere.service;

import com.notesphere.dto.response.search.GlobalSearchResponse;
import com.notesphere.dto.response.search.SearchBlogResult;
import com.notesphere.dto.response.search.SearchPersonResult;
import com.notesphere.entity.*;
import com.notesphere.entity.enums.FriendshipStatus;
import com.notesphere.entity.enums.JournalVisibility;
import com.notesphere.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GlobalSearchServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JournalEntryRepository journalEntryRepository;

    @Mock
    private CommunityRepository communityRepository;

    @Mock
    private CommunityMemberRepository communityMemberRepository;

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private FriendRequestRepository friendRequestRepository;

    @InjectMocks
    private GlobalSearchService globalSearchService;

    private User currentUser;
    private User friendUser;
    private User strangerUser;

    @BeforeEach
    void setUp() {
        currentUser = User.builder()
                .id("user-me")
                .username("curious_dev")
                .fullName("Curious Developer")
                .build();

        friendUser = User.builder()
                .id("user-friend")
                .username("sarah_coder")
                .fullName("Sarah Connor")
                .avatarUrl("https://example.com/sarah.jpg")
                .bio("Building things.")
                .build();

        strangerUser = User.builder()
                .id("user-stranger")
                .username("john_dev")
                .fullName("John Developer")
                .avatarUrl("https://example.com/john.jpg")
                .bio("Exploring AI.")
                .build();
    }

    @Test
    void testCrossUserBlogDiscoveryAndFriendPriorityRanking() {
        // Arrange
        String currentUserId = "user-me";
        String query = "Spring Boot";

        // Current user is friends with friendUser
        Friendship friendship = Friendship.builder()
                .id("f-1")
                .userAId("user-me")
                .userBId("user-friend")
                .build();
        when(friendshipRepository.findAllByUserId(currentUserId)).thenReturn(List.of(friendship));
        when(communityMemberRepository.findByUserId(currentUserId)).thenReturn(Collections.emptyList());

        // Two published blogs with matching titles: one by stranger, one by friend
        JournalEntry strangerBlog = JournalEntry.builder()
                .id("blog-stranger")
                .slug("stranger-spring-boot-guide")
                .title("Spring Boot Deep Dive")
                .content("Comprehensive tutorial on Spring Boot microservices.")
                .userId("user-stranger")
                .visibility(JournalVisibility.PUBLIC)
                .publishedAt(Instant.now().minusSeconds(3600))
                .viewCount(500)
                .wordCount(1200)
                .build();

        JournalEntry friendBlog = JournalEntry.builder()
                .id("blog-friend")
                .slug("sarah-spring-boot-tips")
                .title("Spring Boot Deep Dive")
                .content("Quick tips for Spring Boot developers.")
                .userId("user-friend")
                .visibility(JournalVisibility.PUBLIC)
                .publishedAt(Instant.now().minusSeconds(7200))
                .viewCount(100)
                .wordCount(800)
                .build();

        // Repository returns both matching public blogs
        when(journalEntryRepository.searchPublicBlogs(query)).thenReturn(List.of(strangerBlog, friendBlog));
        when(userRepository.findAllById(anySet())).thenReturn(List.of(strangerUser, friendUser));
        when(userRepository.searchUsers(eq(query), eq(currentUserId))).thenReturn(Collections.emptyList());
        when(communityRepository.searchCommunitiesByQuery(query)).thenReturn(Collections.emptyList());

        // Act
        GlobalSearchResponse response = globalSearchService.search("  Spring Boot  ", "ALL", 0, 10, currentUserId);

        // Assert
        assertNotNull(response);
        assertEquals("Spring Boot", response.getQuery());
        assertEquals(2, response.getBlogs().getTotal());

        List<SearchBlogResult> blogResults = response.getBlogs().getItems();
        assertEquals(2, blogResults.size());

        // Friend's blog MUST rank first despite lower view count/older date because of friend-first priority
        SearchBlogResult firstResult = blogResults.get(0);
        assertEquals("blog-friend", firstResult.getId());
        assertTrue(firstResult.isFriendAuthor());
        assertEquals("Sarah Connor", firstResult.getAuthorName());

        SearchBlogResult secondResult = blogResults.get(1);
        assertEquals("blog-stranger", secondResult.getId());
        assertFalse(secondResult.isFriendAuthor());
        assertEquals("John Developer", secondResult.getAuthorName());
    }

    @Test
    void testPeopleSearchWithFriendshipStatusResolution() {
        // Arrange
        String currentUserId = "user-me";
        String query = "dev";

        when(friendshipRepository.findAllByUserId(currentUserId)).thenReturn(Collections.emptyList());
        when(communityMemberRepository.findByUserId(currentUserId)).thenReturn(Collections.emptyList());

        User userWithPendingReq = User.builder()
                .id("user-pending")
                .username("dev_alex")
                .fullName("Alex Developer")
                .build();

        when(userRepository.searchUsers(query, currentUserId)).thenReturn(List.of(userWithPendingReq, strangerUser));

        FriendRequest pendingReq = FriendRequest.builder()
                .id("req-99")
                .senderId(currentUserId)
                .receiverId("user-pending")
                .build();

        when(friendRequestRepository.findPendingForUserAndTargets(eq(currentUserId), anyList()))
                .thenReturn(List.of(pendingReq));

        // Act
        GlobalSearchResponse response = globalSearchService.search(query, "PEOPLE", 0, 10, currentUserId);

        // Assert
        assertNotNull(response);
        assertEquals(2, response.getPeople().getTotal());

        SearchPersonResult alexResult = response.getPeople().getItems().stream()
                .filter(p -> p.getId().equals("user-pending"))
                .findFirst().orElseThrow();
        assertEquals(FriendshipStatus.PENDING_SENT, alexResult.getFriendshipStatus());
        assertEquals("req-99", alexResult.getFriendRequestId());

        SearchPersonResult johnResult = response.getPeople().getItems().stream()
                .filter(p -> p.getId().equals("user-stranger"))
                .findFirst().orElseThrow();
        assertEquals(FriendshipStatus.NONE, johnResult.getFriendshipStatus());
        assertNull(johnResult.getFriendRequestId());
    }

    @Test
    void testCommunityPostProtectedWhenUserNotMember() {
        // Arrange
        String currentUserId = "user-me";
        String query = "Design";

        // Current user has joined NO communities
        when(friendshipRepository.findAllByUserId(currentUserId)).thenReturn(Collections.emptyList());
        when(communityMemberRepository.findByUserId(currentUserId)).thenReturn(Collections.emptyList());

        // Act
        GlobalSearchResponse response = globalSearchService.search(query, "COMMUNITY_POSTS", 0, 10, currentUserId);

        // Assert: community posts search returned empty without leaking any post
        assertNotNull(response);
        assertEquals(0, response.getCommunityPosts().getTotal());
        assertTrue(response.getCommunityPosts().getItems().isEmpty());
        verify(journalEntryRepository, never()).searchCommunityPostsByCommunityIds(anyString(), anyList());
    }

    @Test
    void testEmptyQueryReturnsZeroResultsSafely() {
        // Act
        GlobalSearchResponse response = globalSearchService.search("   ", "ALL", 0, 10, "user-me");

        // Assert
        assertNotNull(response);
        assertEquals("", response.getQuery());
        assertEquals(0, response.getTotalResults());
        verifyNoInteractions(journalEntryRepository);
        verifyNoInteractions(userRepository);
    }
}
