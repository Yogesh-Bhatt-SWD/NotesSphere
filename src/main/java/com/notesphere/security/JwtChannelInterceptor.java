package com.notesphere.security;

import com.notesphere.entity.Conversation;
import com.notesphere.entity.User;
import com.notesphere.repository.ConversationRepository;
import com.notesphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Principal;
import java.util.List;

/**
 * Inbound STOMP ChannelInterceptor that authenticates WebSocket connections using JWT,
 * sets the security Principal, and strictly authorizes destination subscriptions.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        // 1. Authenticate on STOMP CONNECT frame
        if (StompCommand.CONNECT.equals(command)) {
            String token = extractToken(accessor);
            if (!StringUtils.hasText(token) || !jwtTokenProvider.validateToken(token)) {
                log.warn("WebSocket STOMP CONNECT rejected: invalid or missing JWT token");
                throw new MessageDeliveryException("Unauthorized: Invalid or missing JWT authentication token");
            }

            String userId = jwtTokenProvider.getUserIdFromToken(token);
            UserDetails userDetails = userDetailsService.loadUserById(userId);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            accessor.setUser(authentication);
            log.info("WebSocket authenticated for user ID: {}", userId);
        }

        // 2. Authorize on STOMP SUBSCRIBE frame
        else if (StompCommand.SUBSCRIBE.equals(command)) {
            Principal principal = accessor.getUser();
            if (principal == null) {
                log.warn("WebSocket STOMP SUBSCRIBE rejected: unauthenticated session");
                throw new MessageDeliveryException("Unauthorized STOMP subscription");
            }

            String userId = resolveUserId(principal);
            String destination = accessor.getDestination();

            if (destination != null) {
                // Authorize conversation topic: /topic/conversation.{id}
                if (destination.startsWith("/topic/conversation.")) {
                    String conversationId = destination.substring("/topic/conversation.".length());
                    Conversation conversation = conversationRepository.findById(conversationId).orElse(null);
                    if (conversation == null || !conversation.isParticipant(userId)) {
                        log.warn("User {} (resolved ID: {}) attempted unauthorized subscription to destination {}",
                                principal.getName(), userId, destination);
                        throw new MessageDeliveryException("Access denied: You are not a participant in this conversation");
                    }
                }
                // Authorize personal notifications topic: /topic/notifications.{id}
                else if (destination.startsWith("/topic/notifications.")) {
                    String targetUserId = destination.substring("/topic/notifications.".length());
                    if (!targetUserId.equals(userId) && !targetUserId.equalsIgnoreCase(principal.getName())) {
                        log.warn("User {} (resolved ID: {}) attempted unauthorized subscription to private notifications of {}",
                                principal.getName(), userId, targetUserId);
                        throw new MessageDeliveryException("Access denied: You cannot subscribe to another user's notifications");
                    }
                }
            }
        }

        // 3. Authorize on STOMP SEND frame
        else if (StompCommand.SEND.equals(command)) {
            Principal principal = accessor.getUser();
            if (principal == null) {
                log.warn("WebSocket STOMP SEND rejected: unauthenticated session");
                throw new MessageDeliveryException("Unauthorized STOMP send");
            }
        }

        return message;
    }

    private String extractToken(StompHeaderAccessor accessor) {
        // Try native 'Authorization' header first
        List<String> authHeader = accessor.getNativeHeader("Authorization");
        if (authHeader != null && !authHeader.isEmpty()) {
            String bearer = authHeader.get(0);
            if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
                return bearer.substring(7);
            }
            return bearer;
        }

        // Try native 'token' header
        List<String> tokenHeader = accessor.getNativeHeader("token");
        if (tokenHeader != null && !tokenHeader.isEmpty()) {
            return tokenHeader.get(0);
        }

        return null;
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
