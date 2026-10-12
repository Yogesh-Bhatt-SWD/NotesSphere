package com.notesphere.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for creating and updating journal entries with validation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 200, message = "Title must be between 1 and 200 characters")
    private String title;

    @NotBlank(message = "Content is required")
    @Size(min = 1, max = 10000, message = "Content must be between 1 and 10,000 characters")
    private String content;

    private List<String> tags;

    @Size(max = 100, message = "Category must not exceed 100 characters")
    private String category;

    private Boolean favorite;

    private Boolean pinned;

    private com.notesphere.entity.enums.JournalVisibility visibility;

    private String communityId;

    private String coverImageUrl;

    public JournalRequest(String title, String content, List<String> tags) {
        this.title = title;
        this.content = content;
        this.tags = tags;
    }
}
