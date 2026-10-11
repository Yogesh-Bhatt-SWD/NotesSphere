package com.notesphere.repository;

import com.notesphere.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {

    Optional<Conversation> findByUserAIdAndUserBId(String userAId, String userBId);

    @Query("SELECT c FROM Conversation c WHERE c.userAId = :userId OR c.userBId = :userId ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC")
    List<Conversation> findAllForUser(@Param("userId") String userId);

    default Optional<Conversation> findBetween(String u1, String u2) {
        if (u1 == null || u2 == null || u1.equals(u2)) return Optional.empty();
        String a = u1.compareTo(u2) < 0 ? u1 : u2;
        String b = u1.compareTo(u2) < 0 ? u2 : u1;
        return findByUserAIdAndUserBId(a, b);
    }
}
