package com.notesphere.controller;

import com.notesphere.dto.request.JournalRequest;
import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.entity.enums.SentimentLabel;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.JournalService;
import com.notesphere.util.AppConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/journals")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Journals", description = "Endpoints for managing personal journal entries")
public class JournalController {

    private final JournalService journalService;
    private final com.notesphere.service.ExportService exportService;

    @PostMapping
    @Operation(summary = "Create a new journal entry")
    public ResponseEntity<ApiResponse<JournalResponse>> createJournal(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody JournalRequest request) {
        JournalResponse journal = journalService.createJournal(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Journal created successfully", journal));
    }

    @GetMapping
    @Operation(summary = "Get journal entries with pagination, sorting, search, and dynamic filters")
    public ResponseEntity<ApiResponse<PagedResponse<JournalResponse>>> getUserJournals(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_NUMBER) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size,
            @RequestParam(defaultValue = AppConstants.DEFAULT_SORT_BY) String sortBy,
            @RequestParam(defaultValue = AppConstants.DEFAULT_SORT_DIRECTION) String sortDir,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) SentimentLabel sentiment,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) Boolean favorite,
            @RequestParam(required = false) Boolean pinned,
            @RequestParam(required = false) com.notesphere.entity.enums.JournalVisibility visibility,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate) {

        Sort.Direction direction = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.Direction.ASC : Sort.Direction.DESC;

        Sort sort;
        if ("createdAt".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Order.desc("pinned"), new Sort.Order(direction, "createdAt"));
        } else {
            sort = Sort.by(direction, sortBy);
        }

        Pageable pageable = PageRequest.of(page, Math.min(size, AppConstants.MAX_PAGE_SIZE), sort);

        PagedResponse<JournalResponse> journals = journalService.getFilteredJournals(
                currentUser.getId(), query, sentiment, category, tag, favorite, pinned, visibility, startDate, endDate, pageable);

        return ResponseEntity.ok(ApiResponse.success(journals));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a specific journal entry by ID")
    public ResponseEntity<ApiResponse<JournalResponse>> getJournalById(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id) {
        JournalResponse journal = journalService.getJournalById(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(journal));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing journal entry")
    public ResponseEntity<ApiResponse<JournalResponse>> updateJournal(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id,
            @Valid @RequestBody JournalRequest request) {
        JournalResponse journal = journalService.updateJournal(currentUser.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Journal updated successfully", journal));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a journal entry")
    public ResponseEntity<ApiResponse<Void>> deleteJournal(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id) {
        journalService.deleteJournal(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Journal deleted successfully", null));
    }

    @PatchMapping("/{id}/favorite")
    @Operation(summary = "Toggle favorite status of a journal entry")
    public ResponseEntity<ApiResponse<JournalResponse>> toggleFavorite(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id) {
        JournalResponse journal = journalService.toggleFavorite(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Favorite status updated", journal));
    }

    @PatchMapping("/{id}/pin")
    @Operation(summary = "Toggle pinned status of a journal entry")
    public ResponseEntity<ApiResponse<JournalResponse>> togglePinned(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id) {
        JournalResponse journal = journalService.togglePinned(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Pinned status updated", journal));
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Publish a journal entry to a community")
    public ResponseEntity<ApiResponse<JournalResponse>> publishJournal(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id,
            @Valid @RequestBody com.notesphere.dto.request.PublishJournalRequest request) {
        JournalResponse journal = journalService.publishJournal(currentUser.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Journal published successfully", journal));
    }

    @PostMapping("/{id}/unpublish")
    @Operation(summary = "Unpublish a journal entry and revert it to private")
    public ResponseEntity<ApiResponse<JournalResponse>> unpublishJournal(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id) {
        JournalResponse journal = journalService.unpublishJournal(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Journal unpublished successfully", journal));
    }

    @GetMapping("/published")
    @Operation(summary = "Get all journals published by the authenticated user")
    public ResponseEntity<ApiResponse<PagedResponse<JournalResponse>>> getPublishedJournals(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_NUMBER) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, AppConstants.MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "publishedAt"));
        PagedResponse<JournalResponse> journals = journalService.getUserPublishedJournals(currentUser.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(journals));
    }

    @GetMapping("/search")
    @Operation(summary = "Search journal entries by title or content")
    public ResponseEntity<ApiResponse<PagedResponse<JournalResponse>>> searchJournals(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam String query,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_NUMBER) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {

        Pageable pageable = PageRequest.of(page, Math.min(size, AppConstants.MAX_PAGE_SIZE),
                Sort.by(Sort.Order.desc("pinned"), Sort.Order.desc("createdAt")));
        PagedResponse<JournalResponse> journals = journalService.searchJournals(currentUser.getId(), query, pageable);
        return ResponseEntity.ok(ApiResponse.success(journals));
    }

    @GetMapping("/tags")
    @Operation(summary = "Get all unique tags used by the current user")
    public ResponseEntity<ApiResponse<List<String>>> getUserTags(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<String> tags = journalService.getUserTags(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(tags));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get all unique categories used by the current user")
    public ResponseEntity<ApiResponse<List<String>>> getUserCategories(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<String> categories = journalService.getUserCategories(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping(value = "/export/json", produces = "application/json")
    @Operation(summary = "Export all personal journal entries as a JSON file")
    public ResponseEntity<byte[]> exportJournalsJson(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        byte[] data = exportService.exportJournalsAsJson(currentUser.getId());
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"journals.json\"")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/json")
                .body(data);
    }

    @GetMapping(value = "/export/csv", produces = "text/csv")
    @Operation(summary = "Export all personal journal entries as a CSV file")
    public ResponseEntity<byte[]> exportJournalsCsv(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        byte[] data = exportService.exportJournalsAsCsv(currentUser.getId());
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"journals.csv\"")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .body(data);
    }
}
