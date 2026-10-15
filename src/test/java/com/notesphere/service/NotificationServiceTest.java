package com.notesphere.service;

import com.notesphere.dto.response.NotificationResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.entity.*;
import com.notesphere.entity.enums.JournalVisibility;
import com.notesphere.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private CommunityMemberRepository communityMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationService notificationService;

    private User alice;
    private User bob;
    private User charlie;

    @BeforeEach
    void setUp() {
        alice = User.builder().id("user-alice").username("alice").email("alice@test.com").build();
        bob = User.builder().id("user-bob").username("bob").email("bob@test.com").build();
        charlie = User.builder().id("user-charlie").username("charlie").email("charlie@test.com").build();
    }

    @Test
    @DisplayName("Scenario 7: A friend publishes a public journal: eligible accepted friends receive a notification")
    void testNotifyJournalPublished_PublicJournal_NotifiesFriends() {
        JournalEntry journal = JournalEntry.builder()
                .id("j-101")
                .userId(alice.getId())
                .title("My Trip to the Mountains")
                .slug("my-trip-to-the-mountains-j101")
                .visibility(JournalVisibility.PUBLIC)
                .publishedAt(Instant.now())
                .build();

        Friendship friendship = Friendship.builder()
                .id("f-1")
                .userAId(alice.getId())
                .userBId(bob.getId())
                .build();

        when(friendshipRepository.findAllByUserId(alice.getId())).thenReturn(List.of(friendship));
        when(notificationRepository.existsByUserIdAndTypeAndTargetId(bob.getId(), "JOURNAL_PUBLISHED", journal.getId()))
                .thenReturn(false);
        when(notificationRepository.countByUserIdAndIsReadFalse(bob.getId())).thenReturn(1L);
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification n = invocation.getArgument(0);
            n.setId("notif-101");
            return n;
        });

        notificationService.notifyJournalPublished(journal, alice);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(1)).save(captor.capture());
        Notification saved = captor.getValue();
        assertEquals(bob.getId(), saved.getUserId());
        assertEquals("JOURNAL_PUBLISHED", saved.getType());
        assertTrue(saved.getMessage().contains("alice published a new journal"));
        assertEquals("/blogs/my-trip-to-the-mountains-j101", saved.getTargetUrl());
        assertFalse(saved.isRead());

        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/notifications." + bob.getId()), any(Object.class));
    }

    @Test
    @DisplayName("Scenario 8: Private journals and drafts do not trigger public friend notifications")
    void testNotifyJournalPublished_PrivateOrDraft_DoesNotNotify() {
        JournalEntry privateJournal = JournalEntry.builder()
                .id("j-priv")
                .userId(alice.getId())
                .title("My Secret Journal")
                .visibility(JournalVisibility.PRIVATE)
                .publishedAt(null)
                .build();

        notificationService.notifyJournalPublished(privateJournal, alice);

        verifyNoInteractions(friendshipRepository);
        verifyNoInteractions(notificationRepository);
        verifyNoInteractions(messagingTemplate);
    }

    @Test
    @DisplayName("Scenario 11: Repeated events and edits do not create duplicate notifications or inflate counts")
    void testNotifyJournalPublished_DeduplicationOnRepeatedEvent() {
        JournalEntry journal = JournalEntry.builder()
                .id("j-dup")
                .userId(alice.getId())
                .title("Repeated Publication")
                .visibility(JournalVisibility.PUBLIC)
                .publishedAt(Instant.now())
                .build();

        Friendship friendship = Friendship.builder()
                .id("f-1")
                .userAId(alice.getId())
                .userBId(bob.getId())
                .build();

        when(friendshipRepository.findAllByUserId(alice.getId())).thenReturn(List.of(friendship));
        // Already notified bob previously
        when(notificationRepository.existsByUserIdAndTypeAndTargetId(bob.getId(), "JOURNAL_PUBLISHED", journal.getId()))
                .thenReturn(true);

        notificationService.notifyJournalPublished(journal, alice);

        // Should not save a duplicate notification
        verify(notificationRepository, never()).save(any(Notification.class));
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }

    @Test
    @DisplayName("Scenario 13: Community-only journal only notifies community members")
    void testNotifyJournalPublished_CommunityJournal_OnlyNotifiesCommunityMembers() {
        JournalEntry commJournal = JournalEntry.builder()
                .id("j-comm")
                .userId(alice.getId())
                .title("Writers Guild Prompt")
                .visibility(JournalVisibility.COMMUNITY)
                .communityId("comm-writers")
                .publishedAt(Instant.now())
                .build();

        CommunityMember bobMember = CommunityMember.builder()
                .id("cm-1")
                .communityId("comm-writers")
                .userId(bob.getId())
                .build();

        when(communityMemberRepository.findByCommunityId("comm-writers")).thenReturn(List.of(bobMember));
        when(notificationRepository.existsByUserIdAndTypeAndTargetId(bob.getId(), "JOURNAL_PUBLISHED", commJournal.getId()))
                .thenReturn(false);
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        notificationService.notifyJournalPublished(commJournal, alice);

        verify(notificationRepository, times(1)).save(any(Notification.class));
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/notifications." + bob.getId()), any(Object.class));
    }

    @Test
    @DisplayName("Scenario 10: Mark-as-read updates persist across devices or sessions")
    void testMarkAsRead_PersistsReadState() {
        when(notificationRepository.markAsRead(eq("notif-1"), eq(bob.getId()), any(Instant.class))).thenReturn(1);

        notificationService.markAsRead(bob.getId(), "notif-1");

        verify(notificationRepository, times(1)).markAsRead(eq("notif-1"), eq(bob.getId()), any(Instant.class));
    }

    @Test
    @DisplayName("Scenario 10 (b): Mark all as read updates all unread notifications for user")
    void testMarkAllAsRead_PersistsAll() {
        when(notificationRepository.markAllAsRead(eq(bob.getId()), any(Instant.class))).thenReturn(3);

        notificationService.markAllAsRead(bob.getId());

        verify(notificationRepository, times(1)).markAllAsRead(eq(bob.getId()), any(Instant.class));
    }

    @Test
    @DisplayName("Scenario 12: Unauthorized users cannot read or modify another user's notifications")
    void testGetNotifications_ScopedStrictlyToUser() {
        Notification notif = Notification.builder()
                .id("notif-bob")
                .userId(bob.getId())
                .type("JOURNAL_PUBLISHED")
                .title("Bob's Notification")
                .message("Message for Bob")
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(bob.getId()), any()))
                .thenReturn(new PageImpl<>(List.of(notif), PageRequest.of(0, 20), 1));

        PagedResponse<NotificationResponse> result = notificationService.getNotifications(bob.getId(), 0, 20);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("notif-bob", result.getContent().get(0).getId());

        // Verify that query was called with bob.getId(), preventing access to charlie's notifications
        verify(notificationRepository).findByUserIdOrderByCreatedAtDesc(eq(bob.getId()), any());
    }
}
