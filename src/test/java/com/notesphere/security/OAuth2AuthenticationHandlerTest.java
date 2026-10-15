package com.notesphere.security;

import com.notesphere.entity.RefreshToken;
import com.notesphere.entity.User;
import com.notesphere.entity.enums.AuthProvider;
import com.notesphere.repository.UserRepository;
import com.notesphere.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OAuth2AuthenticationHandlerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private HttpCookieOAuth2AuthorizationRequestRepository cookieRepository;

    @Mock
    private Authentication authentication;

    @Mock
    private OAuth2User oAuth2User;

    private OAuth2AuthenticationSuccessHandler successHandler;
    private OAuth2AuthenticationFailureHandler failureHandler;

    @BeforeEach
    void setUp() {
        successHandler = new OAuth2AuthenticationSuccessHandler(
                userRepository,
                tokenProvider,
                refreshTokenService,
                cookieRepository
        );
        ReflectionTestUtils.setField(successHandler, "defaultFrontendUrl", "https://notes-sphere-d2m4.vercel.app");

        failureHandler = new OAuth2AuthenticationFailureHandler(
                cookieRepository
        );
        ReflectionTestUtils.setField(failureHandler, "defaultFrontendUrl", "https://notes-sphere-d2m4.vercel.app");
    }

    @Test
    @DisplayName("Success Handler: creates new user if not exists, generates token pair, and redirects to frontend")
    void shouldCreateNewUserAndRedirectOnOAuthSuccess() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-Host", "notes-sphere-d2m4.vercel.app");
        request.addHeader("X-Forwarded-Proto", "https");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(authentication.getPrincipal()).thenReturn(oAuth2User);
        when(oAuth2User.getAttribute("email")).thenReturn("newuser@gmail.com");
        when(oAuth2User.getAttribute("name")).thenReturn("New User");
        when(oAuth2User.getAttribute("picture")).thenReturn("https://lh3.googleusercontent.com/photo.jpg");
        when(oAuth2User.getAttribute("sub")).thenReturn("google-sub-12345");

        when(userRepository.findByEmail("newuser@gmail.com")).thenReturn(Optional.empty());

        User savedUser = User.builder()
                .id("generated-user-uuid")
                .email("newuser@gmail.com")
                .username("New User")
                .fullName("New User")
                .provider(AuthProvider.GOOGLE)
                .providerId("google-sub-12345")
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        when(tokenProvider.generateTokenFromUserId("generated-user-uuid")).thenReturn("mock-jwt-access-token");

        RefreshToken mockRefreshToken = RefreshToken.builder()
                .token("mock-refresh-token-uuid")
                .userId("generated-user-uuid")
                .expiryDate(Instant.now().plusSeconds(604800))
                .build();
        when(refreshTokenService.createRefreshToken("generated-user-uuid")).thenReturn(mockRefreshToken);

        successHandler.onAuthenticationSuccess(request, response, authentication);

        // Verify cookies were cleaned
        verify(cookieRepository).removeAuthorizationRequestCookies(request, response);

        // Verify user creation
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User captured = userCaptor.getValue();
        assertThat(captured.getEmail()).isEqualTo("newuser@gmail.com");
        assertThat(captured.getProvider()).isEqualTo(AuthProvider.GOOGLE);
        assertThat(captured.getProviderId()).isEqualTo("google-sub-12345");

        // Verify redirect URL
        String redirectedUrl = response.getRedirectedUrl();
        assertThat(redirectedUrl).isNotNull();
        assertThat(redirectedUrl).startsWith("https://notes-sphere-d2m4.vercel.app/oauth2/redirect");
        assertThat(redirectedUrl).contains("token=mock-jwt-access-token");
        assertThat(redirectedUrl).contains("refreshToken=mock-refresh-token-uuid");
    }

    @Test
    @DisplayName("Success Handler: preserves existing user without duplicate account creation")
    void shouldUpdateExistingUserOnOAuthSuccess() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServerName("localhost");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(authentication.getPrincipal()).thenReturn(oAuth2User);
        when(oAuth2User.getAttribute("email")).thenReturn("existing@example.com");
        when(oAuth2User.getAttribute("name")).thenReturn("Existing Writer");
        when(oAuth2User.getAttribute("picture")).thenReturn("https://avatar.url/img.png");
        when(oAuth2User.getAttribute("sub")).thenReturn("google-sub-999");

        User existingUser = User.builder()
                .id("existing-user-uuid")
                .email("existing@example.com")
                .username("Existing Writer")
                .provider(AuthProvider.LOCAL)
                .build();
        when(userRepository.findByEmail("existing@example.com")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        when(tokenProvider.generateTokenFromUserId("existing-user-uuid")).thenReturn("access-token-999");
        when(refreshTokenService.createRefreshToken("existing-user-uuid")).thenReturn(
                RefreshToken.builder().token("refresh-token-999").userId("existing-user-uuid").build()
        );

        successHandler.onAuthenticationSuccess(request, response, authentication);

        String redirectedUrl = response.getRedirectedUrl();
        assertThat(redirectedUrl).startsWith("http://localhost:5173/oauth2/redirect");
        assertThat(redirectedUrl).contains("token=access-token-999");
        assertThat(redirectedUrl).contains("refreshToken=refresh-token-999");
    }

    @Test
    @DisplayName("Failure Handler: translates authorization_request_not_found into normalized error code")
    void shouldHandleAuthorizationRequestNotFoundFailureCleanly() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-Host", "notes-sphere-d2m4.vercel.app");
        request.addHeader("X-Forwarded-Proto", "https");
        MockHttpServletResponse response = new MockHttpServletResponse();

        BadCredentialsException exception = new BadCredentialsException("[authorization_request_not_found] Authorization request not found");

        failureHandler.onAuthenticationFailure(request, response, exception);

        verify(cookieRepository).removeAuthorizationRequestCookies(request, response);

        String redirectedUrl = response.getRedirectedUrl();
        assertThat(redirectedUrl).isNotNull();
        assertThat(redirectedUrl).startsWith("https://notes-sphere-d2m4.vercel.app/login");
        assertThat(redirectedUrl).contains("error=authorization_request_not_found");
    }

    @Test
    @DisplayName("Failure Handler: handles user access_denied cancellation cleanly")
    void shouldHandleAccessDeniedFailureCleanly() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        BadCredentialsException exception = new BadCredentialsException("[access_denied] The user denied the request");

        failureHandler.onAuthenticationFailure(request, response, exception);

        String redirectedUrl = response.getRedirectedUrl();
        assertThat(redirectedUrl).contains("error=access_denied");
    }

    @Test
    @DisplayName("Frontend origin resolution: respects authorized redirect_uri cookie")
    void shouldRespectAuthorizedRedirectUriCookie() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        Cookie redirectCookie = new Cookie("redirect_uri", "https://notes-sphere-d2m4.vercel.app");
        request.setCookies(redirectCookie);

        String resolved = successHandler.determineFrontendBaseUrl(request);
        assertThat(resolved).isEqualTo("https://notes-sphere-d2m4.vercel.app");
    }
}
