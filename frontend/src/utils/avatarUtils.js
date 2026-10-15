/**
 * Utilities for normalizing and displaying user profile photos consistently across NoteSphere.
 */

/**
 * Normalizes avatar URLs to prevent mixed-content blocking (HTTP on HTTPS)
 * and safely support relative, absolute, blob, and base64 data URLs.
 */
export function normalizeAvatarUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;

  // Inline data URLs and blob URLs are returned verbatim
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // If the URL has an absolute backend IP / port (e.g., http://13.127.214.25:8080/api/users/...),
  // extract the relative '/api/...' path so Vite proxy and Vercel edge rewrites route it cleanly
  // over the current page's HTTPS origin without Mixed Content errors.
  const apiIndex = trimmed.indexOf('/api/');
  if (apiIndex !== -1 && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
    // Only rewrite if it's our backend host/IP or localhost
    if (trimmed.includes(':8080') || trimmed.includes('13.127.214.25') || trimmed.includes('localhost')) {
      return trimmed.substring(apiIndex);
    }
  }

  return trimmed;
}

/**
 * Extracts a single uppercase initial from a user's name or username.
 */
export function getAuthorInitial(name, fallback = 'U') {
  if (!name || typeof name !== 'string') return fallback;
  const clean = name.trim();
  return clean.length > 0 ? clean.charAt(0).toUpperCase() : fallback;
}
