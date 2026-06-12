package com.notesphere.repository;

import com.notesphere.entity.JournalEntry;
import com.notesphere.entity.enums.SentimentLabel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * MongoDB repository for JournalEntry documents with custom queries for
 * search, filtering, and sentiment analytics.
 */
@Repository
public interface JournalEntryRepository extends MongoRepository<JournalEntry, String> {

    Page<JournalEntry> findByUserId(String userId, Pageable pageable);

    Page<JournalEntry> findByUserIdAndSentimentLabel(String userId, SentimentLabel sentimentLabel, Pageable pageable);

    @Query("{ 'userId': ?0, $or: [ " +
           "{ 'title': { $regex: ?1, $options: 'i' } }, " +
           "{ 'content': { $regex: ?1, $options: 'i' } } ] }")
    Page<JournalEntry> searchByUserIdAndQuery(String userId, String query, Pageable pageable);

    Page<JournalEntry> findByUserIdAndTagsIn(String userId, List<String> tags, Pageable pageable);

    long countByUserId(String userId);

    long countBySentimentLabel(SentimentLabel sentimentLabel);

    @Query(value = "{ 'userId': ?0 }", fields = "{ 'tags': 1 }")
    List<JournalEntry> findTagsByUserId(String userId);

    List<JournalEntry> findByUserIdOrderByCreatedAtDesc(String userId);
}
