package com.notesphere.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

public class RateLimitingFilterTest {

    private RateLimitingFilter rateLimitingFilter;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        rateLimitingFilter = new RateLimitingFilter();
        filterChain = mock(FilterChain.class);
    }

    @Test
    void rateLimit_BelowThreshold_AllowsRequests() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("192.168.1.50");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitingFilter.doFilter(request, response, filterChain);

        assertEquals(200, response.getStatus());
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void rateLimit_ExceedingThreshold_Returns429TooManyRequests() throws ServletException, IOException {
        String testIp = "10.0.0.99";

        // Send 15 allowed requests
        for (int i = 0; i < 15; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
            req.setRemoteAddr(testIp);
            MockHttpServletResponse resp = new MockHttpServletResponse();
            rateLimitingFilter.doFilter(req, resp, filterChain);
            assertEquals(200, resp.getStatus());
        }

        // 16th request exceeds limit
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/auth/login");
        blockedReq.setRemoteAddr(testIp);
        MockHttpServletResponse blockedResp = new MockHttpServletResponse();

        rateLimitingFilter.doFilter(blockedReq, blockedResp, filterChain);

        assertEquals(429, blockedResp.getStatus());
        assertEquals("60", blockedResp.getHeader("Retry-After"));
    }

    @Test
    void rateLimit_NonSensitiveEndpoint_NotLimited() throws ServletException, IOException {
        String testIp = "10.0.0.88";

        // Even after 20 requests on GET /api/journals, it is not rate limited by this auth filter
        for (int i = 0; i < 20; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/journals");
            req.setRemoteAddr(testIp);
            MockHttpServletResponse resp = new MockHttpServletResponse();
            rateLimitingFilter.doFilter(req, resp, filterChain);
            assertEquals(200, resp.getStatus());
        }
    }
}
