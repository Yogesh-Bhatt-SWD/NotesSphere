package com.notesphere.controller;

import com.notesphere.dto.response.PresenceResponse;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.PresenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PresenceControllerTest {

    @Mock
    private PresenceService presenceService;

    @InjectMocks
    private PresenceController presenceController;

    private UserPrincipal alicePrincipal;

    @BeforeEach
    void setUp() {
        alicePrincipal = new UserPrincipal(
                "user-alice",
                "alice",
                "alice@test.com",
                "password",
                List.of()
        );
    }

    @Test
    @DisplayName("Should return presence list for friends")
    void testGetFriendsPresence() {
        PresenceResponse bobPresence = PresenceResponse.builder()
                .userId("user-bob")
                .online(true)
                .build();

        when(presenceService.getFriendsPresence("user-alice")).thenReturn(List.of(bobPresence));

        ResponseEntity<?> response = presenceController.getFriendsPresence(alicePrincipal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    @DisplayName("Should return single friend presence status")
    void testGetUserPresenceSuccess() {
        PresenceResponse bobPresence = PresenceResponse.builder()
                .userId("user-bob")
                .online(true)
                .build();

        when(presenceService.getUserPresence("user-alice", "user-bob")).thenReturn(bobPresence);

        ResponseEntity<?> response = presenceController.getUserPresence(alicePrincipal, "user-bob");

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    @DisplayName("Should reject non-friend presence check with AccessDeniedException")
    void testGetUserPresenceDeniedForNonFriend() {
        when(presenceService.getUserPresence("user-alice", "user-stranger"))
                .thenThrow(new AccessDeniedException("Access denied"));

        assertThrows(AccessDeniedException.class, () ->
                presenceController.getUserPresence(alicePrincipal, "user-stranger")
        );
    }
}
