package com.notesphere.controller;

import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.SentimentResponse;
import com.notesphere.service.SentimentAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sentiment")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Sentiment", description = "Endpoints for standalone sentiment analysis")
public class SentimentController {

    private final SentimentAnalysisService sentimentAnalysisService;

    @PostMapping("/analyze")
    @Operation(summary = "Analyze the sentiment of a given text")
    public ResponseEntity<ApiResponse<SentimentResponse>> analyzeSentiment(@RequestBody String text) {
        SentimentResponse sentiment = sentimentAnalysisService.analyzeSentiment(text);
        return ResponseEntity.ok(ApiResponse.success(sentiment));
    }
}
