package com.notesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO for calendar view by month.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyCalendarResponse {

    private int year;
    private int month;
    private int totalEntries;
    private List<String> activeDates;
    private Map<String, List<JournalResponse>> entriesByDate;
}
