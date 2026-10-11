package com.notesphere.service;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for automatically generating tags and classifying categories based on journal content.
 * Uses a rule-based NLP approach mapping keywords to categories.
 */
@Service
public class TaggingService {

    private static final Map<String, List<String>> CATEGORY_RULES = new LinkedHashMap<>();

    static {
        CATEGORY_RULES.put("Work", Arrays.asList("work", "job", "meeting", "boss", "colleague", "project", "deadline", "office", "career"));
        CATEGORY_RULES.put("Health", Arrays.asList("health", "sick", "doctor", "hospital", "medicine", "pain", "illness", "recovery"));
        CATEGORY_RULES.put("Travel", Arrays.asList("travel", "trip", "vacation", "flight", "hotel", "tour", "journey", "holiday"));
        CATEGORY_RULES.put("Finance", Arrays.asList("money", "finance", "budget", "salary", "expense", "bank", "invest", "tax"));
        CATEGORY_RULES.put("Education", Arrays.asList("school", "college", "university", "study", "exam", "class", "learn", "course"));
        CATEGORY_RULES.put("Fitness", Arrays.asList("gym", "workout", "exercise", "run", "fitness", "yoga", "training", "sport"));
        CATEGORY_RULES.put("Family", Arrays.asList("family", "mom", "dad", "parent", "brother", "sister", "child", "kids", "wife", "husband"));
        CATEGORY_RULES.put("Social", Arrays.asList("friend", "party", "social", "hangout", "meetup", "dinner", "lunch", "event"));
        CATEGORY_RULES.put("Creative", Arrays.asList("art", "music", "write", "paint", "draw", "create", "design", "photo", "creative"));
        CATEGORY_RULES.put("Personal", Arrays.asList("goal", "habit", "reflection", "journal", "diary", "thought", "dream", "plan"));
    }

    /**
     * Auto-generate tags from text.
     */
    public Set<String> generateTags(String text) {
        if (text == null || text.isBlank()) {
            return new HashSet<>();
        }

        String lowerText = text.toLowerCase();
        Set<String> generatedTags = new HashSet<>();

        for (Map.Entry<String, List<String>> entry : CATEGORY_RULES.entrySet()) {
            String category = entry.getKey();
            List<String> keywords = entry.getValue();

            boolean matches = keywords.stream()
                    .anyMatch(keyword -> lowerText.matches(".*\\b" + keyword + "\\b.*"));

            if (matches) {
                generatedTags.add(category);
            }
        }

        return generatedTags;
    }

    /**
     * Merge auto-generated tags with user-provided tags.
     */
    public List<String> mergeTags(List<String> userTags, String text) {
        Set<String> allTags = new HashSet<>();

        if (userTags != null) {
            allTags.addAll(userTags.stream()
                    .map(String::trim)
                    .filter(t -> !t.isEmpty())
                    .collect(Collectors.toSet()));
        }

        allTags.addAll(generateTags(text));

        return new ArrayList<>(allTags);
    }

    /**
     * Classify primary category using keyword frequency scoring.
     * Returns "General" if no rule matches.
     */
    public String classifyCategory(String text) {
        if (text == null || text.isBlank()) {
            return "General";
        }

        String lowerText = text.toLowerCase();
        String bestCategory = "General";
        int maxScore = 0;

        for (Map.Entry<String, List<String>> entry : CATEGORY_RULES.entrySet()) {
            String category = entry.getKey();
            List<String> keywords = entry.getValue();

            int score = 0;
            for (String keyword : keywords) {
                if (lowerText.matches(".*\\b" + keyword + "\\b.*")) {
                    score++;
                }
            }

            if (score > maxScore) {
                maxScore = score;
                bestCategory = category;
            }
        }

        return bestCategory;
    }

    /**
     * Get all categories and their match scores.
     */
    public Map<String, Integer> getCategoriesWithScores(String text) {
        if (text == null || text.isBlank()) {
            return Collections.emptyMap();
        }

        String lowerText = text.toLowerCase();
        Map<String, Integer> scores = new HashMap<>();

        for (Map.Entry<String, List<String>> entry : CATEGORY_RULES.entrySet()) {
            String category = entry.getKey();
            List<String> keywords = entry.getValue();

            int score = 0;
            for (String keyword : keywords) {
                if (lowerText.matches(".*\\b" + keyword + "\\b.*")) {
                    score++;
                }
            }

            if (score > 0) {
                scores.put(category, score);
            }
        }

        return scores;
    }
}
