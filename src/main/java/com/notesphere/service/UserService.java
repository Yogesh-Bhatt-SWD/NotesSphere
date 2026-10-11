package com.notesphere.service;

import com.notesphere.dto.request.ChangeEmailRequest;
import com.notesphere.dto.request.ChangePasswordRequest;
import com.notesphere.dto.request.DeleteAccountRequest;
import com.notesphere.dto.request.UpdatePreferencesRequest;
import com.notesphere.dto.request.UpdateProfileRequest;
import com.notesphere.dto.response.PagedResponse;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for user profile management, preferences, security, and account operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ReminderPreferenceRepository reminderRepository;
    private final JournalEntryRepository journalRepository;
    private final PostCommentRepository postCommentRepository;
    private final PostReactionRepository postReactionRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Get user profile by ID.
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return mapToUserResponse(user);
    }

    /**
     * Update user profile information.
     */
    @Transactional
    public UserResponse updateProfile(String userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (StringUtils.hasText(request.getUsername())) {
            String newUsername = request.getUsername().trim();
            if (!newUsername.equalsIgnoreCase(user.getUsername())) {
                if (userRepository.existsByUsername(newUsername)) {
                    throw new BadRequestException("Username '" + newUsername + "' is already taken");
                }
                user.setUsername(newUsername);
            }
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim().isEmpty() ? null : request.getAvatarUrl().trim());
        }

        if (request.getBio() != null) {
            user.setBio(request.getBio().trim());
        }

        if (StringUtils.hasText(request.getProfileLabel())) {
            user.setProfileLabel(request.getProfileLabel().trim());
        }

        if (request.getInterests() != null) {
            user.setInterests(new HashSet<>(request.getInterests()));
        }

        if (request.getLocation() != null) {
            user.setLocation(request.getLocation().trim());
        }

        if (request.getWebsite() != null) {
            user.setWebsite(request.getWebsite().trim());
        }

        if (request.getTwitterUrl() != null) {
            user.setTwitterUrl(request.getTwitterUrl().trim());
        }

        if (request.getGithubUrl() != null) {
            user.setGithubUrl(request.getGithubUrl().trim());
        }

        if (request.getLinkedinUrl() != null) {
            user.setLinkedinUrl(request.getLinkedinUrl().trim());
        }

        if (StringUtils.hasText(request.getNewPassword())) {
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        User updatedUser = userRepository.save(user);
        log.info("User profile updated successfully for userId: {}", userId);
        return mapToUserResponse(updatedUser);
    }

    /**
     * Update user app preferences, privacy toggles, and writing habits.
     */
    @Transactional
    public UserResponse updatePreferences(String userId, UpdatePreferencesRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (request.getProfilePublic() != null) {
            user.setProfilePublic(request.getProfilePublic());
        }
        if (request.getShowLocation() != null) {
            user.setShowLocation(request.getShowLocation());
        }
        if (request.getShowInterests() != null) {
            user.setShowInterests(request.getShowInterests());
        }
        if (request.getShowBio() != null) {
            user.setShowBio(request.getShowBio());
        }
        if (StringUtils.hasText(request.getDefaultJournalVisibility())) {
            user.setDefaultJournalVisibility(request.getDefaultJournalVisibility().trim().toUpperCase());
        }

        if (request.getNotifyFriendRequests() != null) {
            user.setNotifyFriendRequests(request.getNotifyFriendRequests());
        }
        if (request.getNotifyMessages() != null) {
            user.setNotifyMessages(request.getNotifyMessages());
        }
        if (request.getNotifyComments() != null) {
            user.setNotifyComments(request.getNotifyComments());
        }
        if (request.getNotifyReactions() != null) {
            user.setNotifyReactions(request.getNotifyReactions());
        }
        if (request.getNotifyCommunity() != null) {
            user.setNotifyCommunity(request.getNotifyCommunity());
        }

        if (request.getDailyWritingGoalWords() != null) {
            user.setDailyWritingGoalWords(request.getDailyWritingGoalWords());
        }
        if (StringUtils.hasText(request.getPreferredCategory())) {
            user.setPreferredCategory(request.getPreferredCategory().trim());
        }
        if (StringUtils.hasText(request.getThemePreference())) {
            user.setThemePreference(request.getThemePreference().trim().toLowerCase());
        }

        User updatedUser = userRepository.save(user);
        log.info("User preferences updated successfully for userId: {}", userId);
        return mapToUserResponse(updatedUser);
    }

    /**
     * Change password securely after validating current password.
     */
    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getPassword() != null) {
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new BadRequestException("Current password does not match");
            }
        }

        if (request.getCurrentPassword().equals(request.getNewPassword())) {
            throw new BadRequestException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed successfully for userId: {}", userId);
    }

    /**
     * Change user email address with password confirmation.
     */
    @Transactional
    public UserResponse changeEmail(String userId, ChangeEmailRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getPassword() != null) {
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new BadRequestException("Password confirmation failed");
            }
        }

        String newEmail = request.getNewEmail().trim().toLowerCase();
        if (newEmail.equalsIgnoreCase(user.getEmail())) {
            return mapToUserResponse(user);
        }

        if (userRepository.existsByEmail(newEmail)) {
            throw new BadRequestException("Email '" + newEmail + "' is already registered to another account");
        }

        user.setEmail(newEmail);
        User updated = userRepository.save(user);
        log.info("Email updated for userId: {} to {}", userId, newEmail);
        return mapToUserResponse(updated);
    }

    /**
     * Sign out of all active sessions by invalidating refresh tokens.
     */
    @Transactional
    public int signOutAllSessions(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        int activeSessions = refreshTokenRepository.countByUserIdAndRevokedFalse(userId);
        refreshTokenRepository.deleteByUserId(userId);
        log.info("Signed out all active sessions for userId: {} (cleared {} tokens)", userId, activeSessions);
        return activeSessions;
    }

    /**
     * Get count of active sessions for the user.
     */
    @Transactional(readOnly = true)
    public int getActiveSessionsCount(String userId) {
        return refreshTokenRepository.countByUserIdAndRevokedFalse(userId);
    }

    /**
     * Delete user account and cascade clean all related resources.
     */
    @Transactional
    public void deleteAccount(String userId, DeleteAccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getPassword() != null) {
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new BadRequestException("Password confirmation failed");
            }
        }

        if (request.getConfirmationText() != null &&
                !request.getConfirmationText().trim().equalsIgnoreCase("DELETE")) {
            throw new BadRequestException("Please enter 'DELETE' to confirm account deletion");
        }

        // Clean up user resources
        refreshTokenRepository.deleteByUserId(userId);
        reminderRepository.deleteByUserId(userId);
        postCommentRepository.deleteByUserId(userId);
        postReactionRepository.deleteByUserId(userId);

        List<JournalEntry> userJournals = journalRepository.findByUserIdOrderByCreatedAtAsc(userId);
        for (JournalEntry entry : userJournals) {
            postCommentRepository.deleteByJournalId(entry.getId());
            postReactionRepository.deleteByJournalId(entry.getId());
        }
        journalRepository.deleteAll(userJournals);

        friendRequestRepository.deleteByUserId(userId);
        friendshipRepository.deleteByUserId(userId);
        communityMemberRepository.deleteByUserId(userId);
        userRepository.delete(user);

        log.info("User {} and all associated data permanently deleted", userId);
    }

    /**
     * Admin: Get all users (unpaginated).
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    /**
     * Admin: Get all users with pagination.
     */
    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> getAllUsers(Pageable pageable) {
        Page<User> page = userRepository.findAll(pageable);
        List<UserResponse> content = page.getContent().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());

        return PagedResponse.<UserResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    /**
     * Admin: Delete user by ID.
     */
    @Transactional
    public void deleteUser(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }

        refreshTokenRepository.deleteByUserId(userId);
        reminderRepository.deleteByUserId(userId);
        postCommentRepository.deleteByUserId(userId);
        postReactionRepository.deleteByUserId(userId);

        List<JournalEntry> userJournals = journalRepository.findByUserIdOrderByCreatedAtAsc(userId);
        for (JournalEntry entry : userJournals) {
            postCommentRepository.deleteByJournalId(entry.getId());
            postReactionRepository.deleteByJournalId(entry.getId());
        }
        journalRepository.deleteAll(userJournals);

        friendRequestRepository.deleteByUserId(userId);
        friendshipRepository.deleteByUserId(userId);
        communityMemberRepository.deleteByUserId(userId);
        userRepository.deleteById(userId);

        log.info("User {} and all associated resources deleted by admin", userId);
    }

    public UserResponse mapToUserResponse(User user) {
        int activeSessions = 1;
        try {
            activeSessions = Math.max(1, refreshTokenRepository.countByUserIdAndRevokedFalse(user.getId()));
        } catch (Exception ignored) {
        }

        String displayName = StringUtils.hasText(user.getFullName()) ? user.getFullName() : user.getUsername();

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .name(displayName)
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .profileLabel(user.getProfileLabel())
                .interests(user.getInterests() != null ? user.getInterests() : new HashSet<>())
                .location(user.getLocation())
                .website(user.getWebsite())
                .twitterUrl(user.getTwitterUrl())
                .githubUrl(user.getGithubUrl())
                .linkedinUrl(user.getLinkedinUrl())
                .profilePublic(user.isProfilePublic())
                .showLocation(user.isShowLocation())
                .showInterests(user.isShowInterests())
                .showBio(user.isShowBio())
                .defaultJournalVisibility(user.getDefaultJournalVisibility())
                .notifyFriendRequests(user.isNotifyFriendRequests())
                .notifyMessages(user.isNotifyMessages())
                .notifyComments(user.isNotifyComments())
                .notifyReactions(user.isNotifyReactions())
                .notifyCommunity(user.isNotifyCommunity())
                .dailyWritingGoalWords(user.getDailyWritingGoalWords())
                .preferredCategory(user.getPreferredCategory())
                .themePreference(user.getThemePreference())
                .activeSessionsCount(activeSessions)
                .roles(user.getRoles())
                .provider(user.getProvider().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
