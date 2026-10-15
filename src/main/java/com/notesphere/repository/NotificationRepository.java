package com.notesphere.repository;

import com.notesphere.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    long countByUserIdAndIsReadFalse(String userId);

    boolean existsByUserIdAndTypeAndTargetId(String userId, String type, String targetId);

    Optional<Notification> findByIdAndUserId(String id, String userId);

    Optional<Notification> findFirstByUserIdAndTypeAndTargetIdOrderByCreatedAtDesc(String userId, String type, String targetId);

    default Optional<Notification> findByUserIdAndTypeAndTargetId(String userId, String type, String targetId) {
        return findFirstByUserIdAndTypeAndTargetIdOrderByCreatedAtDesc(userId, type, targetId);
    }

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.userId = :userId AND n.type = :type AND n.targetId = :targetId AND n.isRead = false")
    int markAsReadByTypeAndTargetId(@Param("userId") String userId, @Param("type") String type, @Param("targetId") String targetId, @Param("readAt") Instant readAt);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.id = :id AND n.userId = :userId AND n.isRead = false")
    int markAsRead(@Param("id") String id, @Param("userId") String userId, @Param("readAt") Instant readAt);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.userId = :userId AND n.isRead = false")
    int markAllAsRead(@Param("userId") String userId, @Param("readAt") Instant readAt);

    void deleteByIdAndUserId(String id, String userId);
}

