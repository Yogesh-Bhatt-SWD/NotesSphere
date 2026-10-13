package com.notesphere.service;

import com.notesphere.dto.response.PresenceEvent;
import com.notesphere.dto.response.PresenceResponse;
import com.notesphere.entity.Friendship;
import com.notesphere.entity.PresenceBroadcastEvent;
import com.notesphere.entity.User;
import com.notesphere.entity.UserPresenceSession;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.repository.FriendshipRepository;
import com.notesphere.repository.PresenceBroadcastEventRepository;
import com.notesphere.repository.UserPresenceSessionRepository;
import com.notesphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Core Service managing real-time Online/Offline user presence.
 * Features:
 * - Multi-tab / multi-device connection tracking (closing one tab keeps user online if others exist).
 * - Heartbeat cleanup & crash detection.
 * - Friend-only visibility enforcement.
 * - Multi-instance replication via shared database presence events.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PresenceService {

    private final UserPresenceSessionRepository presenceSessionRepository;
    private final PresenceBroadcastEventRepository broadcastEventRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // Unique ID identifying this backend instance
    private final String instanceId = UUID.randomUUID().toString();

    // In-memory lookup: sessionId -> userId for fast disconnect resolution
    private final Map<String, String> sessionToUserMap = new ConcurrentHashMap<>();

    // Throttling map for heartbeats to avoid excessive database writes: sessionId -> lastDbUpdateMillis
    private final Map<String, Long> lastHeartbeatThrottleMap = new ConcurrentHashMap<>();

    // Tracks last processed replication event id for multi-instance sync
    private long lastProcessedEventId = 0L;

    /**
     * Called when a STOMP WebSocket connection is successfully established.
     */
    @Transactional
    public void onSessionConnected(String sessionId, String userId) {
        if (sessionId == null || userId == null) {
            return;
        }

        sessionToUserMap.put(sessionId, userId);
        Instant now = Instant.now();

        long activeSessionsBefore = presenceSessionRepository.countByUserId(userId);

        UserPresenceSession session = UserPresenceSession.builder()
                .sessionId(sessionId)
                .userId(userId)
                .connectedAt(now)
                .lastHeartbeatAt(now)
                .instanceId(instanceId)
                .build();

        presenceSessionRepository.save(session);
        log.info("Presence session registered: user={}, session={}, instance={}", userId, sessionId, instanceId);

        // Transition from offline (0 sessions) to online (1+ sessions)
        if (activeSessionsBefore == 0) {
            log.info("User {} is now ONLINE", userId);
            dispatchPresenceChange(userId, true, null);
        }
    }

    /**
     * Called when a STOMP WebSocket connection is closed or lost.
     */
    @Transactional
    public void onSessionDisconnected(String sessionId) {
        if (sessionId == null) {
            return;
        }

        lastHeartbeatThrottleMap.remove(sessionId);
        String userId = sessionToUserMap.remove(sessionId);

        if (userId == null) {
            userId = presenceSessionRepository.findById(sessionId)
                    .map(UserPresenceSession::getUserId)
                    .orElse(null);
        }

        if (userId == null) {
            log.debug("Session {} disconnected without associated user", sessionId);
            return;
        }

        presenceSessionRepository.deleteById(sessionId);
        long remainingSessions = presenceSessionRepository.countByUserId(userId);
        log.info("Presence session closed: user={}, session={}, remainingSessions={}", userId, sessionId, remainingSessions);

        // Transition from online to offline only when NO sessions remain
        if (remainingSessions == 0) {
            Instant now = Instant.now();
            userRepository.findById(userId).ifPresent(u -> {
                u.setLastSeenAt(now);
                userRepository.save(u);
            });

            log.info("User {} is now OFFLINE (lastSeen={})", userId, now);
            dispatchPresenceChange(userId, false, now);
        }
    }

    /**
     * Records a heartbeat for an active session with in-memory throttling.
     */
    @Transactional
    public void recordHeartbeat(String sessionId, String userId) {
        if (sessionId == null || userId == null) {
            return;
        }

        long nowMillis = System.currentTimeMillis();
        Long lastUpdate = lastHeartbeatThrottleMap.get(sessionId);

        // Throttle updates to at most once every 5 seconds per session
        if (lastUpdate == null || (nowMillis - lastUpdate) > 5000) {
            lastHeartbeatThrottleMap.put(sessionId, nowMillis);
            presenceSessionRepository.findById(sessionId).ifPresent(s -> {
                s.setLastHeartbeatAt(Instant.ofEpochMilli(nowMillis));
                presenceSessionRepository.save(s);
            });
        }
    }

    /**
     * Periodic cleanup of dead / ungraceful disconnects (browser crashes, network drops).
     * Runs every 15 seconds. Sessions with no heartbeat for > 45 seconds are evicted.
     */
    @Scheduled(fixedRate = 15000)
    @Transactional
    public void cleanupExpiredSessions() {
        Instant threshold = Instant.now().minusSeconds(45);
        List<UserPresenceSession> expired = presenceSessionRepository.findExpiredSessions(threshold);

        if (expired.isEmpty()) {
            return;
        }

        log.info("Detected {} timed-out presence sessions needing cleanup", expired.size());
        Set<String> affectedUserIds = new HashSet<>();

        for (UserPresenceSession s : expired) {
            affectedUserIds.add(s.getUserId());
            sessionToUserMap.remove(s.getSessionId());
            lastHeartbeatThrottleMap.remove(s.getSessionId());
            presenceSessionRepository.deleteById(s.getSessionId());
        }

        Instant now = Instant.now();
        for (String userId : affectedUserIds) {
            long remaining = presenceSessionRepository.countByUserId(userId);
            if (remaining == 0) {
                userRepository.findById(userId).ifPresent(u -> {
                    u.setLastSeenAt(now);
                    userRepository.save(u);
                });
                log.info("User {} timed out and is now OFFLINE", userId);
                dispatchPresenceChange(userId, false, now);
            }
        }
    }

    /**
     * Replicates presence events from other backend instances via shared event table.
     * Runs every 2 seconds.
     */
    @Scheduled(fixedRate = 2000)
    @Transactional(readOnly = true)
    public void syncCrossInstanceEvents() {
        try {
            List<PresenceBroadcastEvent> events =
                    broadcastEventRepository.findNewEventsForOtherInstances(lastProcessedEventId, instanceId);

            for (PresenceBroadcastEvent event : events) {
                lastProcessedEventId = Math.max(lastProcessedEventId, event.getId());
                // Broadcast to local WebSocket subscribers on this instance
                broadcastToAcceptedFriends(event.getUserId(), event.isOnline(), event.getLastSeenAt());
            }
        } catch (Exception ex) {
            log.warn("Error synchronizing cross-instance presence events: {}", ex.getMessage());
        }
    }

    /**
     * Periodically purges old presence events from shared broadcast table.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cleanupOldBroadcastEvents() {
        try {
            Instant threshold = Instant.now().minusSeconds(120);
            int deleted = broadcastEventRepository.deleteOldEvents(threshold);
            if (deleted > 0) {
                log.debug("Purged {} obsolete presence broadcast events", deleted);
            }
        } catch (Exception ex) {
            log.warn("Error purging old presence events: {}", ex.getMessage());
        }
    }

    /**
     * Dispatches presence change locally and writes to shared event store for multi-instance sync.
     */
    private void dispatchPresenceChange(String userId, boolean online, Instant lastSeenAt) {
        // 1. Broadcast to this instance's connected subscribers
        broadcastToAcceptedFriends(userId, online, lastSeenAt);

        // 2. Persist to shared event log for other backend instances
        try {
            PresenceBroadcastEvent event = PresenceBroadcastEvent.builder()
                    .userId(userId)
                    .online(online)
                    .lastSeenAt(lastSeenAt)
                    .originInstanceId(instanceId)
                    .createdAt(Instant.now())
                    .build();
            broadcastEventRepository.save(event);
        } catch (Exception ex) {
            log.warn("Could not persist presence broadcast event for user {}: {}", userId, ex.getMessage());
        }
    }

    /**
     * Dispatches STOMP message to each accepted friend of userId, and to userId themselves.
     */
    private void broadcastToAcceptedFriends(String userId, boolean online, Instant lastSeenAt) {
        List<Friendship> friendships = friendshipRepository.findAllByUserId(userId);
        PresenceEvent payload = PresenceEvent.builder()
                .userId(userId)
                .online(online)
                .lastSeenAt(lastSeenAt)
                .build();

        Set<String> recipientIds = new HashSet<>();
        for (Friendship f : friendships) {
            String friendId = f.getUserAId().equals(userId) ? f.getUserBId() : f.getUserAId();
            recipientIds.add(friendId);
        }
        // Also include userId so multi-tabs of the same user remain synchronized
        recipientIds.add(userId);

        for (String recipientId : recipientIds) {
            try {
                messagingTemplate.convertAndSend("/topic/presence.friends." + recipientId, payload);
            } catch (Exception ex) {
                log.warn("Failed to send presence STOMP message to {}: {}", recipientId, ex.getMessage());
            }
        }
    }

    /**
     * Check if a specific user currently has at least one active connection.
     */
    @Transactional(readOnly = true)
    public boolean isUserOnline(String userId) {
        if (userId == null) return false;
        return presenceSessionRepository.existsByUserId(userId);
    }

    /**
     * Retrieve presence status for all accepted friends of the given user.
     */
    @Transactional(readOnly = true)
    public List<PresenceResponse> getFriendsPresence(String userId) {
        List<Friendship> friendships = friendshipRepository.findAllByUserId(userId);
        if (friendships.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> friendIds = new HashSet<>();
        for (Friendship f : friendships) {
            String friendId = f.getUserAId().equals(userId) ? f.getUserBId() : f.getUserAId();
            friendIds.add(friendId);
        }

        Set<String> onlineUserIds = presenceSessionRepository.findOnlineUserIds(friendIds);
        List<User> friendUsers = userRepository.findAllById(friendIds);

        return friendUsers.stream().map(u -> PresenceResponse.builder()
                .userId(u.getId())
                .online(onlineUserIds.contains(u.getId()))
                .lastSeenAt(u.getLastSeenAt())
                .build()
        ).collect(Collectors.toList());
    }

    /**
     * Retrieve presence status for a specific user with strict privacy protection:
     * Only accepted friends (or the user themselves) are authorized to view presence.
     */
    @Transactional(readOnly = true)
    public PresenceResponse getUserPresence(String currentUserId, String targetUserId) {
        if (!currentUserId.equals(targetUserId) && !friendshipRepository.areFriends(currentUserId, targetUserId)) {
            throw new AccessDeniedException("Access denied: You can only view presence of accepted friends");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        boolean isOnline = presenceSessionRepository.existsByUserId(targetUserId);

        return PresenceResponse.builder()
                .userId(targetUserId)
                .online(isOnline)
                .lastSeenAt(target.getLastSeenAt())
                .build();
    }
}
