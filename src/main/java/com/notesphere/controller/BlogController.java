package com.notesphere.controller;

import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.BlogPreviewResponse;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.JournalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Blogs", description = "Endpoints for public blog previews, social crawler metadata, and login-gated full articles")
public class BlogController {

    private final JournalService journalService;

    @Value("${app.frontend.url:https://notes-sphere-d2m4.vercel.app}")
    private String frontendUrl;

    /**
     * Public Preview Endpoint: Accessible to anyone without authentication.
     * Returns ONLY safe preview teaser metadata (title, author name/avatar, cover, excerpt, reading time).
     * Strictly does not include the full article content or private user details.
     * Does NOT increment full article view counts.
     */
    @GetMapping("/api/public/blogs/{slugOrId}/preview")
    @Operation(summary = "Get public preview of a published blog without authentication")
    public ResponseEntity<ApiResponse<BlogPreviewResponse>> getPublicBlogPreview(
            @PathVariable String slugOrId) {
        BlogPreviewResponse preview = journalService.getPublicBlogPreview(slugOrId);
        return ResponseEntity.ok(ApiResponse.success("Blog preview retrieved successfully", preview));
    }

    /**
     * Social Crawler Metadata Endpoint: Returns HTML with Open Graph & Twitter Cards.
     * Handled for WhatsApp, Telegram, Twitter, LinkedIn, Facebook, Slack scrapers.
     * Contains only preview teaser metadata and redirect for browsers.
     */
    @GetMapping(value = "/api/public/blogs/{slugOrId}/meta", produces = MediaType.TEXT_HTML_VALUE)
    @Operation(summary = "Get Open Graph and Twitter Card HTML metadata for social media previews")
    public ResponseEntity<String> getBlogMetadata(
            @PathVariable String slugOrId,
            HttpServletRequest request) {
        String baseUrl = frontendUrl;
        String html = journalService.getBlogOgMetadata(slugOrId, baseUrl);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/html; charset=UTF-8"))
                .body(html);
    }

    /**
     * Full Blog Article Endpoint: Gated behind authentication.
     * Requires valid JWT Bearer token (returns 401 Unauthorized if unauthenticated).
     * Enforces ownership, publication status, and community membership visibility checks.
     * Atomically records view count (excluding author, with 24h deduplication).
     */
    @GetMapping("/api/blogs/{slugOrId}")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get full blog article (requires authentication and access authorization)")
    public ResponseEntity<ApiResponse<JournalResponse>> getFullBlog(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String slugOrId) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        JournalResponse journal = journalService.getFullBlog(currentUser.getId(), slugOrId);
        return ResponseEntity.ok(ApiResponse.success("Full blog article retrieved successfully", journal));
    }
}
