package com.notesphere.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating user email address securely.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeEmailRequest {

    @NotBlank(message = "New email address is required")
    @Email(message = "Please provide a valid email address")
    private String newEmail;

    @NotBlank(message = "Password confirmation is required")
    private String password;
}
