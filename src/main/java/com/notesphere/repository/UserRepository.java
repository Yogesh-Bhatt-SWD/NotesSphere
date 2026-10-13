package com.notesphere.repository;

import com.notesphere.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for User entities.
 */
@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    @org.springframework.data.jpa.repository.Query("SELECT u.provider, COUNT(u) FROM User u GROUP BY u.provider")
    java.util.List<Object[]> countUsersByProvider();

    org.springframework.data.domain.Page<User> findByUsernameContainingIgnoreCaseAndIdNot(String username, String currentUserId, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<User> findByIdNot(String currentUserId, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.id != :currentUserId AND (" +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')))")
    java.util.List<User> searchUsers(@org.springframework.data.repository.query.Param("query") String query, @org.springframework.data.repository.query.Param("currentUserId") String currentUserId);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%'))")
    java.util.List<User> searchAllUsers(@org.springframework.data.repository.query.Param("query") String query);
}
