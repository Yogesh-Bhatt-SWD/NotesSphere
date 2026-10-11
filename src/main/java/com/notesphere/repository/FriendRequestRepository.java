package com.notesphere.repository;

import com.notesphere.entity.FriendRequest;
import com.notesphere.entity.enums.FriendRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, String> {

    List<FriendRequest> findByReceiverIdAndStatusOrderByCreatedAtDesc(String receiverId, FriendRequestStatus status);

    List<FriendRequest> findBySenderIdAndStatusOrderByCreatedAtDesc(String senderId, FriendRequestStatus status);

    boolean existsBySenderIdAndReceiverIdAndStatus(String senderId, String receiverId, FriendRequestStatus status);

    @Query("SELECT fr FROM FriendRequest fr WHERE ((fr.senderId = :u1 AND fr.receiverId = :u2) OR (fr.senderId = :u2 AND fr.receiverId = :u1)) AND fr.status = :status")
    Optional<FriendRequest> findBetweenByStatus(@Param("u1") String u1, @Param("u2") String u2, @Param("status") FriendRequestStatus status);

    @Query("SELECT fr FROM FriendRequest fr WHERE ((fr.senderId = :u1 AND fr.receiverId = :u2) OR (fr.senderId = :u2 AND fr.receiverId = :u1)) AND fr.status = 'PENDING'")
    Optional<FriendRequest> findPendingBetween(@Param("u1") String u1, @Param("u2") String u2);

    @Query("SELECT fr FROM FriendRequest fr WHERE ((fr.senderId = :currentUserId AND fr.receiverId IN :targetUserIds) OR (fr.receiverId = :currentUserId AND fr.senderId IN :targetUserIds)) AND fr.status = 'PENDING'")
    List<FriendRequest> findPendingForUserAndTargets(@Param("currentUserId") String currentUserId, @Param("targetUserIds") List<String> targetUserIds);
}
