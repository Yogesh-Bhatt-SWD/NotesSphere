package com.notesphere.service;

import com.notesphere.dto.response.SentimentResponse;
import com.notesphere.entity.enums.SentimentLabel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * VADER (Valence Aware Dictionary and sEntiment Reasoner) sentiment analysis service.
 * 
 * Implements a rule-based sentiment analysis engine inspired by the VADER algorithm.
 */
@Slf4j
@Service
public class SentimentAnalysisService {

    // VADER Sentiment Lexicon (curated subset of commonly used words)
    private static final Map<String, Double> LEXICON = new HashMap<>();
    
    // Booster words that intensify sentiment
    private static final Map<String, Double> BOOSTER_DICT = new HashMap<>();
    
    // Negation words that flip sentiment
    private static final Set<String> NEGATION_WORDS = new HashSet<>();

    private static final double BOOSTER_INCR = 0.293;
    private static final double NEGATION_SCALAR = -0.74;

    static {
        // --- Positive sentiment words ---
        LEXICON.put("good", 1.9); LEXICON.put("great", 3.1); LEXICON.put("excellent", 3.2);
        LEXICON.put("amazing", 3.1); LEXICON.put("wonderful", 2.8); LEXICON.put("fantastic", 3.0);
        LEXICON.put("awesome", 3.1); LEXICON.put("love", 3.2); LEXICON.put("loved", 3.1);
        LEXICON.put("happy", 2.7); LEXICON.put("happiness", 2.6); LEXICON.put("joy", 2.8);
        LEXICON.put("beautiful", 2.7); LEXICON.put("brilliant", 2.9); LEXICON.put("superb", 3.0);
        LEXICON.put("outstanding", 3.1); LEXICON.put("perfect", 3.0); LEXICON.put("best", 2.8);
        LEXICON.put("better", 1.5); LEXICON.put("nice", 1.8); LEXICON.put("kind", 1.8);
        LEXICON.put("lovely", 2.5); LEXICON.put("pleasant", 1.9); LEXICON.put("pleased", 2.1);
        LEXICON.put("delighted", 2.8); LEXICON.put("thrilled", 2.9); LEXICON.put("excited", 2.6);
        LEXICON.put("grateful", 2.4); LEXICON.put("thankful", 2.3); LEXICON.put("blessed", 2.2);
        LEXICON.put("positive", 1.8); LEXICON.put("impressive", 2.3); LEXICON.put("incredible", 2.8);
        LEXICON.put("magnificent", 3.0); LEXICON.put("marvelous", 2.8); LEXICON.put("terrific", 2.7);
        LEXICON.put("successful", 2.2); LEXICON.put("accomplish", 2.0); LEXICON.put("achieve", 2.0);
        LEXICON.put("enjoy", 2.1); LEXICON.put("fun", 2.0); LEXICON.put("laugh", 1.9);
        LEXICON.put("smile", 1.8); LEXICON.put("hope", 1.6); LEXICON.put("optimistic", 2.0);
        LEXICON.put("confident", 1.9); LEXICON.put("proud", 2.2); LEXICON.put("inspire", 2.0);
        LEXICON.put("peaceful", 2.0); LEXICON.put("calm", 1.5); LEXICON.put("relaxed", 1.7);
        LEXICON.put("comfort", 1.6); LEXICON.put("warm", 1.3); LEXICON.put("helpful", 1.7);
        LEXICON.put("support", 1.3);

        // --- Negative sentiment words ---
        LEXICON.put("bad", -2.5); LEXICON.put("terrible", -3.2); LEXICON.put("horrible", -3.1);
        LEXICON.put("awful", -3.0); LEXICON.put("worst", -3.1); LEXICON.put("worse", -1.9);
        LEXICON.put("hate", -3.0); LEXICON.put("hated", -2.9); LEXICON.put("angry", -2.5);
        LEXICON.put("anger", -2.4); LEXICON.put("sad", -2.1); LEXICON.put("sadness", -2.2);
        LEXICON.put("depressed", -2.8); LEXICON.put("depression", -2.9); LEXICON.put("disappointed", -2.4);
        LEXICON.put("frustrating", -2.3); LEXICON.put("annoyed", -2.1); LEXICON.put("ugly", -2.5);
        LEXICON.put("stupid", -2.6); LEXICON.put("boring", -2.0); LEXICON.put("dull", -1.7);
        LEXICON.put("miserable", -2.8); LEXICON.put("painful", -2.3); LEXICON.put("pain", -2.1);
        LEXICON.put("suffering", -2.5); LEXICON.put("fear", -2.2); LEXICON.put("scared", -2.1);
        LEXICON.put("terrified", -2.8); LEXICON.put("anxious", -2.0); LEXICON.put("worried", -1.9);
        LEXICON.put("stress", -2.0); LEXICON.put("stressed", -2.1); LEXICON.put("lonely", -2.1);
        LEXICON.put("alone", -1.3); LEXICON.put("sick", -1.8); LEXICON.put("tired", -1.5);
        LEXICON.put("exhausted", -2.0); LEXICON.put("fail", -2.3); LEXICON.put("failure", -2.5);
        LEXICON.put("problem", -1.5); LEXICON.put("trouble", -1.7); LEXICON.put("difficult", -1.3);
        LEXICON.put("hard", -0.8); LEXICON.put("wrong", -1.8); LEXICON.put("broken", -1.9);
        LEXICON.put("destroyed", -2.7); LEXICON.put("ruined", -2.6); LEXICON.put("devastated", -2.9);
        LEXICON.put("hopeless", -2.5); LEXICON.put("helpless", -2.3); LEXICON.put("worthless", -2.7);
        LEXICON.put("useless", -2.5); LEXICON.put("disgusting", -2.8); LEXICON.put("pathetic", -2.5);
        LEXICON.put("regret", -2.0); LEXICON.put("guilty", -1.8); LEXICON.put("ashamed", -2.0);
        LEXICON.put("cry", -1.7); LEXICON.put("crying", -1.8);

        // --- Booster words (intensifiers) ---
        BOOSTER_DICT.put("very", BOOSTER_INCR);
        BOOSTER_DICT.put("really", BOOSTER_INCR);
        BOOSTER_DICT.put("extremely", BOOSTER_INCR * 2);
        BOOSTER_DICT.put("absolutely", BOOSTER_INCR * 2);
        BOOSTER_DICT.put("incredibly", BOOSTER_INCR * 2);
        BOOSTER_DICT.put("so", BOOSTER_INCR);
        BOOSTER_DICT.put("totally", BOOSTER_INCR);
        BOOSTER_DICT.put("completely", BOOSTER_INCR);
        BOOSTER_DICT.put("utterly", BOOSTER_INCR * 1.5);
        BOOSTER_DICT.put("quite", BOOSTER_INCR * 0.5);
        BOOSTER_DICT.put("rather", BOOSTER_INCR * 0.5);
        BOOSTER_DICT.put("somewhat", -BOOSTER_INCR * 0.5);
        BOOSTER_DICT.put("slightly", -BOOSTER_INCR);
        BOOSTER_DICT.put("barely", -BOOSTER_INCR);
        BOOSTER_DICT.put("hardly", -BOOSTER_INCR);

        // --- Negation words ---
        NEGATION_WORDS.addAll(Arrays.asList(
                "not", "isn't", "isnt", "wasn't", "wasnt", "aren't", "arent",
                "weren't", "werent", "haven't", "havent", "hasn't", "hasnt",
                "don't", "dont", "doesn't", "doesnt", "didn't", "didnt",
                "won't", "wont", "wouldn't", "wouldnt", "shouldn't", "shouldnt",
                "couldn't", "couldnt", "can't", "cant", "cannot", "never",
                "neither", "nor", "nobody", "nothing", "nowhere", "no"
        ));
    }

