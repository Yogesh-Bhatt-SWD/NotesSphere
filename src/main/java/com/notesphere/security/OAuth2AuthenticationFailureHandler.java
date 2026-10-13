package com.notesphere.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private final HttpCookieOAuth2AuthorizationRequestRepository cookieAuthorizationRequestRepository;

    @Value("${app.frontend-url:https://notes-sphere-d2m4.vercel.app}")
    private String defaultFrontendUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {
        log.error("OAuth2 Authentication failed: {}", exception.getMessage(), exception);

        cookieAuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        String frontendBase = determineFrontendBaseUrl(request);
        String targetUrl = UriComponentsBuilder.fromUriString(frontendBase + "/login")
                .queryParam("error", URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8))
                .build().toUriString();

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
