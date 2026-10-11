package com.notesphere.service;

import com.notesphere.dto.request.ChangeEmailRequest;
import com.notesphere.dto.request.ChangePasswordRequest;
import com.notesphere.dto.request.DeleteAccountRequest;
import com.notesphere.dto.request.UpdatePreferencesRequest;
import com.notesphere.dto.request.UpdateProfileRequest;
import com.notesphere.dto.response.UserResponse;
import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.User;
import com.notesphere.exception.BadRequestException;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.repository.CommunityMemberRepository;
import com.notesphere.repository.FriendRequestRepository;
import com.notesphere.repository.FriendshipRepository;
import com.notesphere.repository.JournalEntryRepository;
import com.notesphere.repository.PostCommentRepository;
import com.notesphere.repository.PostReactionRepository;
import com.notesphere.repository.RefreshTokenRepository;
import com.notesphere.repository.ReminderPreferenceRepository;
import com.notesphere.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private ReminderPreferenceRepository reminderRepository;

    @Mock
    private JournalEntryRepository journalRepository;

    @Mock
    private PostCommentRepository postCommentRepository;

    @Mock
    private PostReactionRepository postReactionRepository;

    @Mock
    private FriendRequestRepository friendRequestRepository;

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private CommunityMemberRepository communityMemberRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user-1")
                .username("testwriter")
                .fullName("Test Writer")
                .email("writer@notesphere.io")
                .password("encoded_pass")
                .profileLabel("Storyteller")
                .bio("Writing thoughts daily.")
                .interests(Set.of("Mindfulness", "Fiction"))
                .location("San Francisco, CA")
                .website("https://writer.io")
                .twitterUrl("https://twitter.com/writer")
                .githubUrl("https://github.com/writer")
                .linkedinUrl("https://linkedin.com/in/writer")
                .profilePublic(true)
                .showLocation(true)
                .showInterests(true)
                .showBio(true)
                .defaultJournalVisibility("PRIVATE")
                .notifyFriendRequests(true)
                .notifyMessages(true)
                .notifyComments(true)
                .notifyReactions(true)
                .notifyCommunity(true)
                .dailyWritingGoalWords(750)
                .preferredCategory("Fiction")
                .themePreference("light")
                .createdAt(Instant.now())
                .build();
    }

    @Test
    void getUserById_Success() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
        when(refreshTokenRepository.countByUserIdAndRevokedFalse("user-1")).thenReturn(2);

        UserResponse response = userService.getUserById("user-1");

        assertNotNull(response);
        assertEquals("user-1", response.getId());
        assertEquals("testwriter", response.getUsername());
        assertEquals("Test Writer", response.getFullName());
        assertEquals(2, response.getActiveSessionsCount());
    }

    @Test
    void getUserById_NotFound_ThrowsException() {
        when(userRepository.findById("non-existent")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.getUserById("non-existent"));
    }

    @Test
    void updateProfile_Success() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Arthur Pendelton")
                .bio("Updated bio content")
                .profileLabel("Creator")
                .interests(Set.of("Coding", "Art"))
                .location("New York, NY")
                .website("https://arthur.dev")
                .build();

        UserResponse response = userService.updateProfile("user-1", request);

        assertNotNull(response);
        assertEquals("Arthur Pendelton", response.getFullName());
        assertEquals("Updated bio content", response.getBio());
        assertEquals("Creator", response.getProfileLabel());
        assertTrue(response.getInterests().contains("Coding"));
        assertEquals("New York, NY", response.getLocation());
    }

    @Test
    void updateProfile_UsernameCollision_ThrowsBadRequest() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
        when(userRepository.existsByUsername("taken_user")).thenReturn(true);

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .username("taken_user")
                .build();

        assertThrows(BadRequestException.class, () -> userService.updateProfile("user-1", request));
    }

    @Test
    void updatePreferences_Success() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UpdatePreferencesRequest request = UpdatePreferencesRequest.builder()
                .profilePublic(false)
                .showLocation(false)
                .defaultJournalVisibility("COMMUNITY")
                .dailyWritingGoalWords(1200)
                .preferredCategory("Mindfulness")
                .themePreference("dark")
                .build();

        UserResponse response = userService.updatePreferences("user-1", request);

        assertNotNull(response);
        assertFalse(response.isProfilePublic());
        assertFalse(response.isShowLocation());
        assertEquals("COMMUNITY", response.getDefaultJournalVisibility());
        assertEquals(1200, response.getDailyWritingGoalWords());
        assertEquals("dark", response.getThemePreference());
    }

    @Test
    void changePassword_ValidCurrentPassword_Success() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("OldPassword123", "encoded_pass")).thenReturn(true);
        when(passwordEncoder.encode("NewSecretPassword456")).thenReturn("new_encoded_pass");

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPassword123")
                .newPassword("NewSecretPassword456")
                .build();

        userService.changePassword("user-1", request);

        verify(userRepository).save(argThat(u -> "new_encoded_pass".equals(u.getPassword())));
    }

    @Test
    void changePassword_WrongCurrentPassword_ThrowsBadRequest() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("WrongPassword", "encoded_pass")).thenReturn(false);

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("WrongPassword")
                .newPassword("NewSecretPassword456")
                .build();

        assertThrows(BadRequestException.class, () -> userService.changePassword("user-1", request));
    }

    @Test
    void changeEmail_Success() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("Pass123", "encoded_pass")).thenReturn(true);
        when(userRepository.existsByEmail("newemail@notesphere.io")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        ChangeEmailRequest request = ChangeEmailRequest.builder()
                .password("Pass123")
                .newEmail("newemail@notesphere.io")
                .build();

        UserResponse response = userService.changeEmail("user-1", request);

        assertNotNull(response);
        assertEquals("newemail@notesphere.io", response.getEmail());
    }

    @Test
    void changeEmail_AlreadyInUse_ThrowsBadRequest() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("Pass123", "encoded_pass")).thenReturn(true);
        when(userRepository.existsByEmail("taken@notesphere.io")).thenReturn(true);

        ChangeEmailRequest request = ChangeEmailRequest.builder()
                .password("Pass123")
                .newEmail("taken@notesphere.io")
                .build();

        assertThrows(BadRequestException.class, () -> userService.changeEmail("user-1", request));
    }

    @Test
    void signOutAllSessions_DeletesRefreshTokens() {
        when(userRepository.existsById("user-1")).thenReturn(true);
        when(refreshTokenRepository.countByUserIdAndRevokedFalse("user-1")).thenReturn(3);

        int cleared = userService.signOutAllSessions("user-1");

        assertEquals(3, cleared);
        verify(refreshTokenRepository).deleteByUserId("user-1");
    }

    @Test
    void deleteAccount_Success_CascadesAllResources() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("Pass123", "encoded_pass")).thenReturn(true);

        JournalEntry j1 = JournalEntry.builder().id("j1").userId("user-1").build();
        when(journalRepository.findByUserIdOrderByCreatedAtAsc("user-1")).thenReturn(List.of(j1));

        DeleteAccountRequest request = DeleteAccountRequest.builder()
                .password("Pass123")
                .confirmationText("DELETE")
                .build();

        userService.deleteAccount("user-1", request);

        verify(refreshTokenRepository).deleteByUserId("user-1");
        verify(reminderRepository).deleteByUserId("user-1");
        verify(postCommentRepository).deleteByUserId("user-1");
        verify(postReactionRepository).deleteByUserId("user-1");
        verify(postCommentRepository).deleteByJournalId("j1");
        verify(postReactionRepository).deleteByJournalId("j1");
        verify(journalRepository).deleteAll(anyList());
        verify(friendRequestRepository).deleteByUserId("user-1");
        verify(friendshipRepository).deleteByUserId("user-1");
        verify(communityMemberRepository).deleteByUserId("user-1");
        verify(userRepository).delete(testUser);
    }

    @Test
    void deleteAccount_WrongPassword_ThrowsBadRequest() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("BadPassword", "encoded_pass")).thenReturn(false);

        DeleteAccountRequest request = DeleteAccountRequest.builder()
                .password("BadPassword")
                .confirmationText("DELETE")
                .build();

        assertThrows(BadRequestException.class, () -> userService.deleteAccount("user-1", request));
    }

    @Test
    void deleteAccount_WrongConfirmationText_ThrowsBadRequest() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("Pass123", "encoded_pass")).thenReturn(true);

        DeleteAccountRequest request = DeleteAccountRequest.builder()
                .password("Pass123")
                .confirmationText("CONFIRM") // must be DELETE
                .build();

        assertThrows(BadRequestException.class, () -> userService.deleteAccount("user-1", request));
    }
}
