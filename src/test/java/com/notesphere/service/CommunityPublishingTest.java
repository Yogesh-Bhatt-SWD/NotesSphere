package com.notesphere.service;

import com.notesphere.dto.request.CommentRequest;
import com.notesphere.dto.request.PublishJournalRequest;
import com.notesphere.dto.response.CommentResponse;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.entity.Community;
import com.notesphere.entity.CommunityMember;
import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.User;
import com.notesphere.entity.enums.CommunityRole;
import com.notesphere.entity.enums.JournalVisibility;
import com.notesphere.exception.BadRequestException;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommunityPublishingTest {

    @Mock
    private JournalEntryRepository journalRepository;

    @Mock
    private CommunityRepository communityRepository;

    @Mock
    private CommunityMemberRepository communityMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostCommentRepository commentRepository;

    @Mock
    private PostReactionRepository reactionRepository;

    @Mock
    private PostReportRepository reportRepository;

    @Mock
    private SentimentAnalysisService sentimentAnalysisService;

    @Mock
    private TaggingService taggingService;

    @InjectMocks
    private JournalService journalService;

    @InjectMocks
    private CommunityService communityService;

    private JournalEntry privateJournal;
    private JournalEntry publishedJournal;
    private Community community;
    private User author;

    @BeforeEach
    void setUp() {
        author = User.builder()
                .id("user-author")
                .username("AuthorUser")
                .email("author@example.com")
                .build();

        community = Community.builder()
                .id("comm-1")
                .name("Mindful Living")
                .description("Mindfulness community")
                .creatorId("user-admin")
                .memberCount(5)
                .build();

        privateJournal = JournalEntry.builder()
                .id("j-priv")
                .userId("user-author")
                .title("My Private Note")
                .content("Secret thoughts")
                .visibility(JournalVisibility.PRIVATE)
                .createdAt(Instant.now())
                .build();

        publishedJournal = JournalEntry.builder()
                .id("j-pub")
                .userId("user-author")
                .title("Public Thoughts")
                .content("Community reflection")
                .visibility(JournalVisibility.COMMUNITY)
                .communityId("comm-1")
                .communityName("Mindful Living")
                .publishedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("Author can publish their private journal to a joined community")
    void publishJournal_Success() {
        PublishJournalRequest request = PublishJournalRequest.builder()
                .communityId("comm-1")
                .build();

        when(journalRepository.findById("j-priv")).thenReturn(Optional.of(privateJournal));
        when(communityRepository.findById("comm-1")).thenReturn(Optional.of(community));
        when(communityMemberRepository.existsByCommunityIdAndUserId("comm-1", "user-author")).thenReturn(true);
        when(journalRepository.save(any(JournalEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));

        JournalResponse response = journalService.publishJournal("user-author", "j-priv", request);

        assertNotNull(response);
        assertEquals(JournalVisibility.COMMUNITY, response.getVisibility());
        assertEquals("comm-1", response.getCommunityId());
        assertEquals("Mindful Living", response.getCommunityName());
        assertNotNull(response.getPublishedAt());
        verify(journalRepository).save(privateJournal);
    }

    @Test
    @DisplayName("Publishing fails if user is NOT a member of the community")
    void publishJournal_Fails_WhenNotCommunityMember() {
        PublishJournalRequest request = PublishJournalRequest.builder()
                .communityId("comm-1")
                .build();

        when(journalRepository.findById("j-priv")).thenReturn(Optional.of(privateJournal));
        when(communityRepository.findById("comm-1")).thenReturn(Optional.of(community));
        when(communityMemberRepository.existsByCommunityIdAndUserId("comm-1", "user-author")).thenReturn(false);

        assertThrows(AccessDeniedException.class, () ->
                journalService.publishJournal("user-author", "j-priv", request));
        verify(journalRepository, never()).save(any());
    }

    @Test
    @DisplayName("Publishing fails if user attempts to publish someone else's journal (BOLA protection)")
    void publishJournal_Fails_WhenNotJournalOwner() {
        PublishJournalRequest request = PublishJournalRequest.builder()
                .communityId("comm-1")
                .build();

        when(journalRepository.findById("j-priv")).thenReturn(Optional.of(privateJournal));

        assertThrows(AccessDeniedException.class, () ->
                journalService.publishJournal("attacker-user", "j-priv", request));
    }

    @Test
    @DisplayName("Author can unpublish a journal back to private")
    void unpublishJournal_Success() {
        when(journalRepository.findById("j-pub")).thenReturn(Optional.of(publishedJournal));
        when(journalRepository.save(any(JournalEntry.class))).thenAnswer(invocation -> invocation.getArgument(0));

        JournalResponse response = journalService.unpublishJournal("user-author", "j-pub");

        assertNotNull(response);
        assertEquals(JournalVisibility.PRIVATE, response.getVisibility());
        assertNull(response.getCommunityId());
        assertNull(response.getCommunityName());
        assertNull(response.getPublishedAt());
        verify(journalRepository).save(publishedJournal);
    }

    @Test
    @DisplayName("Private journal cannot be read by another user via direct ID query (403 Forbidden)")
    void getJournalById_Private_Fails_ForOtherUser() {
        when(journalRepository.findById("j-priv")).thenReturn(Optional.of(privateJournal));

        assertThrows(AccessDeniedException.class, () ->
                journalService.getJournalById("other-user", "j-priv"));
    }

    @Test
    @DisplayName("Community member can read a published community post")
    void getJournalById_CommunityPost_Allowed_ForMember() {
        when(journalRepository.findById("j-pub")).thenReturn(Optional.of(publishedJournal));
        when(communityMemberRepository.existsByCommunityIdAndUserId("comm-1", "member-user")).thenReturn(true);

        JournalResponse response = journalService.getJournalById("member-user", "j-pub");

        assertNotNull(response);
        assertEquals("j-pub", response.getId());
        assertEquals("Public Thoughts", response.getTitle());
    }

    @Test
    @DisplayName("Non-member cannot read a published community post")
    void getJournalById_CommunityPost_Fails_ForNonMember() {
        when(journalRepository.findById("j-pub")).thenReturn(Optional.of(publishedJournal));
        when(communityMemberRepository.existsByCommunityIdAndUserId("comm-1", "non-member")).thenReturn(false);

        assertThrows(AccessDeniedException.class, () ->
                journalService.getJournalById("non-member", "j-pub"));
    }

    @Test
    @DisplayName("Community member can add comment to published community post")
    void addComment_Success() {
        CommentRequest request = CommentRequest.builder().content("Inspiring reflection!").build();

        when(journalRepository.findById("j-pub")).thenReturn(Optional.of(publishedJournal));
        when(communityMemberRepository.existsByCommunityIdAndUserId("comm-1", "member-user")).thenReturn(true);
        when(commentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(commentRepository.countByJournalId("j-pub")).thenReturn(1);
        when(userRepository.findById("member-user")).thenReturn(Optional.of(User.builder().id("member-user").username("MemberUser").build()));

        CommentResponse response = communityService.addComment("member-user", "j-pub", request);

        assertNotNull(response);
        assertEquals("Inspiring reflection!", response.getContent());
        assertEquals("MemberUser", response.getAuthorName());
        verify(journalRepository).save(publishedJournal);
    }

    @Test
    @DisplayName("Cannot comment on a private journal")
    void addComment_Fails_OnPrivateJournal() {
        CommentRequest request = CommentRequest.builder().content("Should fail").build();
        when(journalRepository.findById("j-priv")).thenReturn(Optional.of(privateJournal));

        assertThrows(BadRequestException.class, () ->
                communityService.addComment("member-user", "j-priv", request));
    }

    @Test
    @DisplayName("Community member can toggle like reaction on published post")
    void toggleReaction_Success() {
        when(journalRepository.findById("j-pub")).thenReturn(Optional.of(publishedJournal));
        when(communityMemberRepository.existsByCommunityIdAndUserId("comm-1", "member-user")).thenReturn(true);
        when(reactionRepository.findByJournalIdAndUserId("j-pub", "member-user")).thenReturn(Optional.empty());
        when(reactionRepository.countByJournalId("j-pub")).thenReturn(1);

        Map<String, Object> result = communityService.toggleReaction("member-user", "j-pub");

        assertTrue((Boolean) result.get("liked"));
        assertEquals(1, result.get("likeCount"));
        verify(reactionRepository).save(any());
        verify(journalRepository).save(publishedJournal);
    }
}
