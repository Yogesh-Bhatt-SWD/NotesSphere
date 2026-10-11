package com.notesphere.repository;

import com.notesphere.entity.PostComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostCommentRepository extends JpaRepository<PostComment, String> {

    List<PostComment> findByJournalIdOrderByCreatedAtAsc(String journalId);

    Page<PostComment> findByJournalIdOrderByCreatedAtDesc(String journalId, Pageable pageable);

    int countByJournalId(String journalId);

    void deleteByJournalId(String journalId);
}
