package com.notesphere.security;

import com.notesphere.entity.User;
import com.notesphere.entity.enums.AuthProvider;
import com.notesphere.entity.enums.Role;
import com.notesphere.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
 * in MySQL and redirecting with a JWT token.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String googleId = oAuth2User.getAttribute("sub");

        // Find or create user
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    log.info("Creating new OAuth2 user: {}", email);
                    User newUser = User.builder()
                            .email(email)
                            .username(name)
                            .provider(AuthProvider.GOOGLE)
                            .providerId(googleId)
                            .roles(new HashSet<>(Set.of(Role.ROLE_USER)))
                            .build();
                    return userRepository.save(newUser);
                });

        // Generate JWT token
        String token = tokenProvider.generateTokenFromUserId(user.getId());

        String targetUrl = UriComponentsBuilder.fromUriString("/oauth2/redirect")
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
