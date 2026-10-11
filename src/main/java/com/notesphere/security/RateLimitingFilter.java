package com.notesphere.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.notesphere.dto.response.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding-window rate limiter filter for sensitive authentication endpoints
 * (/api/auth/login, /api/auth/register) to prevent brute-force and credential stuffing attacks.
 */
@Slf4j
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_WINDOW = 15;
    private static final long WINDOW_DURATION_SECONDS = 60;

    private static final Map<String, ClientWindow> CLIENT_REQUESTS = new ConcurrentHashMap<>();

    private static class ClientWindow {
        int count;
        Instant windowStart;

        ClientWindow(int count, Instant windowStart) {
            this.count = count;
            this.windowStart = windowStart;
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // Apply rate limit specifically to sensitive authentication POST endpoints
        if ("POST".equalsIgnoreCase(method) &&
                (path.endsWith("/api/auth/login") || path.endsWith("/api/auth/register"))) {

            String clientIp = extractClientIp(request);

            if (isRateLimited(clientIp)) {
                log.warn("Rate limit exceeded for IP {} on path {}", clientIp, path);
                response.setStatus(429); // 429 Too Many Requests
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setHeader("Retry-After", String.valueOf(WINDOW_DURATION_SECONDS));

                ApiResponse<Void> apiResponse = ApiResponse.error(
                        "Too many requests. Please wait a moment before trying again.");

                new ObjectMapper().findAndRegisterModules().writeValue(response.getOutputStream(), apiResponse);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private synchronized boolean isRateLimited(String clientIp) {
        Instant now = Instant.now();
        ClientWindow window = CLIENT_REQUESTS.get(clientIp);

        if (window == null || now.isAfter(window.windowStart.plusSeconds(WINDOW_DURATION_SECONDS))) {
            CLIENT_REQUESTS.put(clientIp, new ClientWindow(1, now));
            cleanOldEntries(now);
            return false;
        }

        if (window.count >= MAX_REQUESTS_PER_WINDOW) {
            return true;
        }

        window.count++;
        return false;
    }

    private void cleanOldEntries(Instant now) {
        if (CLIENT_REQUESTS.size() > 1000) {
            CLIENT_REQUESTS.entrySet().removeIf(
                    entry -> now.isAfter(entry.getValue().windowStart.plusSeconds(WINDOW_DURATION_SECONDS)));
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
