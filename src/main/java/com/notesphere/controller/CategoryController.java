package com.notesphere.controller;

import com.notesphere.dto.request.CategoryRequest;
import com.notesphere.dto.request.CategorySuggestionRequest;
import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.CategoryResponse;
import com.notesphere.dto.response.CategorySuggestionResponse;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Categories", description = "Endpoints for managing predefined and custom journal categories")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Get all available categories for the authenticated user (predefined + custom)")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<CategoryResponse> categories = categoryService.getAvailableCategories(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @PostMapping
    @Operation(summary = "Create a custom category for the authenticated user")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse created = categoryService.createCategory(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Category created successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Rename/update an owned custom category")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id,
            @Valid @RequestBody CategoryRequest request) {
        CategoryResponse updated = categoryService.renameCategory(currentUser.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Category updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an owned custom category (re-associates journals safely)")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String id) {
        categoryService.deleteCategory(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted successfully", null));
    }

    @PostMapping("/suggest")
    @Operation(summary = "Suggest a category automatically based on journal content")
    public ResponseEntity<ApiResponse<CategorySuggestionResponse>> suggestCategory(
            @Valid @RequestBody CategorySuggestionRequest request) {
        CategorySuggestionResponse suggestion = categoryService.suggestCategory(request.getContent());
        return ResponseEntity.ok(ApiResponse.success(suggestion));
    }
}
