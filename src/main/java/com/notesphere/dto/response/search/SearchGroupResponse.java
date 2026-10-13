package com.notesphere.dto.response.search;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Generic wrapper for a category result group with pagination metadata.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchGroupResponse<T> {
    @Builder.Default
    private List<T> items = new ArrayList<>();
    private long total;
    private int page;
    private int size;
    private int totalPages;

    public static <T> SearchGroupResponse<T> empty() {
        return SearchGroupResponse.<T>builder()
                .items(new ArrayList<>())
                .total(0)
                .page(0)
                .size(10)
                .totalPages(0)
                .build();
    }
}
