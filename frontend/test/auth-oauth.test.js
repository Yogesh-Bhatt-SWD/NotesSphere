import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');
const rootDir = path.resolve(__dirname, '..');

describe('NoteSphere Authentication and Google OAuth2 Test Suite', () => {

  test('1. Required authentication and OAuth files exist', () => {
    const requiredFiles = [
      'pages/LoginPage.jsx',
      'pages/RegisterPage.jsx',
      'pages/OAuth2RedirectHandler.jsx',
      'context/AuthContext.jsx',
      'api/apiClient.js',
      'api/authService.js',
      'api/userService.js',
    ];

    for (const relPath of requiredFiles) {
      const fullPath = path.join(srcDir, relPath);
      assert.ok(fs.existsSync(fullPath), `Missing required auth file: ${relPath}`);
    }
  });

  test('2. OAuth2RedirectHandler synchronizes user into AuthContext and localStorage upon successful callback', () => {
    const code = fs.readFileSync(path.join(srcDir, 'pages/OAuth2RedirectHandler.jsx'), 'utf-8');
    assert.ok(code.includes("localStorage.setItem('notesphere_access_token', token)"), 'Must save access token to localStorage');
    assert.ok(code.includes("localStorage.setItem('notesphere_refresh_token', refreshToken)"), 'Must save refresh token to localStorage');
    assert.ok(code.includes('setUser(normalized)'), 'Must immediately call setUser to update AuthContext state');
    assert.ok(code.includes("localStorage.setItem('notesphere_user', JSON.stringify(normalized))"), 'Must persist normalized user profile');
    assert.ok(code.includes('notesphere_oauth2_redirect'), 'Must retrieve and clean saved redirect target');
  });

  test('3. OAuth2RedirectHandler handles OAuth errors cleanly without infinite loops or hanging', () => {
    const code = fs.readFileSync(path.join(srcDir, 'pages/OAuth2RedirectHandler.jsx'), 'utf-8');
    assert.ok(code.includes("searchParams.get('error')"), 'Must extract error query parameter');
    assert.ok(code.includes("navigate('/login?error='"), 'Must redirect cleanly to login with encoded error');
    assert.ok(code.includes("sessionStorage.removeItem('notesphere_oauth2_redirect')"), 'Must purge stale redirect targets on error');
  });

  test('4. LoginPage parses authorization_request_not_found with actionable retry guidance', () => {
    const code = fs.readFileSync(path.join(srcDir, 'pages/LoginPage.jsx'), 'utf-8');
    assert.ok(code.includes('authorization_request_not_found'), 'LoginPage must intercept authorization_request_not_found');
    assert.ok(code.includes('Sign-in session expired or cookies were blocked'), 'Must display friendly explanation');
    assert.ok(code.includes('Continue with Google'), 'Must provide direct retry action');
    assert.ok(code.includes('aria-label="Dismiss error"'), 'Must provide dismiss button for error banner');
  });

  test('5. LoginPage recognizes access_denied as cancellation without session failure warning', () => {
    const code = fs.readFileSync(path.join(srcDir, 'pages/LoginPage.jsx'), 'utf-8');
    assert.ok(code.includes('access_denied'), 'Must check for access_denied error');
    assert.ok(code.includes('Google sign-in was cancelled'), 'Must communicate graceful cancellation');
  });

  test('6. RegisterPage handles OAuth error states and provides retry via Google button', () => {
    const code = fs.readFileSync(path.join(srcDir, 'pages/RegisterPage.jsx'), 'utf-8');
    assert.ok(code.includes('authorization_request_not_found'), 'RegisterPage must handle authorization_request_not_found');
    assert.ok(code.includes('access_denied'), 'RegisterPage must handle access_denied');
    assert.ok(code.includes('aria-label="Dismiss error"'), 'Must provide dismiss button for error banner');
    assert.ok(code.includes('window.location.href = \'/oauth2/authorization/google\''), 'Must initiate OAuth authorization correctly');
  });

  test('7. ApiClient provides automated token refresh and dispatches session-expired event', () => {
    const code = fs.readFileSync(path.join(srcDir, 'api/apiClient.js'), 'utf-8');
    assert.ok(code.includes('attemptRefreshToken'), 'ApiClient must support silent refresh token rotation');
    assert.ok(code.includes('/auth/refresh-token'), 'Must call primary refresh token endpoint');
    assert.ok(code.includes('notesphere_session_expired'), 'Must dispatch custom event when refresh fails');
    assert.ok(code.includes('refreshPromise'), 'Must use promise singleton to deduplicate concurrent refresh calls');
  });

  test('8. AuthContext manages token lifecycle, revalidation, and logout cleanup', () => {
    const code = fs.readFileSync(path.join(srcDir, 'context/AuthContext.jsx'), 'utf-8');
    assert.ok(code.includes('notesphere_session_expired'), 'Must listen for session expiration events');
    assert.ok(code.includes('logout'), 'Must expose logout method');
    assert.ok(code.includes('sessionStorage.clear()'), 'Must clean sessionStorage on logout');
    assert.ok(code.includes("localStorage.removeItem('notesphere_access_token')"), 'Must purge access token on logout');
    assert.ok(code.includes("localStorage.removeItem('notesphere_refresh_token')"), 'Must purge refresh token on logout');
  });

  test('9. Deployment routing: vercel.json and vite.config.js correctly proxy OAuth routes', () => {
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf-8'));
    const rewrites = vercelConfig.rewrites || [];
    const hasOauth2Auth = rewrites.some(r => r.source.includes('/oauth2/authorization/'));
    const hasOauth2Login = rewrites.some(r => r.source.includes('/login/oauth2/'));

    assert.ok(hasOauth2Auth, 'vercel.json must rewrite /oauth2/authorization/* to backend');
    assert.ok(hasOauth2Login, 'vercel.json must rewrite /login/oauth2/* to backend');

    const viteConfig = fs.readFileSync(path.join(rootDir, 'vite.config.js'), 'utf-8');
    assert.ok(viteConfig.includes("'/oauth2'"), 'vite.config.js must proxy /oauth2 to backend');
    assert.ok(viteConfig.includes("'/login/oauth2'"), 'vite.config.js must proxy /login/oauth2 to backend');
  });
});
