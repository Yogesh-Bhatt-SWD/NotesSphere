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
        CATEGORY_RULES.put("Mindfulness", Arrays.asList("mindful", "meditation", "breathe", "peace", "calm", "zen", "stillness", "serenity", "gratitude", "presence"));
        CATEGORY_RULES.put("Goals", Arrays.asList("goal", "milestone", "target", "vision", "aim", "ambition", "plan", "achieve", "success", "future"));
        CATEGORY_RULES.put("Daily Life", Arrays.asList("daily", "routine", "morning", "evening", "coffee", "breakfast", "dinner", "walk", "home", "today", "chores"));
        CATEGORY_RULES.put("Work & Projects", Arrays.asList("work", "job", "meeting", "boss", "colleague", "project", "deadline", "office", "career", "task", "client", "code", "backend", "feature"));
        CATEGORY_RULES.put("Reflections", Arrays.asList("reflection", "reflect", "diary", "thought", "ponder", "memory", "introspect", "feeling", "lesson", "realization"));
        CATEGORY_RULES.put("Study", Arrays.asList("school", "college", "university", "study", "exam", "class", "learn", "course", "reading", "lecture", "homework", "system design"));
        CATEGORY_RULES.put("Travel", Arrays.asList("travel", "trip", "vacation", "flight", "hotel", "tour", "journey", "holiday", "mountains", "beach", "explore"));
        CATEGORY_RULES.put("Health", Arrays.asList("health", "sick", "doctor", "hospital", "medicine", "pain", "illness", "recovery", "sleep", "nutrition", "therapy"));
        CATEGORY_RULES.put("Fitness", Arrays.asList("gym", "workout", "exercise", "run", "fitness", "yoga", "training", "sport", "weight", "cardio", "badminton"));
        CATEGORY_RULES.put("Personal Growth", Arrays.asList("habit", "growth", "discipline", "mindset", "self-improvement", "motivation", "development", "wisdom", "confidence"));
        CATEGORY_RULES.put("Other", Arrays.asList("general", "misc", "random", "other"));
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
