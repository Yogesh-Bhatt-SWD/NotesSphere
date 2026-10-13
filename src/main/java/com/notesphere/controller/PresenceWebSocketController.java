package com.notesphere.controller;

import com.notesphere.entity.User;
import com.notesphere.repository.UserRepository;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * STOMP controller handling presence heartbeats.
 * Clients periodically send a heartbeat frame to keep active sessions alive.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class PresenceWebSocketController {

    private final PresenceService presenceService;
    private final UserRepository userRepository;

    @MessageMapping("/presence.heartbeat")
    public void receiveHeartbeat(Principal principal, @Header("simpSessionId") String sessionId) {
        if (principal == null || sessionId == null) {
            return;
        }

        String userId = resolveUserId(principal);
        if (userId != null) {
            presenceService.recordHeartbeat(sessionId, userId);
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
