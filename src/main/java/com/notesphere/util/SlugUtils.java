package com.notesphere.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Utility class for generating clean, URL-safe, globally unique slugs for shareable blog links.
 */
public final class SlugUtils {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]+");
    private static final Pattern MULTI_DASH = Pattern.compile("-+");

    private SlugUtils() {
    }

    /**
     * Converts a title into a URL-friendly slug and appends a short unique identifier suffix.
     * Example: "My Mindful Journey in 2026!" -> "my-mindful-journey-in-2026-a1b2c3d4"
     */
    public static String toSlug(String title, String id) {
        String base = toSlugBase(title);
        String suffix = (id != null && id.length() >= 8)
                ? id.substring(0, 8).toLowerCase(Locale.ENGLISH)
                : UUID.randomUUID().toString().substring(0, 8);

        if (base.isEmpty()) {
            return "blog-" + suffix;
        }

        return base + "-" + suffix;
    }

    /**
     * Generates a clean base slug without suffix.
     */
    public static String toSlugBase(String input) {
        if (input == null || input.trim().isEmpty()) {
            return "";
        }

        String nowhitespace = WHITESPACE.matcher(input.trim()).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NON_LATIN.matcher(normalized).replaceAll("");
        slug = MULTI_DASH.matcher(slug).replaceAll("-");
        slug = slug.toLowerCase(Locale.ENGLISH);

        // Remove leading/trailing dashes
        if (slug.startsWith("-")) {
            slug = slug.substring(1);
        }
        if (slug.endsWith("-")) {
            slug = slug.substring(0, slug.length() - 1);
        }

        // Limit length
        if (slug.length() > 60) {
            slug = slug.substring(0, 60);
            if (slug.endsWith("-")) {
                slug = slug.substring(0, slug.length() - 1);
            }
        }

        return slug;
    }

    /**
     * Estimates reading time in minutes based on content word count (assuming 200 words per minute).
     */
    public static int estimateReadingTime(String content) {
        if (content == null || content.trim().isEmpty()) {
            return 1;
        }
        String[] words = content.trim().split("\\s+");
        return Math.max(1, (int) Math.ceil((double) words.length / 200.0));
    }

    /**
     * Extracts an introductory preview excerpt (up to maxLength characters) without cutting words awkwardly.
     */
    public static String extractExcerpt(String content, int maxLength) {
        if (content == null || content.trim().isEmpty()) {
            return "Read this mindful reflection on NoteSphere.";
        }
        String clean = content.trim().replaceAll("\\s+", " ");
        if (clean.length() <= maxLength) {
            return clean;
        }
        // Cut at word boundary
        int lastSpace = clean.lastIndexOf(' ', maxLength);
        if (lastSpace > 50) {
            return clean.substring(0, lastSpace) + "...";
        }
        return clean.substring(0, maxLength) + "...";
    }
}
