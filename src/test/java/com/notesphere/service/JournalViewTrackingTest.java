package com.notesphere.service;

import com.notesphere.dto.response.JournalResponse;
import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.JournalView;
import com.notesphere.entity.enums.JournalVisibility;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.repository.CommunityMemberRepository;
import com.notesphere.repository.JournalEntryRepository;
import com.notesphere.repository.JournalViewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JournalViewTrackingTest {

    @Mock
    private JournalEntryRepository journalRepository;

    @Mock
    private JournalViewRepository journalViewRepository;

    @Mock
    private CommunityMemberRepository communityMemberRepository;

    @InjectMocks
    private JournalService journalService;

    private JournalEntry publicJournal;
    private JournalEntry communityJournal;
    private JournalEntry privateJournal;
    private JournalEntry draftJournal;

    @BeforeEach
    void setUp() {
        publicJournal = JournalEntry.builder()
                .id("j-pub-1")
                .userId("author-123")
                .title("Public Blog Post")
                .content("Mindful reflection for all")
                .visibility(JournalVisibility.PUBLIC)
                .publishedAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .viewCount(10L)
                .build();

        communityJournal = JournalEntry.builder()
                .id("j-comm-1")
                .userId("author-123")
                .title("Community Story")
                .content("Shared inside mindful space")
                .visibility(JournalVisibility.COMMUNITY)
                .communityId("comm-456")
                .communityName("Mindful Space")
                .publishedAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .viewCount(5L)
                .build();

        privateJournal = JournalEntry.builder()
                .id("j-priv-1")
                .userId("author-123")
                .title("Private Personal Notes")
                .content("Confidential thoughts")
                .visibility(JournalVisibility.PRIVATE)
                .publishedAt(null)
                .viewCount(0L)
                .build();

        draftJournal = JournalEntry.builder()
                .id("j-draft-1")
                .userId("author-123")
                .title("Unpublished Draft")
                .content("WIP draft")
                .visibility(JournalVisibility.PUBLIC)
                .publishedAt(null) // Unset publishedAt indicates draft
                .viewCount(0L)
                .build();
    }

    @Test
    @DisplayName("1. Published PUBLIC content: increments view count atomically and records view")
    void recordView_PublishedPublic_IncrementsCount_AndCreatesViewRecord() {
        when(journalRepository.findById("j-pub-1")).thenReturn(Optional.of(publicJournal));
        when(journalViewRepository.findByJournalIdAndViewerId("j-pub-1", "reader-789")).thenReturn(Optional.empty());

        long result = journalService.recordView("reader-789", "j-pub-1");

        assertEquals(11L, result);
        verify(journalViewRepository, times(1)).save(any(JournalView.class));
        verify(journalRepository, times(1)).incrementViewCount("j-pub-1");
    }

    @Test
    @DisplayName("2. PRIVATE content: access never counts as a view (view count remains 0)")
    void recordView_PrivateContent_NeverIncrements_ReturnsCurrentCount() {
        when(journalRepository.findById("j-priv-1")).thenReturn(Optional.of(privateJournal));

        long result = journalService.recordView("reader-789", "j-priv-1");

        assertEquals(0L, result);
        verify(journalViewRepository, never()).save(any(JournalView.class));
        verify(journalRepository, never()).incrementViewCount(anyString());
    }

    @Test
    @DisplayName("3. DRAFT content (unpublished): access never counts as a view")
    void recordView_DraftContent_Unpublished_NeverIncrements() {
        when(journalRepository.findById("j-draft-1")).thenReturn(Optional.of(draftJournal));

        long result = journalService.recordView("reader-789", "j-draft-1");

        assertEquals(0L, result);
        verify(journalViewRepository, never()).save(any(JournalView.class));
        verify(journalRepository, never()).incrementViewCount(anyString());
    }

    @Test
    @DisplayName("4. Author self-views: excluded completely on backend, never increments count")
    void recordView_AuthorSelfView_NeverIncrements() {
        when(journalRepository.findById("j-pub-1")).thenReturn(Optional.of(publicJournal));

        long result = journalService.recordView("author-123", "j-pub-1");

        assertEquals(10L, result);
        verify(journalViewRepository, never()).save(any(JournalView.class));
        verify(journalRepository, never()).incrementViewCount(anyString());
    }

    @Test
    @DisplayName("5. COMMUNITY content: authorized member can view and view is recorded")
    void recordView_CommunityContent_Member_Allowed_IncrementsCount() {
        when(journalRepository.findById("j-comm-1")).thenReturn(Optional.of(communityJournal));
        when(communityMemberRepository.existsByCommunityIdAndUserId("comm-456", "member-999")).thenReturn(true);
        when(journalViewRepository.findByJournalIdAndViewerId("j-comm-1", "member-999")).thenReturn(Optional.empty());

        long result = journalService.recordView("member-999", "j-comm-1");

        assertEquals(6L, result);
        verify(journalViewRepository, times(1)).save(any(JournalView.class));
        verify(journalRepository, times(1)).incrementViewCount("j-comm-1");
    }

    @Test
    @DisplayName("6. COMMUNITY content: non-member throws AccessDeniedException and does not increment")
    void recordView_CommunityContent_NonMember_ThrowsAccessDenied_DoesNotIncrement() {
        when(journalRepository.findById("j-comm-1")).thenReturn(Optional.of(communityJournal));
        when(communityMemberRepository.existsByCommunityIdAndUserId("comm-456", "non-member-000")).thenReturn(false);

        assertThrows(AccessDeniedException.class, () ->
                journalService.recordView("non-member-000", "j-comm-1"));

        verify(journalViewRepository, never()).save(any(JournalView.class));
        verify(journalRepository, never()).incrementViewCount(anyString());
    }

    @Test
    @DisplayName("7. Repeated requests within 24-hour window: deduplicated, does not increment")
    void recordView_RepeatedRequestWithin24Hours_Deduplicated_DoesNotIncrement() {
        JournalView recentView = JournalView.builder()
                .id("view-1")
                .journalId("j-pub-1")
                .viewerId("reader-789")
                .lastViewedAt(Instant.now().minus(2, ChronoUnit.HOURS)) // viewed 2 hours ago
                .createdAt(Instant.now().minus(2, ChronoUnit.HOURS))
                .build();

        when(journalRepository.findById("j-pub-1")).thenReturn(Optional.of(publicJournal));
        when(journalViewRepository.findByJournalIdAndViewerId("j-pub-1", "reader-789")).thenReturn(Optional.of(recentView));

        long result = journalService.recordView("reader-789", "j-pub-1");

        assertEquals(10L, result);
        verify(journalRepository, never()).incrementViewCount(anyString());
    }

    @Test
    @DisplayName("8. Repeated request after 24 hours: increments count as a new viewing session")
    void recordView_RepeatedRequestAfter24Hours_IncrementsCount() {
        JournalView oldView = JournalView.builder()
                .id("view-1")
                .journalId("j-pub-1")
                .viewerId("reader-789")
                .lastViewedAt(Instant.now().minus(26, ChronoUnit.HOURS)) // viewed 26 hours ago
                .createdAt(Instant.now().minus(26, ChronoUnit.HOURS))
                .build();

        when(journalRepository.findById("j-pub-1")).thenReturn(Optional.of(publicJournal));
        when(journalViewRepository.findByJournalIdAndViewerId("j-pub-1", "reader-789")).thenReturn(Optional.of(oldView));

        long result = journalService.recordView("reader-789", "j-pub-1");

        assertEquals(11L, result);
        verify(journalViewRepository, times(1)).save(oldView);
        verify(journalRepository, times(1)).incrementViewCount("j-pub-1");
    }

    @Test
    @DisplayName("9. Concurrency race condition: duplicate insert caught gracefully by DB unique constraint")
    void recordView_ConcurrentDuplicateInsert_HandledGracefullyByUniqueConstraint() {
        when(journalRepository.findById("j-pub-1")).thenReturn(Optional.of(publicJournal));
        when(journalViewRepository.findByJournalIdAndViewerId("j-pub-1", "reader-789")).thenReturn(Optional.empty());
        when(journalViewRepository.save(any(JournalView.class)))
                .thenThrow(new DataIntegrityViolationException("Duplicate key error on uk_journal_view"));

        long result = journalService.recordView("reader-789", "j-pub-1");

        assertEquals(10L, result);
        verify(journalRepository, never()).incrementViewCount(anyString());
    }

    @Test
    @DisplayName("10. getJournalById: records view for authorized public reader")
    void getJournalById_CallsRecordView_ForPublicPost() {
        when(journalRepository.findById("j-pub-1")).thenReturn(Optional.of(publicJournal));
        when(journalViewRepository.findByJournalIdAndViewerId("j-pub-1", "reader-789")).thenReturn(Optional.empty());

        JournalResponse response = journalService.getJournalById("reader-789", "j-pub-1");

        assertNotNull(response);
        verify(journalRepository, times(1)).incrementViewCount("j-pub-1");
    }

    @Test
    @DisplayName("11. getJournalById: does not record view when author opens their own entry")
    void getJournalById_DoesNotCallRecordView_ForAuthorSelfView() {
        when(journalRepository.findById("j-pub-1")).thenReturn(Optional.of(publicJournal));

        JournalResponse response = journalService.getJournalById("author-123", "j-pub-1");

        assertNotNull(response);
        verify(journalViewRepository, never()).findByJournalIdAndViewerId(anyString(), anyString());
        verify(journalRepository, never()).incrementViewCount(anyString());
    }

    @Test
    @DisplayName("12. Non-existent journal throws ResourceNotFoundException")
    void recordView_NonExistentJournal_ThrowsResourceNotFound() {
        when(journalRepository.findById("non-existent")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                journalService.recordView("reader-1", "non-existent"));
    }

    @Test
    @DisplayName("13. Concurrent increments: multiple distinct users concurrently viewing post increments safely")
    void recordView_ConcurrentIncrements_MultipleDistinctUsers() throws InterruptedException {
        when(journalRepository.findById("j-pub-1")).thenReturn(Optional.of(publicJournal));
        when(journalViewRepository.findByJournalIdAndViewerId(eq("j-pub-1"), anyString())).thenReturn(Optional.empty());

        int threadCount = 10;
        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(threadCount);
        java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(threadCount);

        for (int i = 0; i < threadCount; i++) {
            final String viewerId = "distinct-reader-" + i;
            executor.submit(() -> {
                try {
                    journalService.recordView(viewerId, "j-pub-1");
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(5, java.util.concurrent.TimeUnit.SECONDS);
        executor.shutdown();

        verify(journalRepository, times(threadCount)).incrementViewCount("j-pub-1");
        verify(journalViewRepository, times(threadCount)).save(any(JournalView.class));
    }
}
