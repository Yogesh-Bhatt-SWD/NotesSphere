package com.notesphere.dto.response;

import com.notesphere.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;

/**
 * DTO for user profile responses (excludes sensitive fields like password).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private String id;
    private String username;
    private String name;
    private String email;
    private Set<Role> roles;
    private String provider;
    private Instant createdAt;
}
