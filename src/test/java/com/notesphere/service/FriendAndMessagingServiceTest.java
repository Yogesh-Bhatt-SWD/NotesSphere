package com.notesphere.service;

import com.notesphere.dto.response.ConversationResponse;
import com.notesphere.dto.response.FriendRequestResponse;
import com.notesphere.dto.response.FriendResponse;
import com.notesphere.dto.response.MessageResponse;
import com.notesphere.entity.Conversation;
import com.notesphere.entity.FriendRequest;
import com.notesphere.entity.Friendship;
import com.notesphere.entity.Message;
import com.notesphere.entity.User;
import com.notesphere.entity.enums.FriendRequestStatus;
import com.notesphere.exception.BadRequestException;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.repository.ConversationRepository;
import com.notesphere.repository.FriendRequestRepository;
import com.notesphere.repository.FriendshipRepository;
import com.notesphere.repository.MessageRepository;
import com.notesphere.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FriendAndMessagingServiceTest {

    @Mock
    private FriendRequestRepository friendRequestRepository;

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private com.notesphere.repository.UserPresenceSessionRepository presenceSessionRepository;

    @InjectMocks
    private FriendRequestService friendRequestService;

    @InjectMocks
    private FriendshipService friendshipService;

    @InjectMocks
    private ConversationService conversationService;

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
    @DisplayName("Should prevent self-friend requests")
    void testSendSelfFriendRequestFails() {
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                friendRequestService.sendFriendRequest("user-alice", "user-alice"));
        assertTrue(ex.getMessage().contains("yourself"));
    }

    @Test
    @DisplayName("Should prevent friend request when already friends")
    void testSendFriendRequestAlreadyFriendsFails() {
        when(userRepository.findById("user-alice")).thenReturn(Optional.of(alice));
        when(userRepository.findById("user-bob")).thenReturn(Optional.of(bob));
        when(friendshipRepository.areFriends("user-alice", "user-bob")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                friendRequestService.sendFriendRequest("user-alice", "user-bob"));
        assertTrue(ex.getMessage().contains("already friends"));
    }

    @Test
    @DisplayName("Should prevent duplicate pending friend requests")
    void testSendDuplicateFriendRequestFails() {
        when(userRepository.findById("user-alice")).thenReturn(Optional.of(alice));
        when(userRepository.findById("user-bob")).thenReturn(Optional.of(bob));
        when(friendshipRepository.areFriends("user-alice", "user-bob")).thenReturn(false);

        FriendRequest existingPending = FriendRequest.builder()
                .id("req-1")
                .senderId("user-alice")
                .receiverId("user-bob")
                .status(FriendRequestStatus.PENDING)
                .build();

        when(friendRequestRepository.findPendingBetween("user-alice", "user-bob"))
                .thenReturn(Optional.of(existingPending));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                friendRequestService.sendFriendRequest("user-alice", "user-bob"));
        assertTrue(ex.getMessage().contains("already pending"));
    }

    @Test
    @DisplayName("Should send friend request successfully")
    void testSendFriendRequestSuccess() {
        when(userRepository.findById("user-alice")).thenReturn(Optional.of(alice));
        when(userRepository.findById("user-bob")).thenReturn(Optional.of(bob));
        when(friendshipRepository.areFriends("user-alice", "user-bob")).thenReturn(false);
        when(friendRequestRepository.findPendingBetween("user-alice", "user-bob")).thenReturn(Optional.empty());

        FriendRequest saved = FriendRequest.builder()
                .id("req-123")
                .senderId("user-alice")
                .receiverId("user-bob")
                .status(FriendRequestStatus.PENDING)
                .createdAt(Instant.now())
                .build();
        when(friendRequestRepository.save(any(FriendRequest.class))).thenReturn(saved);

        FriendRequestResponse response = friendRequestService.sendFriendRequest("user-alice", "user-bob");

        assertNotNull(response);
        assertEquals("user-alice", response.getSenderId());
        assertEquals("user-bob", response.getReceiverId());
        assertEquals(FriendRequestStatus.PENDING, response.getStatus());
        verify(friendRequestRepository).save(any(FriendRequest.class));
    }

    @Test
    @DisplayName("Should reject accept attempt by unauthorized user")
    void testAcceptFriendRequestUnauthorizedFails() {
        FriendRequest request = FriendRequest.builder()
                .id("req-1")
                .senderId("user-alice")
                .receiverId("user-bob")
                .status(FriendRequestStatus.PENDING)
                .build();

        when(friendRequestRepository.findById("req-1")).thenReturn(Optional.of(request));

        assertThrows(AccessDeniedException.class, () ->
                friendRequestService.acceptFriendRequest("user-charlie", "req-1"));
    }

    @Test
    @DisplayName("Should accept friend request and create canonical friendship")
    void testAcceptFriendRequestSuccess() {
        FriendRequest request = FriendRequest.builder()
                .id("req-1")
                .senderId("user-bob")
                .receiverId("user-alice")
                .status(FriendRequestStatus.PENDING)
                .build();

        when(friendRequestRepository.findById("req-1")).thenReturn(Optional.of(request));
        when(friendshipRepository.areFriends("user-alice", "user-bob")).thenReturn(false);
        when(userRepository.findById("user-bob")).thenReturn(Optional.of(bob));

        FriendResponse response = friendRequestService.acceptFriendRequest("user-alice", "req-1");

        assertEquals(FriendRequestStatus.ACCEPTED, request.getStatus());
        assertEquals("user-bob", response.getFriendId());
        verify(friendshipRepository).save(argThat(f ->
                f.getUserAId().compareTo(f.getUserBId()) < 0));
    }

    @Test
    @DisplayName("Should reject friend request only by receiver")
    void testRejectFriendRequestSuccess() {
        FriendRequest request = FriendRequest.builder()
                .id("req-1")
                .senderId("user-alice")
                .receiverId("user-bob")
                .status(FriendRequestStatus.PENDING)
                .build();

        when(friendRequestRepository.findById("req-1")).thenReturn(Optional.of(request));

        friendRequestService.rejectFriendRequest("user-bob", "req-1");
        assertEquals(FriendRequestStatus.REJECTED, request.getStatus());
    }

    @Test
    @DisplayName("Should cancel pending request only by sender")
    void testCancelFriendRequestSuccess() {
        FriendRequest request = FriendRequest.builder()
                .id("req-1")
                .senderId("user-alice")
                .receiverId("user-bob")
                .status(FriendRequestStatus.PENDING)
                .build();

        when(friendRequestRepository.findById("req-1")).thenReturn(Optional.of(request));

        friendRequestService.cancelFriendRequest("user-alice", "req-1");
        verify(friendRequestRepository).delete(request);
    }

    @Test
    @DisplayName("Should prevent conversation between non-friends")
    void testCreateConversationNonFriendsFails() {
        when(friendshipRepository.areFriends("user-alice", "user-bob")).thenReturn(false);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                conversationService.getOrCreateConversation("user-alice", "user-bob"));
        assertTrue(ex.getMessage().contains("accepted friends"));
    }

    @Test
    @DisplayName("Should get or create canonical conversation between friends")
    void testCreateConversationSuccess() {
        when(friendshipRepository.areFriends("user-alice", "user-bob")).thenReturn(true);
        when(conversationRepository.findBetween("user-alice", "user-bob")).thenReturn(Optional.empty());

        Conversation saved = Conversation.createCanonical("user-alice", "user-bob");
        saved.setId("convo-1");
        saved.setCreatedAt(Instant.now());

        when(conversationRepository.save(any(Conversation.class))).thenReturn(saved);
        when(userRepository.findById("user-bob")).thenReturn(Optional.of(bob));
        when(messageRepository.countUnreadMessages("convo-1", "user-alice")).thenReturn(0L);

        ConversationResponse response = conversationService.getOrCreateConversation("user-alice", "user-bob");

        assertNotNull(response);
        assertEquals("user-bob", response.getFriendId());
        verify(conversationRepository).save(argThat(c ->
                c.getUserAId().compareTo(c.getUserBId()) < 0));
    }

    @Test
    @DisplayName("Should deny access to unauthorized conversation messages")
    void testGetMessagesUnauthorizedFails() {
        Conversation convo = Conversation.createCanonical("user-alice", "user-bob");
        convo.setId("convo-1");

        when(conversationRepository.findById("convo-1")).thenReturn(Optional.of(convo));

        assertThrows(AccessDeniedException.class, () ->
                conversationService.getMessages("user-charlie", "convo-1", 0, 20));
    }

    @Test
    @DisplayName("Should save message and update conversation metadata")
    void testSaveMessageSuccess() {
        Conversation convo = Conversation.createCanonical("user-alice", "user-bob");
        convo.setId("convo-1");

        when(conversationRepository.findById("convo-1")).thenReturn(Optional.of(convo));
        when(friendshipRepository.areFriends("user-alice", "user-bob")).thenReturn(true);
        when(userRepository.findById("user-alice")).thenReturn(Optional.of(alice));

        Message savedMsg = Message.builder()
                .id("msg-1")
                .conversationId("convo-1")
                .senderId("user-alice")
                .content("Hello Bob!")
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        when(messageRepository.save(any(Message.class))).thenReturn(savedMsg);

        MessageResponse response = conversationService.saveMessage("user-alice", "convo-1", "Hello Bob!");

        assertNotNull(response);
        assertEquals("msg-1", response.getId());
        assertEquals("Hello Bob!", response.getContent());
        assertEquals("Hello Bob!", convo.getLastMessageContent());
        verify(conversationRepository).save(convo);
    }

    @Test
    @DisplayName("Should mark conversation messages as read")
    void testMarkAsReadSuccess() {
        Conversation convo = Conversation.createCanonical("user-alice", "user-bob");
        convo.setId("convo-1");

        when(conversationRepository.findById("convo-1")).thenReturn(Optional.of(convo));
        when(messageRepository.markConversationMessagesAsRead(eq("convo-1"), eq("user-alice"), any(Instant.class)))
                .thenReturn(3);

        assertDoesNotThrow(() ->
                conversationService.markConversationAsRead("user-alice", "convo-1"));
        verify(messageRepository).markConversationMessagesAsRead(eq("convo-1"), eq("user-alice"), any(Instant.class));
    }
}
