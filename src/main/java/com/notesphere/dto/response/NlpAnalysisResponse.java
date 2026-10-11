package com.notesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

/**
 * Response DTO for full NLP analysis (sentiment + category + auto-tags).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NlpAnalysisResponse {

    private SentimentResponse sentiment;
    private String primaryCategory;
    private Set<String> detectedCategories;
    private List<String> tags;
}
