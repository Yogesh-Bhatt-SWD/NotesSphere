package com.notesphere.config;

import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.User;
import com.notesphere.repository.JournalEntryRepository;
import com.notesphere.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Startup runner to clean up any synthetic test journals and bot accounts
 * that were created during automated test or verification runs.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseCleanupRunner implements ApplicationRunner {

    private final JournalEntryRepository journalRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        try {
            log.info("Starting automated cleanup of synthetic test journals and test accounts...");

            // 1. Identify and delete synthetic test journals
            List<JournalEntry> allJournals = journalRepository.findAll();
            int deletedJournalsCount = 0;

            for (JournalEntry j : allJournals) {
                if (isSyntheticJournal(j)) {
                    journalRepository.delete(j);
                    deletedJournalsCount++;
                    log.info("Cleaned up synthetic test journal: '{}' (ID: {})", j.getTitle(), j.getId());
                }
            }

            // 2. Identify and delete synthetic test users
            List<User> allUsers = userRepository.findAll();
            int deletedUsersCount = 0;

            for (User u : allUsers) {
                if (isSyntheticUser(u)) {
                    long remainingJournals = journalRepository.countByUserId(u.getId());
                    if (remainingJournals == 0) {
                        userRepository.delete(u);
                        deletedUsersCount++;
                        log.info("Cleaned up synthetic test user: '{}' (Email: {})", u.getUsername(), u.getEmail());
                    }
                }
            }

            if (deletedJournalsCount > 0 || deletedUsersCount > 0) {
                log.info("Cleanup successfully removed {} synthetic journals and {} test users.",
                        deletedJournalsCount, deletedUsersCount);
            } else {
                log.info("No synthetic test data found to clean up.");
            }
        } catch (Exception ex) {
            log.warn("Database cleanup encountered a non-critical issue: {}", ex.getMessage());
        }
    }

    private boolean isSyntheticJournal(JournalEntry j) {
        if (j == null) return false;
        String title = j.getTitle() != null ? j.getTitle().toLowerCase() : "";

        if (title.contains("astroai") ||
            title.contains("quantum horizons") ||
            title.contains("live verification") ||
            title.contains("public mindful journey")) {
            return true;
        }

        if (j.getUserId() != null) {
            var uOpt = userRepository.findById(j.getUserId());
            if (uOpt.isPresent()) {
                return isSyntheticUser(uOpt.get());
            }
        }
        return false;
    }

    private boolean isSyntheticUser(User u) {
        if (u == null) return false;
        String username = u.getUsername() != null ? u.getUsername().toLowerCase() : "";
        String email = u.getEmail() != null ? u.getEmail().toLowerCase() : "";
        String fullName = u.getFullName() != null ? u.getFullName().toLowerCase() : "";

        // Never delete real users
        if (email.contains("yogeshbhatt") || email.contains("sarthak") || email.contains("ashish") || email.contains("vidish") || email.contains("raghav")) {
            return false;
        }

        return username.startsWith("alice_") ||
               username.startsWith("charlie_") ||
               username.contains("alice adventurer") ||
               username.contains("mood author") ||
               username.startsWith("author_") ||
               username.contains("publication tester") ||
               fullName.contains("mood author") ||
               fullName.contains("publication tester") ||
               (email.contains("example.com") && (username.contains("test") || username.matches(".*[0-9a-f]{6}.*")));
    }
}
