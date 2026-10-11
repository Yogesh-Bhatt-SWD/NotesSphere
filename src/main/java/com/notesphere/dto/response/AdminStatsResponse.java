package com.notesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO for aggregate admin dashboard platform metrics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {

    private long totalUsers;
    private long totalJournals;
    private Map<String, Long> sentimentBreakdown;
    private Map<String, Long> topCategories;
    private Map<String, Long> authProviderBreakdown;
    private Map<String, Long> topTags;
}
