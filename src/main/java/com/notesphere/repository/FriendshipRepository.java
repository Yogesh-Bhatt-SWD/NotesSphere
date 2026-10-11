package com.notesphere.repository;

import com.notesphere.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, String> {

    Optional<Friendship> findByUserAIdAndUserBId(String userAId, String userBId);

    boolean existsByUserAIdAndUserBId(String userAId, String userBId);

    @Query("SELECT f FROM Friendship f WHERE f.userAId = :userId OR f.userBId = :userId ORDER BY f.createdAt DESC")
    List<Friendship> findAllByUserId(@Param("userId") String userId);

    @Query("SELECT f FROM Friendship f WHERE (f.userAId = :userId AND f.userBId IN :targetIds) OR (f.userBId = :userId AND f.userAId IN :targetIds)")
    List<Friendship> findFriendshipsBetween(@Param("userId") String userId, @Param("targetIds") List<String> targetIds);

    default boolean areFriends(String u1, String u2) {
        if (u1 == null || u2 == null || u1.equals(u2)) return false;
        String a = u1.compareTo(u2) < 0 ? u1 : u2;
        String b = u1.compareTo(u2) < 0 ? u2 : u1;
        return existsByUserAIdAndUserBId(a, b);
    }

    default Optional<Friendship> findFriendshipBetween(String u1, String u2) {
        if (u1 == null || u2 == null || u1.equals(u2)) return Optional.empty();
        String a = u1.compareTo(u2) < 0 ? u1 : u2;
        String b = u1.compareTo(u2) < 0 ? u2 : u1;
        return findByUserAIdAndUserBId(a, b);
    }
}
