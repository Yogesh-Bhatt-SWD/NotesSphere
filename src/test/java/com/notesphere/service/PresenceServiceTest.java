package com.notesphere.service;

import com.notesphere.dto.response.PresenceEvent;
import com.notesphere.dto.response.PresenceResponse;
import com.notesphere.entity.Friendship;
import com.notesphere.entity.PresenceBroadcastEvent;
import com.notesphere.entity.User;
import com.notesphere.entity.UserPresenceSession;
import com.notesphere.repository.FriendshipRepository;
import com.notesphere.repository.PresenceBroadcastEventRepository;
import com.notesphere.repository.UserPresenceSessionRepository;
import com.notesphere.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PresenceServiceTest {

    @Mock
    private UserPresenceSessionRepository presenceSessionRepository;

    @Mock
    private PresenceBroadcastEventRepository broadcastEventRepository;

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private PresenceService presenceService;

    private User userAlice;
    private User userBob;
    private User userCharlie;
    private Friendship friendshipAliceBob;

    @BeforeEach
    void setUp() {
        userAlice = User.builder()
                .id("user-alice")
                .username("alice")
                .email("alice@notesphere.io")
                .build();

        userBob = User.builder()
                .id("user-bob")
                .username("bob")
                .email("bob@notesphere.io")
                .build();

        userCharlie = User.builder()
                .id("user-charlie")
                .username("charlie")
                .email("charlie@notesphere.io")
                .build();

        friendshipAliceBob = Friendship.builder()
                .id("f-1")
                .userAId("user-alice")
                .userBId("user-bob")
                .build();
    }

    @Test
    @DisplayName("Scenario 1 & 2: User A connects (0 -> 1 session), becomes Online, broadcasts to friend B")
    void testUserConnectsBecomesOnline() {
        // Initially 0 sessions
        when(presenceSessionRepository.countByUserId("user-alice")).thenReturn(0L);
        when(friendshipRepository.findAllByUserId("user-alice")).thenReturn(List.of(friendshipAliceBob));

        presenceService.onSessionConnected("session-1", "user-alice");

        // Session saved
        verify(presenceSessionRepository).save(argThat(session ->
                session.getSessionId().equals("session-1") && session.getUserId().equals("user-alice")));

        // Broadcast sent to Bob's topic and Alice's topic
        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<PresenceEvent> eventCaptor = ArgumentCaptor.forClass(PresenceEvent.class);
        verify(messagingTemplate, atLeastOnce()).convertAndSend(topicCaptor.capture(), eventCaptor.capture());

        assertTrue(topicCaptor.getAllValues().contains("/topic/presence.friends.user-bob"));
        PresenceEvent event = eventCaptor.getAllValues().stream()
                .filter(e -> e.getUserId().equals("user-alice"))
                .findFirst()
                .orElse(null);

        assertNotNull(event);
        assertTrue(event.isOnline());
        assertNull(event.getLastSeenAt());

        // Also persisted to broadcast event table for cross-instance sync
        verify(broadcastEventRepository).save(any(PresenceBroadcastEvent.class));
    }

    @Test
    @DisplayName("Scenario 4: Multi-tab - opening second tab keeps user online without redundant offline event")
    void testMultiTabConnection() {
        // Tab 1 already connected (1 active session)
        when(presenceSessionRepository.countByUserId("user-alice")).thenReturn(1L);

        // Tab 2 connects
        presenceService.onSessionConnected("session-2", "user-alice");

        // Saved session-2
        verify(presenceSessionRepository).save(argThat(s -> s.getSessionId().equals("session-2")));

        // Since user was already online, no duplicate online broadcast
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(PresenceEvent.class));
    }

    @Test
    @DisplayName("Scenario 4 (cont): Closing Tab 1 while Tab 2 is active keeps user Online")
    void testCloseOneTabKeepsOnline() {
        // Session 1 and 2 exist in memory
        when(presenceSessionRepository.findById("session-1")).thenReturn(Optional.of(
                UserPresenceSession.builder().sessionId("session-1").userId("user-alice").build()));
        // After deleting session-1, 1 session (session-2) still remains
        when(presenceSessionRepository.countByUserId("user-alice")).thenReturn(1L);

        presenceService.onSessionDisconnected("session-1");

        verify(presenceSessionRepository).deleteById("session-1");

        // Remaining sessions > 0, so NO offline broadcast sent!
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(PresenceEvent.class));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Scenario 3: Closing last active tab marks user Offline with lastSeen timestamp")
    void testClosingLastTabMarksOffline() {
        when(presenceSessionRepository.findById("session-2")).thenReturn(Optional.of(
                UserPresenceSession.builder().sessionId("session-2").userId("user-alice").build()));
        // After deleting session-2, 0 sessions remain
        when(presenceSessionRepository.countByUserId("user-alice")).thenReturn(0L);
        when(userRepository.findById("user-alice")).thenReturn(Optional.of(userAlice));
        when(friendshipRepository.findAllByUserId("user-alice")).thenReturn(List.of(friendshipAliceBob));

        presenceService.onSessionDisconnected("session-2");

        verify(presenceSessionRepository).deleteById("session-2");

        // User lastSeenAt saved
        verify(userRepository).save(argThat(u -> u.getId().equals("user-alice") && u.getLastSeenAt() != null));

        // Offline event broadcast to Bob
        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<PresenceEvent> eventCaptor = ArgumentCaptor.forClass(PresenceEvent.class);
        verify(messagingTemplate, atLeastOnce()).convertAndSend(topicCaptor.capture(), eventCaptor.capture());

        assertTrue(topicCaptor.getAllValues().contains("/topic/presence.friends.user-bob"));
        PresenceEvent event = eventCaptor.getAllValues().stream()
                .filter(e -> e.getUserId().equals("user-alice"))
                .findFirst()
                .orElse(null);

        assertNotNull(event);
        assertFalse(event.isOnline());
        assertNotNull(event.getLastSeenAt());
    }

    @Test
    @DisplayName("Scenario 5: Heartbeat timeout cleanup purges dead connections and marks offline")
    void testCleanupExpiredSessions() {
        UserPresenceSession deadSession = UserPresenceSession.builder()
                .sessionId("dead-sess")
                .userId("user-alice")
                .lastHeartbeatAt(Instant.now().minusSeconds(60))
                .build();

        when(presenceSessionRepository.findExpiredSessions(any(Instant.class))).thenReturn(List.of(deadSession));
        when(presenceSessionRepository.countByUserId("user-alice")).thenReturn(0L);
        when(userRepository.findById("user-alice")).thenReturn(Optional.of(userAlice));
        when(friendshipRepository.findAllByUserId("user-alice")).thenReturn(List.of(friendshipAliceBob));

        presenceService.cleanupExpiredSessions();

        verify(presenceSessionRepository).deleteById("dead-sess");
        verify(userRepository).save(argThat(u -> u.getId().equals("user-alice") && u.getLastSeenAt() != null));
        verify(messagingTemplate, atLeastOnce()).convertAndSend(eq("/topic/presence.friends.user-bob"), any(PresenceEvent.class));
    }

    @Test
    @DisplayName("Scenario 6: Non-friend cannot access restricted presence information")
    void testNonFriendPresenceAccessDenied() {
        // Alice and Charlie are NOT friends
        when(friendshipRepository.areFriends("user-charlie", "user-alice")).thenReturn(false);

        // Charlie tries to check Alice's presence
        assertThrows(AccessDeniedException.class, () ->
                presenceService.getUserPresence("user-charlie", "user-alice")
        );
    }

    @Test
    @DisplayName("Friends list presence retrieval returns real statuses for accepted friends")
    void testGetFriendsPresenceSuccess() {
        when(friendshipRepository.findAllByUserId("user-alice")).thenReturn(List.of(friendshipAliceBob));
        when(presenceSessionRepository.findOnlineUserIds(Set.of("user-bob"))).thenReturn(Set.of("user-bob"));
        when(userRepository.findAllById(Set.of("user-bob"))).thenReturn(List.of(userBob));

        List<PresenceResponse> friendsPresence = presenceService.getFriendsPresence("user-alice");

        assertEquals(1, friendsPresence.size());
        assertEquals("user-bob", friendsPresence.get(0).getUserId());
        assertTrue(friendsPresence.get(0).isOnline());
    }
}
