package com.notesphere.repository;

import com.notesphere.entity.UserPresenceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Set;

@Repository
public interface UserPresenceSessionRepository extends JpaRepository<UserPresenceSession, String> {

    long countByUserId(String userId);

    boolean existsByUserId(String userId);

    List<UserPresenceSession> findByUserId(String userId);

    @Query("SELECT DISTINCT s.userId FROM UserPresenceSession s WHERE s.userId IN :userIds")
    Set<String> findOnlineUserIds(@Param("userIds") Collection<String> userIds);

    @Query("SELECT s FROM UserPresenceSession s WHERE s.lastHeartbeatAt < :threshold")
    List<UserPresenceSession> findExpiredSessions(@Param("threshold") Instant threshold);

    @Modifying
    @Query("DELETE FROM UserPresenceSession s WHERE s.userId = :userId")
    void deleteByUserId(@Param("userId") String userId);
}
