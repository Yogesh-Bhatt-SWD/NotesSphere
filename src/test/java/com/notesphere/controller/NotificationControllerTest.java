package com.notesphere.controller;

import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.NotificationResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController notificationController;

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
    @DisplayName("Should retrieve paginated notifications for authenticated user")
    void testGetNotifications() {
        NotificationResponse dto = NotificationResponse.builder()
                .id("notif-1")
                .type("JOURNAL_PUBLISHED")
                .title("New Journal")
                .message("Bob published a new journal")
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        PagedResponse<NotificationResponse> pagedResponse = PagedResponse.<NotificationResponse>builder()
                .content(List.of(dto))
                .page(0)
                .size(20)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(notificationService.getNotifications("user-alice", 0, 20)).thenReturn(pagedResponse);

        ResponseEntity<ApiResponse<PagedResponse<NotificationResponse>>> response =
                notificationController.getNotifications(alicePrincipal, 0, 20);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getData().getContent().size());
        assertEquals("notif-1", response.getBody().getData().getContent().get(0).getId());

        verify(notificationService).getNotifications("user-alice", 0, 20);
    }

    @Test
    @DisplayName("Should return unread notifications count for authenticated user")
    void testGetUnreadCount() {
        when(notificationService.getUnreadCount("user-alice")).thenReturn(3L);

        ResponseEntity<ApiResponse<Map<String, Long>>> response =
                notificationController.getUnreadCount(alicePrincipal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(3L, response.getBody().getData().get("unreadCount"));

        verify(notificationService).getUnreadCount("user-alice");
    }

    @Test
    @DisplayName("Should mark single notification as read for authenticated user")
    void testMarkAsRead() {
        ResponseEntity<ApiResponse<Void>> response =
                notificationController.markAsRead(alicePrincipal, "notif-1");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(notificationService).markAsRead("user-alice", "notif-1");
    }

    @Test
    @DisplayName("Should explicitly mark all notifications as read for authenticated user")
    void testMarkAllAsRead() {
        ResponseEntity<ApiResponse<Void>> response =
                notificationController.markAllAsRead(alicePrincipal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(notificationService).markAllAsRead("user-alice");
    }

    @Test
    @DisplayName("Should delete notification for authenticated user")
    void testDeleteNotification() {
        ResponseEntity<ApiResponse<Void>> response =
                notificationController.deleteNotification(alicePrincipal, "notif-1");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(notificationService).deleteNotification("user-alice", "notif-1");
    }
}
