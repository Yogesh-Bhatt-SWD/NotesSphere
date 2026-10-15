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
        repository.clearStateCache();
    }

    @Test
    @DisplayName("Should save, load, and remove OAuth2AuthorizationRequest via HTTPS cookies with SameSite=None and Secure")
    void shouldSaveAndLoadAuthorizationRequestViaHttpsCookies() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServerName("notes-sphere-d2m4.vercel.app");
        request.setSecure(true);
        request.setScheme("https");
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
        assertThat(setCookieHeader).contains("SameSite=None");
        assertThat(setCookieHeader).contains("Secure");
        assertThat(setCookieHeader).contains("HttpOnly");

        // Verify state is also cached in memory as fallback
        assertThat(repository.isStateCached("state-xyz-123")).isTrue();

        // Extract cookie value to simulate next request
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
        assertThat(repository.isStateCached("state-xyz-123")).isFalse();
    }

    @Test
    @DisplayName("Should use SameSite=Lax and no Secure flag when on plain HTTP")
    void shouldUseLaxOnPlainHttp() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServerName("localhost");
        request.setSecure(false);
        request.setScheme("http");
        MockHttpServletResponse response = new MockHttpServletResponse();

        OAuth2AuthorizationRequest authRequest = OAuth2AuthorizationRequest.authorizationCode()
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .clientId("test-client-id")
                .redirectUri("http://localhost:8080/login/oauth2/code/google")
                .state("state-local-123")
                .build();

        repository.saveAuthorizationRequest(authRequest, request, response);

        String setCookieHeader = response.getHeader("Set-Cookie");
        assertThat(setCookieHeader).isNotNull();
        assertThat(setCookieHeader).contains("SameSite=Lax");
        assertThat(setCookieHeader).doesNotContain("; Secure");
    }

    @Test
    @DisplayName("Should recover OAuth2AuthorizationRequest via state parameter fallback when cookie is blocked/missing")
    void shouldRecoverViaStateFallbackWhenCookieIsBlocked() {
        MockHttpServletRequest initialRequest = new MockHttpServletRequest();
        initialRequest.addHeader("X-Forwarded-Proto", "https");
        MockHttpServletResponse initialResponse = new MockHttpServletResponse();

        OAuth2AuthorizationRequest authRequest = OAuth2AuthorizationRequest.authorizationCode()
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .clientId("test-client-id")
                .redirectUri("https://notes-sphere-d2m4.vercel.app/login/oauth2/code/google")
                .state("safari-blocked-state-999")
                .build();

        // Save sets cookie and in-memory cache
        repository.saveAuthorizationRequest(authRequest, initialRequest, initialResponse);
        assertThat(repository.isStateCached("safari-blocked-state-999")).isTrue();

        // Browser drops third-party cookie, but sends state parameter back in callback URL
        MockHttpServletRequest callbackRequestWithoutCookies = new MockHttpServletRequest();
        callbackRequestWithoutCookies.setParameter("state", "safari-blocked-state-999");
        callbackRequestWithoutCookies.setParameter("code", "google-auth-code-456");

        OAuth2AuthorizationRequest loaded = repository.loadAuthorizationRequest(callbackRequestWithoutCookies);
        assertThat(loaded).isNotNull();
        assertThat(loaded.getState()).isEqualTo("safari-blocked-state-999");
        assertThat(loaded.getClientId()).isEqualTo("test-client-id");

        // Remove should cleanly purge cache even without cookies
        MockHttpServletResponse removeResponse = new MockHttpServletResponse();
        OAuth2AuthorizationRequest removed = repository.removeAuthorizationRequest(callbackRequestWithoutCookies, removeResponse);
        assertThat(removed).isNotNull();
        assertThat(removed.getState()).isEqualTo("safari-blocked-state-999");
        assertThat(repository.isStateCached("safari-blocked-state-999")).isFalse();
    }

    @Test
    @DisplayName("Should return null and protect CSRF when state is invalid, mismatched, or missing")
    void shouldReturnNullWhenStateIsMismatchedOrMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setParameter("state", "non-existent-state-foo");

        OAuth2AuthorizationRequest loaded = repository.loadAuthorizationRequest(request);
        assertThat(loaded).isNull();
    }

    @Test
    @DisplayName("Should return null gracefully when both cookie and request state are completely missing")
    void shouldReturnNullWhenCookieAndStateAreMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        OAuth2AuthorizationRequest loaded = repository.loadAuthorizationRequest(request);
        assertThat(loaded).isNull();
    }

    @Test
    @DisplayName("Should handle 1-argument removeAuthorizationRequest overload safely")
    void shouldHandleOneArgRemoveSafely() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setParameter("state", "state-single-arg");

        OAuth2AuthorizationRequest authRequest = OAuth2AuthorizationRequest.authorizationCode()
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .clientId("test-client-id")
                .redirectUri("https://notes-sphere-d2m4.vercel.app/login/oauth2/code/google")
                .state("state-single-arg")
                .build();

        repository.saveAuthorizationRequest(authRequest, request, new MockHttpServletResponse());
        assertThat(repository.isStateCached("state-single-arg")).isTrue();

        OAuth2AuthorizationRequest removed = repository.removeAuthorizationRequest(request);
        assertThat(removed).isNotNull();
        assertThat(removed.getState()).isEqualTo("state-single-arg");
        assertThat(repository.isStateCached("state-single-arg")).isFalse();
    }
}
