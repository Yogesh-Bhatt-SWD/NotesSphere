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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Base64;
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

    @Value("${notesphere.upload.avatar-dir:}")
    private String configuredAvatarDir;

    private Path getAvatarDirectory() {
        Path dir;
        if (StringUtils.hasText(configuredAvatarDir)) {
            dir = Paths.get(configuredAvatarDir);
        } else {
            Path optDir = Paths.get("/opt/notesphere/uploads/avatars");
            try {
                if (Files.exists(optDir) || (optDir.getParent() != null && Files.isWritable(optDir.getParent()))) {
                    dir = optDir;
                } else {
                    dir = Paths.get(System.getProperty("user.home"), ".notesphere", "uploads", "avatars");
                }
            } catch (Exception e) {
                dir = Paths.get(System.getProperty("user.home"), ".notesphere", "uploads", "avatars");
            }
        }
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            log.warn("Could not create avatar directory {}: {}", dir, e.getMessage());
        }
        return dir;
    }

    private void saveBytesToDisk(String userId, byte[] bytes) {
        if (bytes == null || bytes.length == 0) return;
        try {
            Path avatarPath = getAvatarDirectory().resolve(userId + ".jpg");
            Files.write(avatarPath, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            log.debug("Saved avatar file to disk: {}", avatarPath);
        } catch (Exception e) {
            log.warn("Failed to save avatar file to disk for user {}: {}", userId, e.getMessage());
        }
    }

    private void saveBase64AvatarToDisk(String userId, String dataUrl) {
        if (!StringUtils.hasText(dataUrl) || !dataUrl.startsWith("data:image/")) return;
        int commaIdx = dataUrl.indexOf(',');
        if (commaIdx != -1) {
            try {
                byte[] bytes = Base64.getDecoder().decode(dataUrl.substring(commaIdx + 1));
                saveBytesToDisk(userId, bytes);
            } catch (Exception ignored) {
            }
        }
    }

    private void deleteAvatarFromDisk(String userId) {
        try {
            Path avatarPath = getAvatarDirectory().resolve(userId + ".jpg");
            Files.deleteIfExists(avatarPath);
        } catch (Exception e) {
            log.warn("Failed to delete avatar file from disk for user {}: {}", userId, e.getMessage());
        }
    }

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
     * Upload and persist user avatar image (from multipart file or base64 data URL).
     */
    @Transactional
    public UserResponse uploadAvatar(String userId, MultipartFile file, String dataUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        byte[] imageBytes = null;
        String contentType = "image/jpeg";

        if (file != null && !file.isEmpty()) {
            if (file.getSize() > 10 * 1024 * 1024) {
                throw new BadRequestException("Avatar image file must be under 10MB");
            }
            String ct = file.getContentType();
            if (ct != null && !ct.startsWith("image/")) {
                throw new BadRequestException("Uploaded file must be a valid image");
            }
            try {
                imageBytes = file.getBytes();
                if (ct != null) contentType = ct;
            } catch (IOException e) {
                log.error("Failed to read uploaded avatar file bytes for user {}", userId, e);
                throw new BadRequestException("Failed to process uploaded image file");
            }
        } else if (StringUtils.hasText(dataUrl)) {
            String trimmed = dataUrl.trim();
            if (trimmed.startsWith("data:image/")) {
                int commaIdx = trimmed.indexOf(',');
                if (commaIdx != -1) {
                    String meta = trimmed.substring(0, commaIdx);
                    if (meta.contains("image/png")) {
                        contentType = "image/png";
                    } else if (meta.contains("image/webp")) {
                        contentType = "image/webp";
                    }
                    try {
                        imageBytes = Base64.getDecoder().decode(trimmed.substring(commaIdx + 1));
                    } catch (IllegalArgumentException e) {
                        throw new BadRequestException("Invalid base64 image data");
                    }
                }
            } else {
                user.setAvatarUrl(trimmed);
                User saved = userRepository.save(user);
                return mapToUserResponse(saved);
            }
        } else {
            throw new BadRequestException("No image file or image data provided");
        }

        if (imageBytes != null && imageBytes.length > 0) {
            saveBytesToDisk(userId, imageBytes);

            if (StringUtils.hasText(dataUrl) && dataUrl.startsWith("data:image/") && dataUrl.length() <= 300_000) {
                user.setAvatarUrl(dataUrl);
            } else {
                String base64Prefix = "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(imageBytes);
                if (base64Prefix.length() <= 300_000) {
                    user.setAvatarUrl(base64Prefix);
                } else {
                    user.setAvatarUrl("/api/users/" + userId + "/avatar?v=" + System.currentTimeMillis());
                }
            }
        }

        User savedUser = userRepository.save(user);
        log.info("Avatar updated successfully for user: {}", userId);
        return mapToUserResponse(savedUser);
    }

    /**
     * Delete user profile avatar.
     */
    @Transactional
    public UserResponse deleteAvatar(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setAvatarUrl(null);
        deleteAvatarFromDisk(userId);

        User savedUser = userRepository.save(user);
        log.info("Avatar removed successfully for user: {}", userId);
        return mapToUserResponse(savedUser);
    }

    /**
     * Get raw avatar image bytes for user.
     */
    @Transactional(readOnly = true)
    public byte[] getAvatarBytes(String userId) {
        Path avatarPath = getAvatarDirectory().resolve(userId + ".jpg");
        if (Files.exists(avatarPath)) {
            try {
                return Files.readAllBytes(avatarPath);
            } catch (IOException e) {
                log.warn("Failed to read avatar from disk for user {}: {}", userId, e.getMessage());
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (StringUtils.hasText(user.getAvatarUrl()) && user.getAvatarUrl().startsWith("data:image/")) {
            int commaIdx = user.getAvatarUrl().indexOf(',');
            if (commaIdx != -1) {
                try {
                    byte[] bytes = Base64.getDecoder().decode(user.getAvatarUrl().substring(commaIdx + 1));
                    saveBytesToDisk(userId, bytes);
                    return bytes;
                } catch (IllegalArgumentException ignored) {
                }
            }
        }

        throw new ResourceNotFoundException("Avatar", "userId", userId);
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
            String newAvatar = request.getAvatarUrl().trim();
            if (newAvatar.isEmpty()) {
                user.setAvatarUrl(null);
                deleteAvatarFromDisk(userId);
            } else {
                user.setAvatarUrl(newAvatar);
                if (newAvatar.startsWith("data:image/")) {
                    saveBase64AvatarToDisk(userId, newAvatar);
                }
            }
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
