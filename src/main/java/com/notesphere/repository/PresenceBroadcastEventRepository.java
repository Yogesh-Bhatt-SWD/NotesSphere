package com.notesphere.repository;

import com.notesphere.entity.PresenceBroadcastEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface PresenceBroadcastEventRepository extends JpaRepository<PresenceBroadcastEvent, Long> {

    @Query("SELECT e FROM PresenceBroadcastEvent e WHERE e.id > :lastSeenEventId AND e.originInstanceId != :instanceId ORDER BY e.id ASC")
    List<PresenceBroadcastEvent> findNewEventsForOtherInstances(
            @Param("lastSeenEventId") long lastSeenEventId,
            @Param("instanceId") String instanceId);

    @Modifying
    @Query("DELETE FROM PresenceBroadcastEvent e WHERE e.createdAt < :threshold")
    int deleteOldEvents(@Param("threshold") Instant threshold);
}