    /**
     * Analyze sentiment of the given text and return detailed scores.
     */
    public SentimentResponse analyzeSentiment(String text) {
        if (text == null || text.isBlank()) {
            return SentimentResponse.builder()
                    .label(SentimentLabel.NEUTRAL)
                    .compound(0.0)
                    .positive(0.0)
                    .negative(0.0)
                    .neutral(1.0)
                    .build();
        }

        String[] words = text.toLowerCase().replaceAll("[^a-zA-Z'\\s]", " ").split("\\s+");
        List<Double> sentiments = new ArrayList<>();

        for (int i = 0; i < words.length; i++) {
            String word = words[i].trim();
            if (word.isEmpty()) continue;

            Double valence = LEXICON.get(word);
            if (valence == null) continue;

            double score = valence;

            // Check for preceding booster word
            if (i > 0) {
                Double booster = BOOSTER_DICT.get(words[i - 1]);
                if (booster != null) {
                    score += (score > 0) ? booster : -booster;
                }
            }

            // Check for negation in the preceding 3 words
            boolean negated = false;
            for (int j = 1; j <= 3 && i - j >= 0; j++) {
                if (NEGATION_WORDS.contains(words[i - j])) {
                    negated = true;
                    break;
                }
            }
            if (negated) {
                score *= NEGATION_SCALAR;
            }

            // Punctuation amplification (exclamation marks)
            long exclamationCount = text.chars().filter(ch -> ch == '!').count();
            if (exclamationCount > 0) {
                score += (score > 0 ? 1 : -1) * Math.min(exclamationCount, 4) * 0.292;
            }

            sentiments.add(score);
        }

        // Calculate compound score (normalized between -1 and 1)
        double sumScores = sentiments.stream().mapToDouble(Double::doubleValue).sum();
        double compound = normalize(sumScores);

        // Calculate positive, negative, neutral proportions
        double posSum = sentiments.stream().filter(s -> s > 0).mapToDouble(Double::doubleValue).sum();
        double negSum = sentiments.stream().filter(s -> s < 0).mapToDouble(Math::abs).sum();
        double neuCount = sentiments.stream().filter(s -> s == 0).count();

        double total = posSum + negSum + neuCount;
        double positive, negative, neutral;

        if (total == 0) {
            positive = 0.0;
            negative = 0.0;
            neutral = 1.0;
        } else {
            positive = Math.round((posSum / total) * 1000.0) / 1000.0;
            negative = Math.round((negSum / total) * 1000.0) / 1000.0;
            neutral = Math.round((1.0 - positive - negative) * 1000.0) / 1000.0;
            neutral = Math.max(neutral, 0.0);
        }

        SentimentLabel label = classifySentiment(compound);

        log.debug("Sentiment analysis - compound: {}, label: {}, text: {}",
                compound, label, text.substring(0, Math.min(50, text.length())));

        return SentimentResponse.builder()
                .label(label)
                .compound(Math.round(compound * 10000.0) / 10000.0)
                .positive(positive)
                .negative(negative)
                .neutral(neutral)
                .build();
    }

    /**
     * Classify sentiment based on compound score using VADER thresholds.
     */
    public SentimentLabel classifySentiment(double compound) {
        if (compound >= 0.05) return SentimentLabel.POSITIVE;
        if (compound <= -0.05) return SentimentLabel.NEGATIVE;
        return SentimentLabel.NEUTRAL;
    }

    /**
     * Normalize the score to be between -1 and 1 using VADER's normalization formula.
     */
    private double normalize(double score) {
        double alpha = 15.0; // VADER normalization constant
        double norm = score / Math.sqrt(score * score + alpha);
        return Math.max(-1.0, Math.min(1.0, norm));
    }
}
