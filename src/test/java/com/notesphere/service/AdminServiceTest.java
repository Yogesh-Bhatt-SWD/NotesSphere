package com.notesphere.service;

import com.notesphere.dto.response.AdminStatsResponse;
import com.notesphere.dto.response.UserResponse;
import com.notesphere.entity.User;
import com.notesphere.entity.enums.AuthProvider;
import com.notesphere.entity.enums.Role;
import com.notesphere.entity.enums.SentimentLabel;
import com.notesphere.repository.JournalEntryRepository;
import com.notesphere.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JournalEntryRepository journalRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private AdminService adminService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id("u1")
                .username("adminUser")
                .email("admin@notesphere.com")
                .roles(Set.of(Role.ROLE_USER))
                .provider(AuthProvider.LOCAL)
                .build();
    }

    @Test
    void getPlatformStats_Success() {
        when(userRepository.count()).thenReturn(10L);
        when(journalRepository.count()).thenReturn(50L);
        when(journalRepository.countBySentimentLabel(SentimentLabel.POSITIVE)).thenReturn(25L);
        when(journalRepository.countBySentimentLabel(SentimentLabel.NEUTRAL)).thenReturn(15L);
        when(journalRepository.countBySentimentLabel(SentimentLabel.NEGATIVE)).thenReturn(10L);

        List<Object[]> categoryRows = List.of(new Object[]{"Work", 30L}, new Object[]{"Health", 20L});
        when(journalRepository.countAllPlatformCategories()).thenReturn(categoryRows);

        List<Object[]> providerRows = List.of(new Object[]{AuthProvider.LOCAL, 8L}, new Object[]{AuthProvider.GOOGLE, 2L});
        when(userRepository.countUsersByProvider()).thenReturn(providerRows);

        AdminStatsResponse stats = adminService.getPlatformStats();

        assertNotNull(stats);
        assertEquals(10L, stats.getTotalUsers());
        assertEquals(50L, stats.getTotalJournals());
        assertEquals(25L, stats.getSentimentBreakdown().get("POSITIVE"));
        assertEquals(30L, stats.getTopCategories().get("Work"));
        assertEquals(8L, stats.getAuthProviderBreakdown().get("LOCAL"));
    }

    @Test
    void updateUserRoles_Success() {
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(userService.mapToUserResponse(any(User.class))).thenReturn(
                UserResponse.builder().id("u1").roles(Set.of(Role.ROLE_USER, Role.ROLE_ADMIN)).build());

        UserResponse response = adminService.updateUserRoles("u1", Set.of(Role.ROLE_USER, Role.ROLE_ADMIN));

        assertNotNull(response);
        verify(userRepository).save(user);
    }
}
