package com.notesphere.repository;

import com.notesphere.entity.Community;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommunityRepository extends JpaRepository<Community, String> {

    Optional<Community> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    @Query("SELECT c FROM Community c WHERE " +
            "(:query IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(c.description) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
            "(:category IS NULL OR LOWER(c.category) = LOWER(:category))")
    Page<Community> searchCommunities(@Param("query") String query, @Param("category") String category, Pageable pageable);
}
