package com.notesphere.dto.response.search;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Top-level global search response containing categorized search results and totals.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalSearchResponse {
    private String query;
    private String type; // ALL, PEOPLE, BLOGS, COMMUNITIES, COMMUNITY_POSTS
    private SearchGroupResponse<SearchPersonResult> people;
    private SearchGroupResponse<SearchBlogResult> blogs;
    private SearchGroupResponse<SearchCommunityResult> communities;
    private SearchGroupResponse<SearchCommunityPostResult> communityPosts;
    private long totalResults;
}
