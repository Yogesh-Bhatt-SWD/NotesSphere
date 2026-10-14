package com.notesphere.repository;

import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.enums.SentimentLabel;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Specifications for dynamic filtering and searching of journal entries.
 */
public final class JournalSpecification {

    private JournalSpecification() {
        // Utility class
    }

    public static Specification<JournalEntry> filter(
            String userId,
            String query,
            SentimentLabel sentiment,
            String category,
            String tag,
            Boolean favorite,
            Boolean pinned,
            com.notesphere.entity.enums.JournalVisibility visibility,
            Instant startDate,
            Instant endDate) {

        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always scope to the authenticated user
            predicates.add(cb.equal(root.get("userId"), userId));

            // Visibility filter (e.g. PRIVATE or COMMUNITY)
            if (visibility != null) {
                predicates.add(cb.equal(root.get("visibility"), visibility));
            }

            // Search query across title and content
            if (StringUtils.hasText(query)) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate contentMatch = cb.like(cb.lower(root.get("content")), pattern);
                predicates.add(cb.or(titleMatch, contentMatch));
            }

            // Sentiment filter
            if (sentiment != null) {
                predicates.add(cb.equal(root.get("sentimentLabel"), sentiment));
            }

            // Category filter
            if (StringUtils.hasText(category) && !"ALL".equalsIgnoreCase(category.trim())) {
                predicates.add(cb.equal(cb.lower(root.get("category")), category.trim().toLowerCase()));
            }

            // Tag filter (element collection)
            if (StringUtils.hasText(tag)) {
                predicates.add(cb.isMember(tag.trim(), root.get("tags")));
            }

            // Favorite filter
            if (favorite != null) {
                predicates.add(cb.equal(root.get("favorite"), favorite));
            }

            // Pinned filter
            if (pinned != null) {
                predicates.add(cb.equal(root.get("pinned"), pinned));
            }

            // Date range filter
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            // Distinct results in case of collection joins
            criteriaQuery.distinct(true);

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<JournalEntry> publicFeed(
            String query,
            String category,
            String tag) {
        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Strictly PUBLIC visibility
            predicates.add(cb.equal(root.get("visibility"), com.notesphere.entity.enums.JournalVisibility.PUBLIC));

            // Search query across title, content, and category
            if (StringUtils.hasText(query)) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate contentMatch = cb.like(cb.lower(root.get("content")), pattern);
                Predicate categoryMatch = cb.like(cb.lower(root.get("category")), pattern);
                predicates.add(cb.or(titleMatch, contentMatch, categoryMatch));
            }

            // Category filter
            if (StringUtils.hasText(category) && !"ALL".equalsIgnoreCase(category.trim())) {
                predicates.add(cb.equal(cb.lower(root.get("category")), category.trim().toLowerCase()));
            }

            // Tag filter (element collection)
            if (StringUtils.hasText(tag)) {
                predicates.add(cb.isMember(tag.trim(), root.get("tags")));
            }

            criteriaQuery.distinct(true);
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
