/**
 * API Client with JWT Bearer Token Injection and Automatic Refresh Token Rotation
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

  const headers = {
    'Content-Type': 'application/json',
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

    // If 401 Unauthorized and not already refreshing, try refresh token rotation
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      const refreshed = await attemptRefreshToken();
      if (refreshed) {
        // Retry original request with newly issued access token
        const newToken = localStorage.getItem('notesphere_access_token');
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...config, headers });
      } else {
        // Session dead, clear tokens
        localStorage.removeItem('notesphere_access_token');
        localStorage.removeItem('notesphere_refresh_token');
        localStorage.removeItem('notesphere_user');
      }
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new ApiError(
        errorBody?.message || `Request failed with status ${response.status}`,
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

async function attemptRefreshToken() {
  const refreshToken = localStorage.getItem('notesphere_refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.data?.accessToken) {
        localStorage.setItem('notesphere_access_token', data.data.accessToken);
        if (data.data.refreshToken) {
          localStorage.setItem('notesphere_refresh_token', data.data.refreshToken);
        }
        return true;
      }
    }
  } catch {
    // refresh attempt failed
  }
  return false;
}

export default {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
