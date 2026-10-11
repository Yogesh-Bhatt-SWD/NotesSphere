package com.notesphere.controller;

import com.notesphere.dto.response.ApiResponse;
import com.notesphere.dto.response.MonthlyCalendarResponse;
import com.notesphere.dto.response.StreakResponse;
import com.notesphere.dto.response.UserAnalyticsResponse;
import com.notesphere.security.UserPrincipal;
import com.notesphere.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Analytics & Calendar", description = "Endpoints for personal analytics, calendar entries, and writing streaks")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    @Operation(summary = "Get user analytics (sentiment distribution, categories, activity timeline, and streaks)")
    public ResponseEntity<ApiResponse<UserAnalyticsResponse>> getUserAnalytics(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserAnalyticsResponse analytics = analyticsService.getUserAnalytics(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }

    @GetMapping("/streaks")
    @Operation(summary = "Get current and longest writing streaks for authenticated user")
    public ResponseEntity<ApiResponse<StreakResponse>> getUserStreaks(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        StreakResponse streaks = analyticsService.getUserStreaks(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(streaks));
    }

    @GetMapping("/calendar/dates")
    @Operation(summary = "Get all dates (YYYY-MM-DD) on which the authenticated user wrote a journal entry")
    public ResponseEntity<ApiResponse<List<String>>> getCalendarDates(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<String> dates = analyticsService.getCalendarDates(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(dates));
    }

    @GetMapping("/calendar/monthly")
    @Operation(summary = "Get calendar entries and active dates for a specific year and month")
    public ResponseEntity<ApiResponse<MonthlyCalendarResponse>> getMonthlyCalendar(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        LocalDate now = LocalDate.now(ZoneOffset.UTC);
        int targetYear = year != null ? year : now.getYear();
        int targetMonth = month != null ? month : now.getMonthValue();

        MonthlyCalendarResponse response = analyticsService.getMonthlyCalendar(
                currentUser.getId(), targetYear, targetMonth);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
