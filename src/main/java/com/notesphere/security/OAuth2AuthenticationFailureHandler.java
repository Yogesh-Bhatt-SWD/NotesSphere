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
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

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

        String rawMsg = exception.getMessage() != null ? exception.getMessage() : "authentication_failed";
        String normalizedError;
        if (rawMsg.contains("authorization_request_not_found")) {
            normalizedError = "authorization_request_not_found";
        } else if (rawMsg.contains("access_denied")) {
            normalizedError = "access_denied";
        } else {
            normalizedError = rawMsg;
        }

        String frontendBase = determineFrontendBaseUrl(request);
        String targetUrl = UriComponentsBuilder.fromUriString(frontendBase + "/login")
                .queryParam("error", normalizedError)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    String determineFrontendBaseUrl(HttpServletRequest request) {
        // 1. Check redirect_uri cookie if present and authorized
        var redirectCookie = CookieUtils.getCookie(request, HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_PARAM_COOKIE_NAME);
        if (redirectCookie.isPresent() && StringUtils.hasText(redirectCookie.get().getValue())) {
            String target = redirectCookie.get().getValue().trim();
            if (isAuthorizedFrontendUrl(target)) {
                return target;
            }
        }

        // 2. Check X-Forwarded-Host from reverse proxies (Vercel, AWS ALB, Nginx)
        String xForwardedHost = request.getHeader("X-Forwarded-Host");
        if (xForwardedHost != null && !xForwardedHost.isBlank()) {
            String host = xForwardedHost.split(",")[0].trim();
            String xProto = request.getHeader("X-Forwarded-Proto");
            String proto = (xProto != null && !xProto.isBlank()) ? xProto.split(",")[0].trim() : "https";
            String candidate = proto + "://" + host;
            if (isAuthorizedFrontendUrl(candidate)) {
                return candidate;
            }
        }

        // 3. Check Referer
        String referer = request.getHeader("Referer");
        if (referer != null) {
            if (referer.contains("notes-sphere-d2m4.vercel.app")) {
                return "https://notes-sphere-d2m4.vercel.app";
            }
            if (referer.contains("localhost:5173") || referer.contains("127.0.0.1:5173")) {
                return "http://localhost:5173";
            }
            if (referer.contains("localhost:3000")) {
                return "http://localhost:3000";
            }
        }

        String serverName = request.getServerName();
        if ("localhost".equalsIgnoreCase(serverName) || "127.0.0.1".equals(serverName)) {
            return "http://localhost:5173";
        }

        return defaultFrontendUrl;
    }

    private boolean isAuthorizedFrontendUrl(String url) {
        if (url == null || url.isBlank()) return false;
        return url.startsWith("https://notes-sphere-d2m4.vercel.app")
                || url.matches("^https://[a-zA-Z0-9-]+\\.vercel\\.app.*")
                || url.startsWith("http://localhost:")
                || url.startsWith("http://127.0.0.1:");
    }
}
