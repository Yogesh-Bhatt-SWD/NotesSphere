package com.notesphere.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Hybrid Cookie-and-Cache repository for storing OAuth2AuthorizationRequest.
 * Eliminates 'authorization_request_not_found' / session expired failures across
 * strict browsers (Safari ITP, Chrome partitioned cookies, Brave Shields) and
 * reverse-proxy setups (Vercel + EC2).
 *
 * Primary store: Encrypted HttpOnly cookie on client.
 * Secondary fallback: High-performance expiring in-memory cache keyed by cryptographic 'state' parameter.
 */
@Slf4j
@Component
public class HttpCookieOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    public static final String OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME = "oauth2_auth_request";
    public static final String REDIRECT_URI_PARAM_COOKIE_NAME = "redirect_uri";
    public static final int COOKIE_EXPIRE_SECONDS = 600; // 10 minutes TTL to accommodate 2FA & network delays

    private final ConcurrentMap<String, CachedAuthorizationRequest> stateCache = new ConcurrentHashMap<>();

    private static class CachedAuthorizationRequest {
        private final OAuth2AuthorizationRequest request;
        private final Instant expiresAt;

        CachedAuthorizationRequest(OAuth2AuthorizationRequest request, Instant expiresAt) {
            this.request = request;
            this.expiresAt = expiresAt;
        }

        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }

        OAuth2AuthorizationRequest getRequest() {
            return request;
        }
    }

    private void cleanExpiredRequests() {
        stateCache.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        cleanExpiredRequests();

        // 1. Primary check: Cookie
        OAuth2AuthorizationRequest authRequest = CookieUtils.getCookie(request, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME)
                .map(cookie -> {
                    try {
                        return CookieUtils.deserialize(cookie, OAuth2AuthorizationRequest.class);
                    } catch (Exception ex) {
                        log.warn("Failed to deserialize OAuth2 authorization request cookie: {}", ex.getMessage());
                        return null;
                    }
                })
                .orElse(null);

        if (authRequest != null) {
            return authRequest;
        }

        // 2. Resilient Fallback: State parameter lookup from in-memory cache
        // Handles cases where Safari ITP, Brave, or cross-domain proxy headers strip the cookie
        String state = request.getParameter("state");
        if (StringUtils.hasText(state)) {
            CachedAuthorizationRequest cached = stateCache.get(state.trim());
            if (cached != null) {
                if (!cached.isExpired()) {
                    log.info("OAuth2 authorization request cookie was absent or blocked; successfully recovered from state cache fallback for state: {}", state);
                    return cached.getRequest();
                } else {
                    log.warn("OAuth2 state cache entry expired for state: {}", state);
                    stateCache.remove(state.trim());
                }
            }
        }

        return null;
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                         HttpServletRequest request,
                                         HttpServletResponse response) {
        if (authorizationRequest == null) {
            removeAuthorizationRequestCookies(request, response);
            return;
        }

        cleanExpiredRequests();

        // 1. Save in state cache fallback
        if (StringUtils.hasText(authorizationRequest.getState())) {
            stateCache.put(
                    authorizationRequest.getState(),
                    new CachedAuthorizationRequest(authorizationRequest, Instant.now().plusSeconds(COOKIE_EXPIRE_SECONDS))
            );
        }

        // 2. Save in correlation cookie
        try {
            String serialized = CookieUtils.serialize(authorizationRequest);
            CookieUtils.addCookie(request, response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME, serialized, COOKIE_EXPIRE_SECONDS);

            String redirectUriAfterLogin = request.getParameter(REDIRECT_URI_PARAM_COOKIE_NAME);
            if (StringUtils.hasText(redirectUriAfterLogin)) {
                CookieUtils.addCookie(request, response, REDIRECT_URI_PARAM_COOKIE_NAME, redirectUriAfterLogin, COOKIE_EXPIRE_SECONDS);
            }
        } catch (Exception ex) {
            log.error("Failed to save OAuth2 authorization request to cookie: {}", ex.getMessage(), ex);
        }
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                                 HttpServletResponse response) {
        OAuth2AuthorizationRequest authorizationRequest = this.loadAuthorizationRequest(request);
        removeAuthorizationRequestCookies(request, response);

        if (authorizationRequest != null && authorizationRequest.getState() != null) {
            stateCache.remove(authorizationRequest.getState());
        }
        String state = request.getParameter("state");
        if (StringUtils.hasText(state)) {
            stateCache.remove(state.trim());
        }

        return authorizationRequest;
    }

    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request) {
        OAuth2AuthorizationRequest authorizationRequest = this.loadAuthorizationRequest(request);
        if (authorizationRequest != null && authorizationRequest.getState() != null) {
            stateCache.remove(authorizationRequest.getState());
        }
        String state = request.getParameter("state");
        if (StringUtils.hasText(state)) {
            stateCache.remove(state.trim());
        }
        return authorizationRequest;
    }

    public void removeAuthorizationRequestCookies(HttpServletRequest request, HttpServletResponse response) {
        CookieUtils.deleteCookie(request, response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
        CookieUtils.deleteCookie(request, response, REDIRECT_URI_PARAM_COOKIE_NAME);
    }

    // Helper methods for diagnostics and unit tests
    int getStateCacheSize() {
        cleanExpiredRequests();
        return stateCache.size();
    }

    void clearStateCache() {
        stateCache.clear();
    }

    boolean isStateCached(String state) {
        if (state == null) return false;
        CachedAuthorizationRequest cached = stateCache.get(state);
        return cached != null && !cached.isExpired();
    }
}
