package com.notesphere.repository;

import com.notesphere.entity.CommunityMember;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommunityMemberRepository extends JpaRepository<CommunityMember, String> {

    Optional<CommunityMember> findByCommunityIdAndUserId(String communityId, String userId);

    boolean existsByCommunityIdAndUserId(String communityId, String userId);

    List<CommunityMember> findByUserId(String userId);

    Page<CommunityMember> findByUserId(String userId, Pageable pageable);

    void deleteByCommunityIdAndUserId(String communityId, String userId);

    void deleteByUserId(String userId);

    long countByCommunityId(String communityId);
}
