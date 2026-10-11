package com.notesphere.security;

import com.notesphere.dto.response.AdminStatsResponse;
import com.notesphere.dto.response.PagedResponse;
import com.notesphere.dto.response.UserResponse;
import com.notesphere.service.AdminService;
import com.notesphere.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class RbacAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private AdminService adminService;

    @Test
    void unauthenticated_CannotAccess_AdminApis() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "regularUser", roles = {"USER"})
    void regularUser_WithRoleUser_CannotAccess_AdminApis() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "adminUser", roles = {"ADMIN"})
    void adminUser_WithRoleAdmin_CanAccess_AdminApis() throws Exception {
        when(adminService.getPlatformStats()).thenReturn(AdminStatsResponse.builder().totalUsers(10).build());

        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "regularUser", roles = {"USER"})
    void regularUser_CannotAccess_UserManagementApis() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "adminUser", roles = {"ADMIN"})
    void adminUser_CanAccess_UserManagementApis() throws Exception {
        PagedResponse<UserResponse> page = PagedResponse.<UserResponse>builder()
                .content(List.of(UserResponse.builder().id("u1").username("yogi").build()))
                .page(0)
                .size(10)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(userService.getAllUsers(any())).thenReturn(page);

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk());
    }
}
