package com.notesphere.listener;

import com.notesphere.entity.User;
import com.notesphere.repository.UserRepository;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

/**
 * Event listener reacting to WebSocket connection lifecycle events
 * to register user presence and track multi-connection sessions.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final PresenceService presenceService;
    private final UserRepository userRepository;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        Principal principal = headerAccessor.getUser();

        String userId = resolveUserId(principal);
        if (userId != null && sessionId != null) {
            log.info("STOMP SessionConnectedEvent received for user {} (session {})", userId, sessionId);
            presenceService.onSessionConnected(sessionId, userId);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        if (sessionId != null) {
            log.info("STOMP SessionDisconnectEvent received for session {}", sessionId);
            presenceService.onSessionDisconnected(sessionId);
        }
    }

    private String resolveUserId(Principal principal) {
        if (principal == null) {
            return null;
        }
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            if (auth.getPrincipal() instanceof UserPrincipal userPrincipal) {
                return userPrincipal.getId();
            }
        }
        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getId();
        }
        String name = principal.getName();
        return userRepository.findByUsername(name)
                .map(User::getId)
                .or(() -> userRepository.findByEmail(name).map(User::getId))
                .or(() -> userRepository.findById(name).map(User::getId))
                .orElse(name);
    }
}
