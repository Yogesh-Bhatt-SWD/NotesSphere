package com.notesphere.repository;

import com.notesphere.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    Page<Message> findByConversationIdOrderByCreatedAtDesc(String conversationId, Pageable pageable);

    List<Message> findByConversationIdOrderByCreatedAtAsc(String conversationId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversationId = :convoId AND m.senderId <> :userId AND m.isRead = false")
    long countUnreadMessages(@Param("convoId") String convoId, @Param("userId") String userId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversationId IN :convoIds AND m.senderId <> :userId AND m.isRead = false")
    long countTotalUnreadAcrossConversations(@Param("convoIds") List<String> convoIds, @Param("userId") String userId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true, m.readAt = :readAt WHERE m.conversationId = :convoId AND m.senderId <> :userId AND m.isRead = false")
    int markConversationMessagesAsRead(@Param("convoId") String convoId, @Param("userId") String userId, @Param("readAt") Instant readAt);
}
