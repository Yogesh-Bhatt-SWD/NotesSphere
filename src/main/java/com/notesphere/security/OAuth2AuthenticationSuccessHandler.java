package com.notesphere.security;

import com.notesphere.entity.User;
import com.notesphere.entity.enums.AuthProvider;
import com.notesphere.entity.enums.Role;
import com.notesphere.repository.UserRepository;
import com.notesphere.service.RefreshTokenService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

/**
 * Handles successful OAuth2 authentication by creating or updating the user
 * in MySQL and redirecting to the frontend application with JWT access & refresh tokens.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenService refreshTokenService;

    @Value("${app.frontend-url:https://notes-sphere-d2m4.vercel.app}")
    private String defaultFrontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String googleId = oAuth2User.getAttribute("sub");

        if (name == null || name.trim().isEmpty()) {
            name = (email != null && email.contains("@")) ? email.split("@")[0] : "Google User";
        }

        final String resolvedName = name.trim();
        final String resolvedPicture = picture;

        // Find or create user
        User user = userRepository.findByEmail(email)
                .map(existing -> {
                    if (existing.getProvider() == null || existing.getProvider() == AuthProvider.LOCAL) {
                        existing.setProvider(AuthProvider.GOOGLE);
                    }
                    if (existing.getProviderId() == null) {
                        existing.setProviderId(googleId);
                    }
                    if (existing.getAvatarUrl() == null && resolvedPicture != null) {
                        existing.setAvatarUrl(resolvedPicture);
                    }
                    return userRepository.save(existing);
                })
                .orElseGet(() -> {
                    log.info("Creating new Google OAuth2 user: {}", email);
                    User newUser = User.builder()
                            .email(email)
                            .username(resolvedName)
                            .fullName(resolvedName)
                            .avatarUrl(resolvedPicture)
                            .provider(AuthProvider.GOOGLE)
                            .providerId(googleId)
                            .roles(new HashSet<>(Set.of(Role.ROLE_USER)))
                            .build();
                    return userRepository.save(newUser);
                });

        // Generate JWT token & refresh token
        String token = tokenProvider.generateTokenFromUserId(user.getId());
        String refreshToken = refreshTokenService.createRefreshToken(user.getId()).getToken();

        // Determine frontend target origin
        String frontendBase = determineFrontendBaseUrl(request);

        String targetUrl = UriComponentsBuilder.fromUriString(frontendBase + "/oauth2/redirect")
                .queryParam("token", token)
                .queryParam("refreshToken", refreshToken)
                .build().toUriString();

        log.info("Google OAuth2 login successful for user: {}. Redirecting to: {}", email, targetUrl);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String determineFrontendBaseUrl(HttpServletRequest request) {
        String xForwardedHost = request.getHeader("X-Forwarded-Host");
        if (xForwardedHost != null && !xForwardedHost.isBlank()) {
            String host = xForwardedHost.split(",")[0].trim();
            String xProto = request.getHeader("X-Forwarded-Proto");
            String proto = (xProto != null && !xProto.isBlank()) ? xProto.split(",")[0].trim() : "https";
            return proto + "://" + host;
        }

        String referer = request.getHeader("Referer");
        if (referer != null && referer.contains("notes-sphere-d2m4.vercel.app")) {
            return "https://notes-sphere-d2m4.vercel.app";
        }

        String serverName = request.getServerName();
        if ("localhost".equalsIgnoreCase(serverName) || "127.0.0.1".equals(serverName)) {
            return "http://localhost:5173";
        }

        return defaultFrontendUrl;
    }
}
