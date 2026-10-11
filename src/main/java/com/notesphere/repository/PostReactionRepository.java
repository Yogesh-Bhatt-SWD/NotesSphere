package com.notesphere.repository;

import com.notesphere.entity.PostReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostReactionRepository extends JpaRepository<PostReaction, String> {

    Optional<PostReaction> findByJournalIdAndUserId(String journalId, String userId);

    boolean existsByJournalIdAndUserId(String journalId, String userId);

    int countByJournalId(String journalId);

    void deleteByJournalIdAndUserId(String journalId, String userId);

    void deleteByJournalId(String journalId);

    void deleteByUserId(String userId);
}
