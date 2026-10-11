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
}
