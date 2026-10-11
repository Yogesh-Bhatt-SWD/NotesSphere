package com.notesphere.controller;

import com.notesphere.dto.response.AdminStatsResponse;
import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.dto.response.UserResponse;
import com.notesphere.entity.enums.Role;
import com.notesphere.service.AdminService;
import com.notesphere.service.UserService;
import com.notesphere.util.AppConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin", description = "Protected endpoints for platform administrators only")
public class AdminController {

    private final UserService userService;
    private final AdminService adminService;

    @GetMapping("/users")
    @Operation(summary = "Get all users (paginated)")
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_NUMBER) int page,
            @RequestParam(defaultValue = AppConstants.DEFAULT_PAGE_SIZE) int size) {

        Pageable pageable = PageRequest.of(page, Math.min(size, AppConstants.MAX_PAGE_SIZE),
                Sort.by("createdAt").descending());
        PagedResponse<UserResponse> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PutMapping("/users/{id}/roles")
    @Operation(summary = "Update roles for a user (e.g. grant ROLE_ADMIN)")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRoles(
            @PathVariable String id,
            @RequestBody Set<Role> roles) {
        UserResponse response = adminService.updateUserRoles(id, roles);
        return ResponseEntity.ok(ApiResponse.success("User roles updated successfully", response));
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Delete a user by ID")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get platform-wide aggregate statistics")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getPlatformStats() {
        AdminStatsResponse stats = adminService.getPlatformStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
