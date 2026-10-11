package com.notesphere.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityRequest {

    @NotBlank(message = "Community name is required")
    @Size(min = 2, max = 100, message = "Community name must be between 2 and 100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @Size(max = 50, message = "Icon name must not exceed 50 characters")
    private String icon;

    @Size(max = 100, message = "Category must not exceed 100 characters")
    private String category;
}
