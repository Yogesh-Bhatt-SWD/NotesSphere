package com.notesphere.security;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import static org.assertj.core.api.Assertions.assertThat;

class HttpCookieOAuth2AuthorizationRequestRepositoryTest {

    private HttpCookieOAuth2AuthorizationRequestRepository repository;

    @BeforeEach
    void setUp() {
        repository = new HttpCookieOAuth2AuthorizationRequestRepository();
    }

    @Test
    @DisplayName("Should save, load, and remove OAuth2AuthorizationRequest via HTTP cookies")
    void shouldSaveAndLoadAuthorizationRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServerName("notes-sphere-d2m4.vercel.app");
        MockHttpServletResponse response = new MockHttpServletResponse();

        OAuth2AuthorizationRequest authRequest = OAuth2AuthorizationRequest.authorizationCode()
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .clientId("test-client-id")
                .redirectUri("https://notes-sphere-d2m4.vercel.app/login/oauth2/code/google")
                .state("state-xyz-123")
                .build();

        // 1. Save
        repository.saveAuthorizationRequest(authRequest, request, response);

        String setCookieHeader = response.getHeader("Set-Cookie");
        assertThat(setCookieHeader).isNotNull();
        assertThat(setCookieHeader).contains(HttpCookieOAuth2AuthorizationRequestRepository.OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
        assertThat(setCookieHeader).contains("SameSite=Lax");
        assertThat(setCookieHeader).contains("Secure");
        assertThat(setCookieHeader).contains("HttpOnly");

        // Extract cookie value for simulate next request
        Cookie[] cookies = response.getCookies();
        assertThat(cookies).isNotEmpty();
        Cookie authCookie = null;
        for (Cookie c : cookies) {
            if (HttpCookieOAuth2AuthorizationRequestRepository.OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME.equals(c.getName())) {
                authCookie = c;
                break;
            }
        }
        assertThat(authCookie).isNotNull();

        // 2. Load
        MockHttpServletRequest callbackRequest = new MockHttpServletRequest();
        callbackRequest.setCookies(authCookie);

        OAuth2AuthorizationRequest loaded = repository.loadAuthorizationRequest(callbackRequest);
        assertThat(loaded).isNotNull();
        assertThat(loaded.getState()).isEqualTo("state-xyz-123");
        assertThat(loaded.getClientId()).isEqualTo("test-client-id");
        assertThat(loaded.getRedirectUri()).isEqualTo("https://notes-sphere-d2m4.vercel.app/login/oauth2/code/google");

        // 3. Remove
        MockHttpServletResponse removeResponse = new MockHttpServletResponse();
        OAuth2AuthorizationRequest removed = repository.removeAuthorizationRequest(callbackRequest, removeResponse);
        assertThat(removed).isNotNull();
        assertThat(removed.getState()).isEqualTo("state-xyz-123");

        String deleteCookieHeader = removeResponse.getHeader("Set-Cookie");
        assertThat(deleteCookieHeader).isNotNull();
        assertThat(deleteCookieHeader).contains("Max-Age=0");
    }

    @Test
    @DisplayName("Should return null gracefully when cookie is missing or empty")
    void shouldReturnNullWhenCookieIsMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        OAuth2AuthorizationRequest loaded = repository.loadAuthorizationRequest(request);
        assertThat(loaded).isNull();
    }
}
