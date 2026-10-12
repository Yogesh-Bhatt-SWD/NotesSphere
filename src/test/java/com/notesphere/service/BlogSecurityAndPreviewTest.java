package com.notesphere.service;

import com.notesphere.dto.response.BlogPreviewResponse;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.entity.Community;
import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.User;
import com.notesphere.entity.enums.JournalVisibility;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.repository.CommunityMemberRepository;
import com.notesphere.repository.CommunityRepository;
import com.notesphere.repository.JournalEntryRepository;
import com.notesphere.repository.JournalViewRepository;
import com.notesphere.repository.PostReactionRepository;
import com.notesphere.repository.UserRepository;
import com.notesphere.util.SlugUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BlogSecurityAndPreviewTest {

    @Mock
    private JournalEntryRepository journalRepository;

    @Mock
    private JournalViewRepository journalViewRepository;

    @Mock
    private CommunityRepository communityRepository;

    @Mock
    private CommunityMemberRepository communityMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostReactionRepository postReactionRepository;

    @Mock
    private SentimentAnalysisService sentimentAnalysisService;

    @Mock
    private TaggingService taggingService;

    @InjectMocks
    private JournalService journalService;

    private User testAuthor;
    private JournalEntry publicBlog;
    private JournalEntry communityBlog;
    private JournalEntry privateJournal;
    private JournalEntry draftJournal;

    @BeforeEach
    void setUp() {
        testAuthor = User.builder()
                .id("author-101")
                .username("sarah_writer")
                .fullName("Sarah Writer")
                .email("sarah@notesphere.app")
                .avatarUrl("https://notes-sphere-d2m4.vercel.app/avatars/sarah.jpg")
                .build();

        publicBlog = JournalEntry.builder()
                .id("blog-uuid-1111-2222")
                .slug("mindful-morning-reflections-a1b2c3d4")
                .userId(testAuthor.getId())
                .title("Mindful Morning Reflections")
                .content("Every morning is a fresh start to pause, reflect, and set meaningful intentions for the day ahead. Practicing gratitude transformed my anxiety into peaceful focus.")
                .coverImageUrl("https://images.unsplash.com/photo-mindful.jpg")
                .category("Mindfulness")
                .tags(List.of("mindfulness", "habits", "peace"))
                .visibility(JournalVisibility.PUBLIC)
                .publishedAt(Instant.now().minus(3, ChronoUnit.DAYS))
                .viewCount(42L)
                .likeCount(15)
                .build();

        communityBlog = JournalEntry.builder()
                .id("comm-blog-uuid-3333")
                .slug("coding-productivity-tips-e5f6g7h8")
                .userId(testAuthor.getId())
                .title("Coding Productivity Tips")
                .content("In the developer community, keeping focus is hard. Here are 5 habits that keep my flow state uninterrupted.")
                .coverImageUrl(null)
                .category("Tech")
                .tags(List.of("coding", "focus"))
                .visibility(JournalVisibility.COMMUNITY)
                .communityId("comm-dev-777")
                .communityName("Dev Guild")
                .publishedAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .viewCount(20L)
                .likeCount(5)
                .build();

        privateJournal = JournalEntry.builder()
                .id("priv-uuid-4444")
                .slug("my-secret-diary-12345678")
                .userId(testAuthor.getId())
                .title("My Secret Diary")
                .content("Private thoughts that nobody else should ever read under any circumstances.")
                .visibility(JournalVisibility.PRIVATE)
                .publishedAt(null)
                .viewCount(0L)
                .build();

        draftJournal = JournalEntry.builder()
                .id("draft-uuid-5555")
                .slug("draft-article-87654321")
                .userId(testAuthor.getId())
                .title("Draft Article")
                .content("Unpublished draft not ready for the public eyes.")
                .visibility(JournalVisibility.PUBLIC)
                .publishedAt(null)
                .viewCount(0L)
                .build();
    }

    @Test
    @DisplayName("Public Preview: Returns permitted teaser metadata and strictly omits full content")
    void testPublicPreview_ReturnsTeaserMetadata_OmitsFullContent() {
        when(journalRepository.findBySlugOrId("mindful-morning-reflections-a1b2c3d4"))
                .thenReturn(Optional.of(publicBlog));
        when(userRepository.findById(testAuthor.getId()))
                .thenReturn(Optional.of(testAuthor));

        BlogPreviewResponse preview = journalService.getPublicBlogPreview("mindful-morning-reflections-a1b2c3d4");

        assertNotNull(preview);
        assertEquals("Mindful Morning Reflections", preview.getTitle());
        assertEquals("mindful-morning-reflections-a1b2c3d4", preview.getSlug());
        assertEquals("Sarah Writer", preview.getAuthorName());
        assertEquals(testAuthor.getAvatarUrl(), preview.getAuthorAvatarUrl());
        assertEquals("https://images.unsplash.com/photo-mindful.jpg", preview.getCoverImageUrl());
        assertEquals(42L, preview.getViewCount());
        assertEquals(15, preview.getLikeCount());
        assertEquals("Mindfulness", preview.getCategory());
        assertNotNull(preview.getExcerpt());
        assertTrue(preview.getExcerpt().length() > 20);

        // Preview does NOT record views
        verify(journalRepository, never()).incrementViewCount(any());
        verify(journalViewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Public Preview: Private journals and drafts throw 404 ResourceNotFoundException")
    void testPublicPreview_PrivateOrDraft_ThrowsNotFound() {
        when(journalRepository.findBySlugOrId("my-secret-diary-12345678"))
                .thenReturn(Optional.of(privateJournal));
        when(journalRepository.findBySlugOrId("draft-article-87654321"))
                .thenReturn(Optional.of(draftJournal));

        assertThrows(ResourceNotFoundException.class, () ->
                journalService.getPublicBlogPreview("my-secret-diary-12345678"));

        assertThrows(ResourceNotFoundException.class, () ->
                journalService.getPublicBlogPreview("draft-article-87654321"));
    }

    @Test
    @DisplayName("Full Blog: Requires authentication - unauthenticated throws AuthenticationCredentialsNotFoundException")
    void testFullBlog_Unauthenticated_ThrowsException() {
        assertThrows(AuthenticationCredentialsNotFoundException.class, () ->
                journalService.getFullBlog(null, "mindful-morning-reflections-a1b2c3d4"));

        assertThrows(AuthenticationCredentialsNotFoundException.class, () ->
                journalService.getFullBlog("", "mindful-morning-reflections-a1b2c3d4"));
    }

    @Test
    @DisplayName("Full Blog: Authenticated user reading public blog gets full content and records view")
    void testFullBlog_Authenticated_PublicBlog_ReturnsFullContentAndRecordsView() {
        when(journalRepository.findBySlugOrId("mindful-morning-reflections-a1b2c3d4"))
                .thenReturn(Optional.of(publicBlog));
        when(journalRepository.findById(publicBlog.getId()))
                .thenReturn(Optional.of(publicBlog));
        when(userRepository.findById(testAuthor.getId()))
                .thenReturn(Optional.of(testAuthor));
        when(journalViewRepository.findByJournalIdAndViewerId(publicBlog.getId(), "viewer-999"))
                .thenReturn(Optional.empty());

        JournalResponse response = journalService.getFullBlog("viewer-999", "mindful-morning-reflections-a1b2c3d4");

        assertNotNull(response);
        assertEquals(publicBlog.getTitle(), response.getTitle());
        assertEquals(publicBlog.getContent(), response.getContent());
        assertEquals("Sarah Writer", response.getAuthorName());
        assertEquals("mindful-morning-reflections-a1b2c3d4", response.getSlug());

        // View was recorded for viewer-999
        verify(journalRepository).incrementViewCount(publicBlog.getId());
        verify(journalViewRepository).save(any());
    }

    @Test
    @DisplayName("Full Blog: Author reading own blog gets full content without incrementing view count")
    void testFullBlog_AuthorReadingOwnBlog_DoesNotIncrementViewCount() {
        when(journalRepository.findBySlugOrId("mindful-morning-reflections-a1b2c3d4"))
                .thenReturn(Optional.of(publicBlog));
        when(userRepository.findById(testAuthor.getId()))
                .thenReturn(Optional.of(testAuthor));

        JournalResponse response = journalService.getFullBlog(testAuthor.getId(), "mindful-morning-reflections-a1b2c3d4");

        assertNotNull(response);
        assertEquals(publicBlog.getTitle(), response.getTitle());
        verify(journalRepository, never()).incrementViewCount(any());
    }

    @Test
    @DisplayName("Full Blog: Community blog checks membership (non-member forbidden, member allowed)")
    void testFullBlog_CommunityBlog_EnforcesMembership() {
        when(journalRepository.findBySlugOrId("coding-productivity-tips-e5f6g7h8"))
                .thenReturn(Optional.of(communityBlog));
        when(communityMemberRepository.existsByCommunityIdAndUserId("comm-dev-777", "outsider-888"))
                .thenReturn(false);

        // Non-member access denied
        assertThrows(AccessDeniedException.class, () ->
                journalService.getFullBlog("outsider-888", "coding-productivity-tips-e5f6g7h8"));

        // Member allowed
        when(communityMemberRepository.existsByCommunityIdAndUserId("comm-dev-777", "member-777"))
                .thenReturn(true);
        when(journalRepository.findById(communityBlog.getId()))
                .thenReturn(Optional.of(communityBlog));
        when(journalViewRepository.findByJournalIdAndViewerId(communityBlog.getId(), "member-777"))
                .thenReturn(Optional.empty());

        JournalResponse memberResponse = journalService.getFullBlog("member-777", "coding-productivity-tips-e5f6g7h8");
        assertNotNull(memberResponse);
        assertEquals("Coding Productivity Tips", memberResponse.getTitle());
        verify(journalRepository).incrementViewCount(communityBlog.getId());
    }

    @Test
    @DisplayName("Full Blog: Private journal cannot be accessed by non-author even if slug is guessed")
    void testFullBlog_PrivateJournal_NonAuthor_ThrowsNotFound() {
        when(journalRepository.findBySlugOrId("my-secret-diary-12345678"))
                .thenReturn(Optional.of(privateJournal));

        assertThrows(ResourceNotFoundException.class, () ->
                journalService.getFullBlog("stranger-555", "my-secret-diary-12345678"));
    }

    @Test
    @DisplayName("Open Graph Metadata: Generates complete HTML tags for social crawlers")
    void testOpenGraphMetadata_GeneratesMetaTags() {
        when(journalRepository.findBySlugOrId("mindful-morning-reflections-a1b2c3d4"))
                .thenReturn(Optional.of(publicBlog));
        when(userRepository.findById(testAuthor.getId()))
                .thenReturn(Optional.of(testAuthor));

        String html = journalService.getBlogOgMetadata("mindful-morning-reflections-a1b2c3d4", "https://notes-sphere-d2m4.vercel.app");

        assertNotNull(html);
        assertTrue(html.contains("<meta property=\"og:title\" content=\"Mindful Morning Reflections\">"));
        assertTrue(html.contains("<meta property=\"og:image\" content=\"https://images.unsplash.com/photo-mindful.jpg\">"));
        assertTrue(html.contains("<meta property=\"og:url\" content=\"https://notes-sphere-d2m4.vercel.app/blogs/mindful-morning-reflections-a1b2c3d4\">"));
        assertTrue(html.contains("<meta property=\"og:type\" content=\"article\">"));
        assertTrue(html.contains("<meta name=\"twitter:card\" content=\"summary_large_image\">"));
        assertTrue(html.contains("Sarah Writer"));
    }

    @Test
    @DisplayName("SlugUtils: Generates safe slugs, reading time, and clean excerpts")
    void testSlugUtils() {
        String slug = SlugUtils.toSlug("Hello World! 2026: An Amazing Journey...", "12345678-abcd");
        assertTrue(slug.startsWith("hello-world-2026-an-amazing-journey-"));
        assertTrue(slug.endsWith("-12345678"));

        int readingTime = SlugUtils.estimateReadingTime("Word ".repeat(450));
        assertEquals(3, readingTime);

        String excerpt = SlugUtils.extractExcerpt("This is a short intro sentence that explains everything clearly.", 35);
        assertTrue(excerpt.endsWith("..."));
    }
}
