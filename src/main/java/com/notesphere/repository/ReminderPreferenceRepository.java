package com.notesphere.repository;

import com.notesphere.entity.ReminderPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReminderPreferenceRepository extends JpaRepository<ReminderPreference, String> {

    Optional<ReminderPreference> findByUserId(String userId);

    List<ReminderPreference> findByEnabledTrue();

    void deleteByUserId(String userId);
}
