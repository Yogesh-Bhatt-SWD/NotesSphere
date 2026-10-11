package com.notesphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for writing streak statistics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StreakResponse {

    private int currentStreak;
    private int longestStreak;
    private LocalDate lastEntryDate;
    private boolean activeToday;
}
