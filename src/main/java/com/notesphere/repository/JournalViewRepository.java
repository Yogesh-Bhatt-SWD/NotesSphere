package com.notesphere.repository;

import com.notesphere.entity.JournalView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JournalViewRepository extends JpaRepository<JournalView, String> {

    Optional<JournalView> findByJournalIdAndViewerId(String journalId, String viewerId);

    boolean existsByJournalIdAndViewerId(String journalId, String viewerId);

    long countByJournalId(String journalId);
}
