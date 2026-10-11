package com.notesphere.controller;

import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.NlpAnalysisResponse;
import com.notesphere.dto.response.SentimentResponse;
import com.notesphere.service.SentimentAnalysisService;
import com.notesphere.service.TaggingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/sentiment")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Sentiment & NLP", description = "Endpoints for standalone sentiment analysis and NLP categorization")
public class SentimentController {

    private final SentimentAnalysisService sentimentAnalysisService;
    private final TaggingService taggingService;

    @PostMapping("/analyze")
    @Operation(summary = "Analyze the sentiment of a given text using VADER")
    public ResponseEntity<ApiResponse<SentimentResponse>> analyzeSentiment(@RequestBody String text) {
        SentimentResponse sentiment = sentimentAnalysisService.analyzeSentiment(text);
        return ResponseEntity.ok(ApiResponse.success(sentiment));
    }

    @PostMapping("/categorize")
    @Operation(summary = "Classify categories and keywords from text using rule-based NLP")
    public ResponseEntity<ApiResponse<Map<String, Object>>> categorizeText(@RequestBody String text) {
        String primaryCategory = taggingService.classifyCategory(text);
        Set<String> detectedCategories = taggingService.generateTags(text);
        Map<String, Integer> scores = taggingService.getCategoriesWithScores(text);

        Map<String, Object> result = Map.of(
                "primaryCategory", primaryCategory,
                "detectedCategories", detectedCategories,
                "categoryScores", scores
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/nlp-analyze")
    @Operation(summary = "Complete NLP processing: sentiment analysis and category classification")
    public ResponseEntity<ApiResponse<NlpAnalysisResponse>> fullNlpAnalysis(@RequestBody String text) {
        SentimentResponse sentiment = sentimentAnalysisService.analyzeSentiment(text);
        String primaryCategory = taggingService.classifyCategory(text);
        Set<String> detectedCategories = taggingService.generateTags(text);

        NlpAnalysisResponse response = NlpAnalysisResponse.builder()
                .sentiment(sentiment)
                .primaryCategory(primaryCategory)
                .detectedCategories(detectedCategories)
                .tags(new ArrayList<>(detectedCategories))
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
