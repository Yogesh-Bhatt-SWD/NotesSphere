package com.notesphere.repository;

import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.enums.SentimentLabel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Spring Data JPA repository for JournalEntry entities with specification support,
 * custom queries for search, filtering, tags, analytics, and calendar data.
 */
@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, String>, JpaSpecificationExecutor<JournalEntry> {

    Page<JournalEntry> findByUserId(String userId, Pageable pageable);

    Page<JournalEntry> findByCommunityIdAndVisibility(String communityId, com.notesphere.entity.enums.JournalVisibility visibility, Pageable pageable);

    Page<JournalEntry> findByUserIdAndVisibility(String userId, com.notesphere.entity.enums.JournalVisibility visibility, Pageable pageable);

    long countByCommunityIdAndVisibility(String communityId, com.notesphere.entity.enums.JournalVisibility visibility);

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

    long countByUserIdAndSentimentLabel(String userId, SentimentLabel sentimentLabel);

    long countByUserIdAndFavoriteTrue(String userId);

    long countByUserIdAndPinnedTrue(String userId);

    @Query("SELECT j FROM JournalEntry j WHERE j.userId = :userId")
    List<JournalEntry> findTagsByUserId(@Param("userId") String userId);

    List<JournalEntry> findByUserIdOrderByCreatedAtDesc(String userId);

    List<JournalEntry> findByUserIdOrderByCreatedAtAsc(String userId);

    @Query("SELECT j FROM JournalEntry j WHERE j.userId = :userId AND j.createdAt >= :startDate AND j.createdAt <= :endDate ORDER BY j.createdAt ASC")
    List<JournalEntry> findByUserIdAndCreatedAtBetween(
            @Param("userId") String userId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate);

    @Query("SELECT j.sentimentLabel, COUNT(j) FROM JournalEntry j WHERE j.userId = :userId GROUP BY j.sentimentLabel")
    List<Object[]> countSentimentDistributionByUserId(@Param("userId") String userId);

    @Query("SELECT j.category, COUNT(j) FROM JournalEntry j WHERE j.userId = :userId GROUP BY j.category")
    List<Object[]> countCategoryDistributionByUserId(@Param("userId") String userId);

    @Query("SELECT AVG(j.compoundScore) FROM JournalEntry j WHERE j.userId = :userId")
    Double getAverageCompoundScoreByUserId(@Param("userId") String userId);

    @Query("SELECT j.category, COUNT(j) FROM JournalEntry j GROUP BY j.category")
    List<Object[]> countAllPlatformCategories();
}
