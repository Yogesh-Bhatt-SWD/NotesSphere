package com.notesphere.dto.response;

import com.notesphere.entity.enums.SentimentLabel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for standalone sentiment analysis results.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentResponse {

    private SentimentLabel label;
    private double compound;
    private double positive;
    private double negative;
    private double neutral;
}
