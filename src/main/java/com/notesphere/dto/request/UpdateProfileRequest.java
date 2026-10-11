package com.notesphere.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * DTO for updating user profile information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_.-]+$", message = "Username can only contain alphanumeric characters, dots, underscores, or dashes")
    private String username;

    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    private String avatarUrl;

    @Size(max = 500, message = "Bio must not exceed 500 characters")
    private String bio;

    @Size(max = 50, message = "Profile label must not exceed 50 characters")
    private String profileLabel;

    private Set<String> interests;

    @Size(max = 100, message = "Location must not exceed 100 characters")
    private String location;

    @Size(max = 200, message = "Website must not exceed 200 characters")
    private String website;

    @Size(max = 200, message = "Twitter/X URL must not exceed 200 characters")
    private String twitterUrl;

    @Size(max = 200, message = "GitHub URL must not exceed 200 characters")
    private String githubUrl;

    @Size(max = 200, message = "LinkedIn URL must not exceed 200 characters")
    private String linkedinUrl;

    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String newPassword;
}
