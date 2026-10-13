package com.notesphere.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

import java.io.Serializable;
import java.util.Base64;
import java.util.Optional;

/**
 * Utility class for managing HTTP cookies with proper Secure, SameSite, and HttpOnly attributes,
 * particularly for stateless OAuth2 authorization request persistence across proxies.
 */
public final class CookieUtils {

    private CookieUtils() {
    }

    public static Optional<Cookie> getCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null && cookies.length > 0) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    return Optional.of(cookie);
                }
            }
        }
        return Optional.empty();
    }

    public static void addCookie(HttpServletRequest request,
                                 HttpServletResponse response,
                                 String name,
                                 String value,
                                 int maxAge) {
        boolean isSecure = isSecureRequest(request);

        ResponseCookie cookie = ResponseCookie.from(name, value)
                .path("/")
                .httpOnly(true)
                .maxAge(maxAge)
                .secure(isSecure)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public static void deleteCookie(HttpServletRequest request,
                                    HttpServletResponse response,
                                    String name) {
        boolean isSecure = isSecureRequest(request);

        ResponseCookie cookie = ResponseCookie.from(name, "")
                .path("/")
                .httpOnly(true)
                .maxAge(0)
                .secure(isSecure)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public static String serialize(Serializable object) {
        try (java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
             java.io.ObjectOutputStream oos = new java.io.ObjectOutputStream(baos)) {
            oos.writeObject(object);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(baos.toByteArray());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Failed to serialize object", ex);
        }
    }

    @SuppressWarnings("unchecked")
    public static <T> T deserialize(Cookie cookie, Class<T> cls) {
        byte[] bytes = Base64.getUrlDecoder().decode(cookie.getValue());
        try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(bytes);
             java.io.ObjectInputStream ois = new java.io.ObjectInputStream(bais)) {
            return (T) ois.readObject();
        } catch (Exception ex) {
            throw new IllegalArgumentException("Failed to deserialize cookie", ex);
        }
    }

    private static boolean isSecureRequest(HttpServletRequest request) {
        if (request == null) {
            return true;
        }
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        if (forwardedProto != null && "https".equalsIgnoreCase(forwardedProto.split(",")[0].trim())) {
            return true;
        }
        if (request.isSecure()) {
            return true;
        }
        String serverName = request.getServerName();
        // If not localhost, assume HTTPS in production
        return serverName != null && !"localhost".equalsIgnoreCase(serverName) && !"127.0.0.1".equals(serverName);
    }
}
