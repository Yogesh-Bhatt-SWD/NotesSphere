package com.notesphere.service;

import com.notesphere.dto.response.FriendRequestResponse;
import com.notesphere.dto.response.FriendResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.dto.response.UserProfileResponse;
import com.notesphere.entity.FriendRequest;
import com.notesphere.entity.Friendship;
import com.notesphere.entity.User;
import com.notesphere.entity.enums.FriendRequestStatus;
import com.notesphere.entity.enums.FriendshipStatus;
import com.notesphere.exception.BadRequestException;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.repository.FriendRequestRepository;
import com.notesphere.repository.FriendshipRepository;
import com.notesphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.*;
import com.notesphere.dto.response.InAppNotification;
import com.notesphere.entity.enums.JournalVisibility;
import com.notesphere.repository.JournalEntryRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.util.stream.Collectors;

/**
 * Service managing user discovery, profile retrieval, and friend requests lifecycle.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FriendRequestService {

    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final JournalEntryRepository journalRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;


    /**
     * Send a friend request from sender to receiver.
     */
    @Transactional
    public FriendRequestResponse sendFriendRequest(String senderId, String receiverId) {
        if (senderId.equals(receiverId)) {
            throw new BadRequestException("You cannot send a friend request to yourself");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", receiverId));

        if (friendshipRepository.areFriends(senderId, receiverId)) {
            throw new BadRequestException("You are already friends with " + receiver.getUsername());
        }

        Optional<FriendRequest> pending = friendRequestRepository.findPendingBetween(senderId, receiverId);
        if (pending.isPresent()) {
            if (pending.get().getSenderId().equals(senderId)) {
                throw new BadRequestException("A friend request to this user is already pending");
            } else {
                throw new BadRequestException("This user has already sent you a friend request. Please accept it instead.");
            }
        }

        FriendRequest request = FriendRequest.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .status(FriendRequestStatus.PENDING)
                .build();

        request = friendRequestRepository.save(request);
        log.info("Friend request sent from {} to {}", sender.getUsername(), receiver.getUsername());

        try {
            notificationService.notifyFriendRequest(
                    receiverId,
                    "FRIEND_REQUEST_RECEIVED",
                    "New Friend Request",
                    sender.getUsername() + " wants to connect with you",
                    sender,
                    request.getId()
            );
        } catch (Exception ex) {
            log.warn("Could not dispatch friend request notification: {}", ex.getMessage());
        }

        return mapToFriendRequestResponse(request, sender.getUsername(), receiver.getUsername());
    }

    /**
     * Get pending friend requests received by the user.
     */
    @Transactional(readOnly = true)
    public List<FriendRequestResponse> getIncomingRequests(String userId) {
        List<FriendRequest> requests = friendRequestRepository
                .findByReceiverIdAndStatusOrderByCreatedAtDesc(userId, FriendRequestStatus.PENDING);

        if (requests.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> senderIds = requests.stream().map(FriendRequest::getSenderId).collect(Collectors.toSet());
        Map<String, String> usernameMap = userRepository.findAllById(senderIds).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));

        User receiver = userRepository.findById(userId).orElse(null);
        String receiverName = receiver != null ? receiver.getUsername() : "";

        return requests.stream()
                .map(r -> mapToFriendRequestResponse(r, usernameMap.getOrDefault(r.getSenderId(), "Unknown"), receiverName))
                .collect(Collectors.toList());
    }

    /**
     * Get pending friend requests sent by the user.
     */
    @Transactional(readOnly = true)
    public List<FriendRequestResponse> getOutgoingRequests(String userId) {
        List<FriendRequest> requests = friendRequestRepository
                .findBySenderIdAndStatusOrderByCreatedAtDesc(userId, FriendRequestStatus.PENDING);

        if (requests.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> receiverIds = requests.stream().map(FriendRequest::getReceiverId).collect(Collectors.toSet());
        Map<String, String> usernameMap = userRepository.findAllById(receiverIds).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));

        User sender = userRepository.findById(userId).orElse(null);
        String senderName = sender != null ? sender.getUsername() : "";

        return requests.stream()
                .map(r -> mapToFriendRequestResponse(r, senderName, usernameMap.getOrDefault(r.getReceiverId(), "Unknown")))
                .collect(Collectors.toList());
    }

    /**
     * Accept a received friend request.
     */
    @Transactional
    public FriendResponse acceptFriendRequest(String userId, String requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("FriendRequest", "id", requestId));

        if (!request.getReceiverId().equals(userId)) {
            throw new AccessDeniedException("You are not authorized to accept this friend request");
        }

        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new BadRequestException("Friend request is not pending (current status: " + request.getStatus() + ")");
        }

        request.setStatus(FriendRequestStatus.ACCEPTED);
        friendRequestRepository.save(request);

        String senderId = request.getSenderId();
        Friendship friendship;
        if (!friendshipRepository.areFriends(userId, senderId)) {
            friendship = Friendship.createCanonical(userId, senderId);
            friendship = friendshipRepository.save(friendship);
        } else {
            friendship = friendshipRepository.findFriendshipBetween(userId, senderId).orElse(null);
        }

        User friend = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId));

        log.info("Friendship established between user {} and user {}", userId, senderId);

        try {
            User currentUser = userRepository.findById(userId).orElse(null);
            String currentUsername = currentUser != null ? currentUser.getUsername() : "Your connection";
            notificationService.notifyFriendRequest(
                    senderId,
                    "FRIEND_REQUEST_ACCEPTED",
                    "Friend Request Accepted",
                    currentUsername + " accepted your friend request",
                    currentUser,
                    request.getId()
            );
        } catch (Exception ex) {
            log.warn("Could not dispatch friend request accept notification: {}", ex.getMessage());
        }

        return FriendResponse.builder()
                .friendshipId(friendship != null ? friendship.getId() : null)
                .friendId(friend.getId())
                .username(friend.getUsername())
                .email(friend.getEmail())
                .connectedAt(Instant.now())
                .build();
    }

    /**
     * Reject a received friend request.
     */
    @Transactional
    public void rejectFriendRequest(String userId, String requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("FriendRequest", "id", requestId));

        if (!request.getReceiverId().equals(userId)) {
            throw new AccessDeniedException("You are not authorized to reject this friend request");
        }

        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new BadRequestException("Friend request is not pending (current status: " + request.getStatus() + ")");
        }

        request.setStatus(FriendRequestStatus.REJECTED);
        friendRequestRepository.save(request);
        log.info("Friend request {} rejected by user {}", requestId, userId);
    }

    /**
     * Cancel a pending outgoing friend request.
     */
    @Transactional
    public void cancelFriendRequest(String userId, String requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("FriendRequest", "id", requestId));

        if (!request.getSenderId().equals(userId)) {
            throw new AccessDeniedException("You are not authorized to cancel this friend request");
        }

        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new BadRequestException("Friend request is not pending (current status: " + request.getStatus() + ")");
        }

        friendRequestRepository.delete(request);
        log.info("Friend request {} cancelled and removed by sender {}", requestId, userId);
    }

    /**
     * Paginated user search with relationship state relative to current user.
     */
    @Transactional(readOnly = true)
    public PagedResponse<UserProfileResponse> searchUsers(String currentUserId, String query, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("username").ascending());
        Page<User> usersPage;

        if (StringUtils.hasText(query)) {
            usersPage = userRepository.findByUsernameContainingIgnoreCaseAndIdNot(query.trim(), currentUserId, pageable);
        } else {
            usersPage = userRepository.findByIdNot(currentUserId, pageable);
        }

        List<User> users = usersPage.getContent();
        if (users.isEmpty()) {
            return PagedResponse.<UserProfileResponse>builder()
                    .content(Collections.emptyList())
                    .page(usersPage.getNumber())
                    .size(usersPage.getSize())
                    .totalElements(usersPage.getTotalElements())
                    .totalPages(usersPage.getTotalPages())
                    .last(usersPage.isLast())
                    .build();
        }

        List<String> targetIds = users.stream().map(User::getId).collect(Collectors.toList());
        List<Friendship> friendships = friendshipRepository.findFriendshipsBetween(currentUserId, targetIds);
        Set<String> friendIds = new HashSet<>();
        for (Friendship f : friendships) {
            if (f.getUserAId().equals(currentUserId)) friendIds.add(f.getUserBId());
            else friendIds.add(f.getUserAId());
        }

        List<FriendRequest> pendingRequests = friendRequestRepository.findPendingForUserAndTargets(currentUserId, targetIds);
        Map<String, FriendRequest> pendingMap = new HashMap<>();
        for (FriendRequest fr : pendingRequests) {
            String otherId = fr.getSenderId().equals(currentUserId) ? fr.getReceiverId() : fr.getSenderId();
            pendingMap.put(otherId, fr);
        }

        Set<String> currentUserFriends = getFriendIdSet(currentUserId);

        List<UserProfileResponse> profiles = users.stream().map(u -> {
            FriendshipStatus status = FriendshipStatus.NONE;
            String requestId = null;
            if (friendIds.contains(u.getId())) {
                status = FriendshipStatus.FRIENDS;
            } else if (pendingMap.containsKey(u.getId())) {
                FriendRequest req = pendingMap.get(u.getId());
                requestId = req.getId();
                if (req.getSenderId().equals(currentUserId)) {
                    status = FriendshipStatus.PENDING_SENT;
                } else {
                    status = FriendshipStatus.PENDING_RECEIVED;
                }
            }

            Set<String> targetFriends = getFriendIdSet(u.getId());
            int mutualCount = 0;
            if (!currentUserFriends.isEmpty()) {
                Set<String> intersection = new HashSet<>(currentUserFriends);
                intersection.retainAll(targetFriends);
                mutualCount = intersection.size();
            }

            return UserProfileResponse.builder()
                    .id(u.getId())
                    .username(u.getUsername())
                    .fullName(u.getFullName())
                    .avatarUrl(u.getAvatarUrl())
                    .bio(u.isShowBio() ? u.getBio() : null)
                    .profileLabel(u.getProfileLabel())
                    .interests(u.isShowInterests() ? u.getInterests() : Collections.emptySet())
                    .location(u.isShowLocation() ? u.getLocation() : null)
                    .website(u.getWebsite())
                    .twitterUrl(u.getTwitterUrl())
                    .githubUrl(u.getGithubUrl())
                    .linkedinUrl(u.getLinkedinUrl())
                    .profilePublic(u.isProfilePublic())
                    .createdAt(u.getCreatedAt())
                    .friendshipStatus(status)
                    .friendRequestId(requestId)
                    .friendsCount(targetFriends.size())
                    .mutualFriendsCount(mutualCount)
                    .publishedJournalsCount(0)
                    .build();
        }).collect(Collectors.toList());

        return PagedResponse.<UserProfileResponse>builder()
                .content(profiles)
                .page(usersPage.getNumber())
                .size(usersPage.getSize())
                .totalElements(usersPage.getTotalElements())
                .totalPages(usersPage.getTotalPages())
                .last(usersPage.isLast())
                .build();
    }

    /**
     * Get permitted public profile with friendship relation state.
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(String currentUserId, String targetUserId) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        FriendshipStatus status = FriendshipStatus.NONE;
        String requestId = null;

        if (friendshipRepository.areFriends(currentUserId, targetUserId)) {
            status = FriendshipStatus.FRIENDS;
        } else {
            Optional<FriendRequest> pending = friendRequestRepository.findPendingBetween(currentUserId, targetUserId);
            if (pending.isPresent()) {
                requestId = pending.get().getId();
                if (pending.get().getSenderId().equals(currentUserId)) {
                    status = FriendshipStatus.PENDING_SENT;
                } else {
                    status = FriendshipStatus.PENDING_RECEIVED;
                }
            }
        }

        Set<String> currentUserFriends = getFriendIdSet(currentUserId);
        Set<String> targetFriends = getFriendIdSet(targetUserId);
        Set<String> intersection = new HashSet<>(currentUserFriends);
        intersection.retainAll(targetFriends);

        long publishedCount = journalRepository.countByUserIdAndVisibility(targetUserId, JournalVisibility.PUBLIC) +
                journalRepository.countByUserIdAndVisibility(targetUserId, JournalVisibility.COMMUNITY);

        return UserProfileResponse.builder()
                .id(target.getId())
                .username(target.getUsername())
                .fullName(target.getFullName())
                .avatarUrl(target.getAvatarUrl())
                .bio(target.isShowBio() ? target.getBio() : null)
                .profileLabel(target.getProfileLabel())
                .interests(target.isShowInterests() ? target.getInterests() : Collections.emptySet())
                .location(target.isShowLocation() ? target.getLocation() : null)
                .website(target.getWebsite())
                .twitterUrl(target.getTwitterUrl())
                .githubUrl(target.getGithubUrl())
                .linkedinUrl(target.getLinkedinUrl())
                .profilePublic(target.isProfilePublic())
                .createdAt(target.getCreatedAt())
                .friendshipStatus(status)
                .friendRequestId(requestId)
                .friendsCount(targetFriends.size())
                .mutualFriendsCount(intersection.size())
                .publishedJournalsCount(publishedCount)
                .build();
    }

    private Set<String> getFriendIdSet(String userId) {
        List<Friendship> list = friendshipRepository.findAllByUserId(userId);
        Set<String> ids = new HashSet<>();
        for (Friendship f : list) {
            ids.add(f.getUserAId().equals(userId) ? f.getUserBId() : f.getUserAId());
        }
        return ids;
    }

    private FriendRequestResponse mapToFriendRequestResponse(FriendRequest r, String senderName, String receiverName) {
        return FriendRequestResponse.builder()
                .id(r.getId())
                .senderId(r.getSenderId())
                .senderUsername(senderName)
                .receiverId(r.getReceiverId())
                .receiverUsername(receiverName)
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
