package com.notesphere.security;

import com.notesphere.dto.request.JournalRequest;
import com.notesphere.entity.JournalEntry;
import com.notesphere.repository.JournalEntryRepository;
import com.notesphere.service.JournalService;
import com.notesphere.service.SentimentAnalysisService;
import com.notesphere.service.TaggingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

/**
 * Verifies Broken Object-Level Authorization (BOLA) defenses:
 * Confirms that User A cannot read, update, delete, favorite, or pin User B's journal entries.
 */
@ExtendWith(MockitoExtension.class)
public class JournalObjectLevelAuthorizationTest {

    @Mock
    private JournalEntryRepository journalRepository;

    @Mock
    private SentimentAnalysisService sentimentAnalysisService;

    @Mock
    private TaggingService taggingService;

    @InjectMocks
    private JournalService journalService;

    private JournalEntry userBJournal;

    @BeforeEach
    void setUp() {
        // Journal entry belonging strictly to userB
        userBJournal = JournalEntry.builder()
                .id("journal-b-100")
                .userId("userB")
                .title("User B Private Thoughts")
                .content("Confidential content that User A must never access")
                .build();
    }

    @Test
    void userA_CannotRead_UserB_Journal() {
        when(journalRepository.findById("journal-b-100")).thenReturn(Optional.of(userBJournal));

        // User A attempts to access User B's journal
        assertThrows(AccessDeniedException.class,
                () -> journalService.getJournalById("userA", "journal-b-100"));
    }

    @Test
    void userA_CannotUpdate_UserB_Journal() {
        when(journalRepository.findById("journal-b-100")).thenReturn(Optional.of(userBJournal));

        JournalRequest updateReq = JournalRequest.builder()
                .title("Hacked Title")
                .content("Overwritten Content")
                .build();

        assertThrows(AccessDeniedException.class,
                () -> journalService.updateJournal("userA", "journal-b-100", updateReq));

        verify(journalRepository, never()).save(any(JournalEntry.class));
    }

    @Test
    void userA_CannotDelete_UserB_Journal() {
        when(journalRepository.findById("journal-b-100")).thenReturn(Optional.of(userBJournal));

        assertThrows(AccessDeniedException.class,
                () -> journalService.deleteJournal("userA", "journal-b-100"));

        verify(journalRepository, never()).delete(any(JournalEntry.class));
    }

    @Test
    void userA_CannotToggleFavorite_UserB_Journal() {
        when(journalRepository.findById("journal-b-100")).thenReturn(Optional.of(userBJournal));

        assertThrows(AccessDeniedException.class,
                () -> journalService.toggleFavorite("userA", "journal-b-100"));

        verify(journalRepository, never()).save(any(JournalEntry.class));
    }

    @Test
    void userA_CannotTogglePin_UserB_Journal() {
        when(journalRepository.findById("journal-b-100")).thenReturn(Optional.of(userBJournal));

        assertThrows(AccessDeniedException.class,
                () -> journalService.togglePinned("userA", "journal-b-100"));

        verify(journalRepository, never()).save(any(JournalEntry.class));
    }
}
