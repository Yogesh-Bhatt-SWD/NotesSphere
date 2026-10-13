/**
 * API Client with JWT Bearer Token Injection and Automatic Refresh Token Rotation
 */

// Use relative '/api' so Vite proxy (in dev) and Vercel rewrites (in production)
// handle all traffic seamlessly without CORS or Mixed Content errors.
const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem('notesphere_access_token');

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(url, config);

    // If 401 Unauthorized and not an auth endpoint, attempt seamless token refresh
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      const refreshed = await attemptRefreshToken();
      if (refreshed) {
        // Retry original request with newly issued access token
        const newToken = localStorage.getItem('notesphere_access_token');
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...config, headers });
      } else {
        // Session expired and cannot be refreshed — clear tokens & notify UI
        localStorage.removeItem('notesphere_access_token');
        localStorage.removeItem('notesphere_refresh_token');
        localStorage.removeItem('notesphere_user');
        window.dispatchEvent(new CustomEvent('notesphere_session_expired'));
      }
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      let errorMsg = errorBody?.message || (response.status === 401 ? 'Authentication required. Please sign in.' : `Request failed with status ${response.status}`);
      if (errorBody?.data && typeof errorBody.data === 'object' && !Array.isArray(errorBody.data)) {
        const fieldErrors = Object.values(errorBody.data).filter(Boolean);
        if (fieldErrors.length > 0) {
          errorMsg = fieldErrors.join('. ');
        }
      }
      throw new ApiError(
        errorMsg,
        response.status,
        errorBody
      );
    }

    // Check if empty response (e.g., 204 No Content)
    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Network error', 0, null);
  }
}

// In-flight refresh promise singleton to prevent race conditions during concurrent 401s
let refreshPromise = null;

async function attemptRefreshToken() {
  const refreshToken = localStorage.getItem('notesphere_refresh_token');
  if (!refreshToken) return false;

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      // Primary backend endpoint is /api/auth/refresh-token (with fallback to /api/auth/refresh)
      let res = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      }

      if (res.ok) {
        const json = await res.json();
        const data = json?.data || json;
        if (data?.accessToken) {
          localStorage.setItem('notesphere_access_token', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('notesphere_refresh_token', data.refreshToken);
          }
          if (data.user) {
            const user = data.user;
            const normalized = {
              ...user,
              name: user.name || user.username || user.email?.split('@')[0],
            };
            localStorage.setItem('notesphere_user', JSON.stringify(normalized));
          }
          return true;
        }
      }
    } catch (err) {
      console.warn('Silent token refresh failed:', err);
    } finally {
      refreshPromise = null;
    }
    return false;
  })();

  return refreshPromise;
}

export async function downloadFile(endpoint, filename) {
  const url = `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem('notesphere_access_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new ApiError(`Download failed with status ${response.status}`, response.status, null);
  }
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export default {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, {
    method: 'POST',
    body: (typeof FormData !== 'undefined' && body instanceof FormData) ? body : JSON.stringify(body)
  }),
  put: (endpoint, body) => request(endpoint, {
    method: 'PUT',
    body: (typeof FormData !== 'undefined' && body instanceof FormData) ? body : JSON.stringify(body)
  }),
  patch: (endpoint, body) => request(endpoint, {
    method: 'PATCH',
    body: body ? ((typeof FormData !== 'undefined' && body instanceof FormData) ? body : JSON.stringify(body)) : undefined
  }),
  delete: (endpoint, body) => request(endpoint, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
  upload: (endpoint, formData) => request(endpoint, { method: 'POST', body: formData }),
  download: downloadFile,
};
