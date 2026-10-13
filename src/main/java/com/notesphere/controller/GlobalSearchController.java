package com.notesphere.controller;

import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.search.GlobalSearchResponse;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.GlobalSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller providing unified Global Search endpoint across people, blogs, communities, and community posts.
 */
@Slf4j
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Tag(name = "Search", description = "Global search endpoint across People, Published Blogs, Communities, and Community Posts")
@SecurityRequirement(name = "Bearer Authentication")
public class GlobalSearchController {

    private final GlobalSearchService globalSearchService;

    @GetMapping
    @Operation(summary = "Perform global search across people, blogs, communities, and posts")
    public ResponseEntity<ApiResponse<GlobalSearchResponse>> search(
            @RequestParam(name = "q", required = false, defaultValue = "") String query,
            @RequestParam(name = "type", required = false, defaultValue = "ALL") String type,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        String currentUserId = (currentUser != null) ? currentUser.getId() : null;
        GlobalSearchResponse response = globalSearchService.search(query, type, page, size, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Search completed successfully", response));
    }
}
