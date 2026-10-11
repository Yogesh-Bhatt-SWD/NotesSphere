package com.notesphere.service;

import com.notesphere.dto.response.FriendResponse;
import com.notesphere.entity.FriendRequest;
import com.notesphere.entity.Friendship;
import com.notesphere.entity.User;
import com.notesphere.entity.enums.FriendRequestStatus;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.repository.FriendRequestRepository;
import com.notesphere.repository.FriendshipRepository;
import com.notesphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing accepted friendships and friend removals.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final UserRepository userRepository;

    /**
     * Get all accepted friends for the given user.
     */
    @Transactional(readOnly = true)
    public List<FriendResponse> getFriends(String userId) {
        List<Friendship> friendships = friendshipRepository.findAllByUserId(userId);
        if (friendships.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, Friendship> friendIdToFriendship = new LinkedHashMap<>();
        for (Friendship f : friendships) {
            String otherId = f.getUserAId().equals(userId) ? f.getUserBId() : f.getUserAId();
            friendIdToFriendship.put(otherId, f);
        }

        List<User> friendUsers = userRepository.findAllById(friendIdToFriendship.keySet());
        return friendUsers.stream().map(u -> {
            Friendship f = friendIdToFriendship.get(u.getId());
            return FriendResponse.builder()
                    .friendshipId(f.getId())
                    .friendId(u.getId())
                    .username(u.getUsername())
                    .email(u.getEmail())
                    .connectedAt(f.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Remove an existing friend.
     */
    @Transactional
    public void removeFriend(String userId, String friendId) {
        Friendship friendship = friendshipRepository.findFriendshipBetween(userId, friendId)
                .orElseThrow(() -> new ResourceNotFoundException("Friendship", "friendId", friendId));

        friendshipRepository.delete(friendship);

        // Also clean up or delete the accepted friend request so users can reconnect in future
        Optional<FriendRequest> acceptedRequest = friendRequestRepository.findBetweenByStatus(
                userId, friendId, FriendRequestStatus.ACCEPTED);
        acceptedRequest.ifPresent(friendRequestRepository::delete);

        log.info("Friendship between {} and {} removed successfully", userId, friendId);
    }

    /**
     * Check whether two users are friends.
     */
    @Transactional(readOnly = true)
    public boolean areFriends(String userId1, String userId2) {
        return friendshipRepository.areFriends(userId1, userId2);
    }
}
