package com.notesphere.repository;

import com.notesphere.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, String> {

    List<Category> findByPredefinedTrueOrderByNameAsc();

    List<Category> findByUserIdOrderByNameAsc(String userId);

    @Query("SELECT c FROM Category c WHERE c.predefined = true OR c.userId = :userId ORDER BY c.predefined DESC, c.name ASC")
    List<Category> findAllAvailableForUser(@Param("userId") String userId);

    Optional<Category> findByNameIgnoreCaseAndUserId(String name, String userId);

    Optional<Category> findByNameIgnoreCaseAndPredefinedTrue(String name);

    boolean existsByNameIgnoreCaseAndUserId(String name, String userId);

    boolean existsByNameIgnoreCaseAndPredefinedTrue(String name);
}
