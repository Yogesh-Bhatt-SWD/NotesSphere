package com.notesphere.repository;

import com.notesphere.entity.PostReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostReportRepository extends JpaRepository<PostReport, String> {

    List<PostReport> findByJournalId(String journalId);

    Page<PostReport> findByStatus(String status, Pageable pageable);

    boolean existsByJournalIdAndReporterId(String journalId, String reporterId);

    void deleteByJournalId(String journalId);
}
