package com.notesphere.service;

import com.notesphere.dto.response.AdminStatsResponse;
import com.notesphere.dto.response.UserResponse;
import com.notesphere.entity.User;
import com.notesphere.entity.enums.AuthProvider;
import com.notesphere.entity.enums.Role;
import com.notesphere.entity.enums.SentimentLabel;
import com.notesphere.exception.ResourceNotFoundException;
import com.notesphere.repository.JournalEntryRepository;
import com.notesphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Service for administrative operations and aggregate platform analytics.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final JournalEntryRepository journalRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public AdminStatsResponse getPlatformStats() {
        long totalUsers = userRepository.count();
        long totalJournals = journalRepository.count();

        // Sentiment breakdown
        Map<String, Long> sentimentBreakdown = new LinkedHashMap<>();
        sentimentBreakdown.put(SentimentLabel.POSITIVE.name(), journalRepository.countBySentimentLabel(SentimentLabel.POSITIVE));
        sentimentBreakdown.put(SentimentLabel.NEUTRAL.name(), journalRepository.countBySentimentLabel(SentimentLabel.NEUTRAL));
        sentimentBreakdown.put(SentimentLabel.NEGATIVE.name(), journalRepository.countBySentimentLabel(SentimentLabel.NEGATIVE));

        // Category breakdown
        Map<String, Long> topCategories = new LinkedHashMap<>();
        List<Object[]> categoryRows = journalRepository.countAllPlatformCategories();
        for (Object[] row : categoryRows) {
            String cat = row[0] != null ? (String) row[0] : "General";
            topCategories.put(cat, (Long) row[1]);
        }

        // Auth Provider breakdown
        Map<String, Long> authProviderBreakdown = new LinkedHashMap<>();
        List<Object[]> providerRows = userRepository.countUsersByProvider();
        for (Object[] row : providerRows) {
            if (row[0] != null) {
                authProviderBreakdown.put(((AuthProvider) row[0]).name(), (Long) row[1]);
            }
        }

        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalJournals(totalJournals)
                .sentimentBreakdown(sentimentBreakdown)
                .topCategories(topCategories)
                .authProviderBreakdown(authProviderBreakdown)
                .build();
    }

    @Transactional
    public UserResponse updateUserRoles(String userId, Set<Role> roles) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setRoles(roles);
        User updated = userRepository.save(user);
        log.info("Roles updated for user {}: {}", userId, roles);
        return userService.mapToUserResponse(updated);
    }
}
