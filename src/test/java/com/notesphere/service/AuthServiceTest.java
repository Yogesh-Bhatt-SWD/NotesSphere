package com.notesphere.service;

import com.notesphere.dto.request.LoginRequest;
import com.notesphere.dto.request.RefreshTokenRequest;
import com.notesphere.dto.request.RegisterRequest;
import com.notesphere.dto.response.AuthResponse;
import com.notesphere.entity.RefreshToken;
import com.notesphere.entity.User;
import com.notesphere.entity.enums.AuthProvider;
import com.notesphere.entity.enums.Role;
import com.notesphere.exception.DuplicateResourceException;
import com.notesphere.repository.UserRepository;
import com.notesphere.security.JwtTokenProvider;
import com.notesphere.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private RefreshTokenService refreshTokenService;

    @InjectMocks
    private AuthService authService;

    private User user;
    private UserPrincipal userPrincipal;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id("user123")
                .username("testuser")
                .email("test@example.com")
                .password("encoded_password")
                .provider(AuthProvider.LOCAL)
                .roles(new HashSet<>(Set.of(Role.ROLE_USER)))
                .build();

        userPrincipal = UserPrincipal.create(user);
        authentication = new UsernamePasswordAuthenticationToken(userPrincipal, null, userPrincipal.getAuthorities());
    }

    @Test
    void register_Success() {
        RegisterRequest request = new RegisterRequest("testuser", "test@example.com", "password123");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(tokenProvider.generateAccessToken(any(Authentication.class))).thenReturn("access_token");
        when(refreshTokenService.createRefreshToken(anyString())).thenReturn(RefreshToken.builder().token("refresh_token").build());

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("access_token", response.getAccessToken());
        assertEquals("refresh_token", response.getRefreshToken());
        assertEquals("testuser", response.getUser().getUsername());

        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_ThrowsDuplicateResourceException_WhenEmailExists() {
        RegisterRequest request = new RegisterRequest("testuser", "existing@example.com", "password123");

        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_Success() {
        LoginRequest request = new LoginRequest("test@example.com", "password123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(userRepository.findById(anyString())).thenReturn(Optional.of(user));
        when(tokenProvider.generateAccessToken(any(Authentication.class))).thenReturn("access_token");
        when(refreshTokenService.createRefreshToken(anyString())).thenReturn(RefreshToken.builder().token("refresh_token").build());

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("access_token", response.getAccessToken());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void refreshToken_Success() {
        RefreshTokenRequest request = new RefreshTokenRequest("valid_refresh_token");
        RefreshToken rotatedToken = RefreshToken.builder()
                .userId("user123")
                .token("new_rotated_refresh_token")
                .build();

        when(refreshTokenService.rotateRefreshToken("valid_refresh_token")).thenReturn(rotatedToken);
        when(userRepository.findById("user123")).thenReturn(Optional.of(user));
        when(tokenProvider.generateTokenFromUserId("user123")).thenReturn("new_access_token");

        AuthResponse response = authService.refreshToken(request);

        assertNotNull(response);
        assertEquals("new_access_token", response.getAccessToken());
        assertEquals("new_rotated_refresh_token", response.getRefreshToken());
        verify(refreshTokenService).rotateRefreshToken("valid_refresh_token");
    }

    @Test
    void logout_Success() {
        authService.logout("user123");
        verify(refreshTokenService).deleteByUserId("user123");
    }

    @Test
    void logoutByToken_Success() {
        authService.logoutByToken("refresh_token_to_revoke");
        verify(refreshTokenService).deleteByToken("refresh_token_to_revoke");
    }
}
