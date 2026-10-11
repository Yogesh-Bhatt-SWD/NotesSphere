package com.notesphere.repository;

import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.enums.SentimentLabel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for JournalEntry entities with custom queries
 * for search, filtering, and sentiment analytics.
 */
@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, String> {

    Page<JournalEntry> findByUserId(String userId, Pageable pageable);

    Page<JournalEntry> findByUserIdAndSentimentLabel(String userId, SentimentLabel sentimentLabel, Pageable pageable);

    @Query(value = "SELECT j FROM JournalEntry j WHERE j.userId = :userId AND " +
                   "(LOWER(j.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                   "LOWER(j.content) LIKE LOWER(CONCAT('%', :query, '%')))",
           countQuery = "SELECT COUNT(j) FROM JournalEntry j WHERE j.userId = :userId AND " +
                        "(LOWER(j.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                        "LOWER(j.content) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<JournalEntry> searchByUserIdAndQuery(@Param("userId") String userId, @Param("query") String query, Pageable pageable);

    @Query(value = "SELECT DISTINCT j FROM JournalEntry j JOIN j.tags t WHERE j.userId = :userId AND t IN :tags",
           countQuery = "SELECT COUNT(DISTINCT j) FROM JournalEntry j JOIN j.tags t WHERE j.userId = :userId AND t IN :tags")
    Page<JournalEntry> findByUserIdAndTagsIn(@Param("userId") String userId, @Param("tags") List<String> tags, Pageable pageable);

    long countByUserId(String userId);

    long countBySentimentLabel(SentimentLabel sentimentLabel);

    @Query("SELECT j FROM JournalEntry j WHERE j.userId = :userId")
    List<JournalEntry> findTagsByUserId(@Param("userId") String userId);

    List<JournalEntry> findByUserIdOrderByCreatedAtDesc(String userId);
}
