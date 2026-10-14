package com.notesphere.controller;

import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.BlogPreviewResponse;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.entity.enums.JournalVisibility;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.JournalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PublicBlogControllerTest {

    @Mock
    private JournalService journalService;

    @InjectMocks
    private BlogController blogController;

    private UserPrincipal testPrincipal;
    private JournalResponse publicJournal;

    @BeforeEach
    void setUp() {
        testPrincipal = new UserPrincipal(
                "user-1",
                "writer",
                "writer@notesphere.com",
                "password",
                List.of()
        );

        publicJournal = JournalResponse.builder()
                .id("journal-101")
                .slug("a-mindful-journey")
                .title("A Mindful Journey")
                .content("Full text of the story")
                .category("Reflections")
                .visibility(JournalVisibility.PUBLIC)
                .readingTimeMinutes(3)
                .authorName("Writer")
                .publishedAt(Instant.now())
                .createdAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("Should return paginated public stories for unauthenticated landing page feed")
    void testGetPublicBlogsFeed() {
        PagedResponse<JournalResponse> paged = PagedResponse.<JournalResponse>builder()
                .content(List.of(publicJournal))
                .page(0)
                .size(6)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(journalService.getPublicJournals(isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(paged);

        ResponseEntity<ApiResponse<PagedResponse<JournalResponse>>> response = blogController.getPublicBlogs(0, 6);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().getContent().size());
        assertEquals("A Mindful Journey", response.getBody().getData().getContent().get(0).getTitle());
    }

    @Test
    @DisplayName("Should return public preview metadata without exposing full article body")
    void testGetPublicBlogPreview() {
        BlogPreviewResponse preview = BlogPreviewResponse.builder()
                .id("journal-101")
                .title("A Mindful Journey")
                .excerpt("A preview excerpt...")
                .authorName("Writer")
                .readingTimeMinutes(3)
                .publishedAt(Instant.now())
                .build();

        when(journalService.getPublicBlogPreview("mindful-journey")).thenReturn(preview);

        ResponseEntity<ApiResponse<BlogPreviewResponse>> response = blogController.getPublicBlogPreview("mindful-journey");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("A Mindful Journey", response.getBody().getData().getTitle());
    }

    @Test
    @DisplayName("Should block unauthenticated access to full blog endpoint with 401")
    void testGetFullBlogUnauthenticated() {
        ResponseEntity<ApiResponse<JournalResponse>> response = blogController.getFullBlog(null, "mindful-journey");

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        verify(journalService, never()).getFullBlog(anyString(), anyString());
    }

    @Test
    @DisplayName("Should allow authenticated access to full blog endpoint")
    void testGetFullBlogAuthenticated() {
        when(journalService.getFullBlog("user-1", "mindful-journey")).thenReturn(publicJournal);

        ResponseEntity<ApiResponse<JournalResponse>> response = blogController.getFullBlog(testPrincipal, "mindful-journey");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("A Mindful Journey", response.getBody().getData().getTitle());
    }
}
