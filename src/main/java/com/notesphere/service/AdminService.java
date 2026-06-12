package com.notesphere.service;

import com.notesphere.dto.response.AdminStatsResponse;
import com.notesphere.entity.enums.SentimentLabel;
import com.notesphere.repository.JournalEntryRepository;
import com.notesphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for administrative operations and platform analytics.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final JournalEntryRepository journalRepository;

    public AdminStatsResponse getPlatformStats() {
        long totalUsers = userRepository.count();
        long totalJournals = journalRepository.count();

        Map<String, Long> sentimentBreakdown = new HashMap<>();
        sentimentBreakdown.put(SentimentLabel.POSITIVE.name(), journalRepository.countBySentimentLabel(SentimentLabel.POSITIVE));
        sentimentBreakdown.put(SentimentLabel.NEGATIVE.name(), journalRepository.countBySentimentLabel(SentimentLabel.NEGATIVE));
        sentimentBreakdown.put(SentimentLabel.NEUTRAL.name(), journalRepository.countBySentimentLabel(SentimentLabel.NEUTRAL));

        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalJournals(totalJournals)
                .sentimentBreakdown(sentimentBreakdown)
                .build();
    }
}
