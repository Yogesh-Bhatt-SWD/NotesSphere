package com.notesphere.controller;

import com.notesphere.dto.request.JournalRequest;
import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.JournalResponse;
import com.notesphere.dto.response.PagedResponse;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/journals")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Journals", description = "Endpoints for managing personal journal entries")
public class JournalController {

    private final JournalService journalService;

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
    @Operation(summary = "Get all journal entries for the current user (paginated)")
    public ResponseEntity<ApiResponse<PagedResponse<JournalResponse>>> getUserJournals(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_NUMBER) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size,
            @RequestParam(defaultValue = AppConstants.DEFAULT_SORT_BY) String sortBy,
            @RequestParam(defaultValue = AppConstants.DEFAULT_SORT_DIRECTION) String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PagedResponse<JournalResponse> journals = journalService.getUserJournals(currentUser.getId(), pageable);
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

    @GetMapping("/search")
    @Operation(summary = "Search journal entries by title or content")
    public ResponseEntity<ApiResponse<PagedResponse<JournalResponse>>> searchJournals(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam String query,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_NUMBER) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
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
}
