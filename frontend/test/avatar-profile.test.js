import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeAvatarUrl, getAuthorInitial } from '../src/utils/avatarUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

describe('NoteSphere Consistent Profile Photos & Avatars Test Suite', () => {

  describe('1. avatarUtils.js Unit Tests', () => {
    test('normalizeAvatarUrl handles null, undefined, empty, and literal null strings', () => {
      assert.equal(normalizeAvatarUrl(null), null);
      assert.equal(normalizeAvatarUrl(undefined), null);
      assert.equal(normalizeAvatarUrl(''), null);
      assert.equal(normalizeAvatarUrl('   '), null);
      assert.equal(normalizeAvatarUrl('null'), null);
      assert.equal(normalizeAvatarUrl('undefined'), null);
    });

    test('normalizeAvatarUrl preserves data URLs and blob URLs', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      assert.equal(normalizeAvatarUrl(dataUrl), dataUrl);

      const blobUrl = 'blob:http://localhost:5173/c7e2b69f-3d6d-4720-99c5';
      assert.equal(normalizeAvatarUrl(blobUrl), blobUrl);
    });

    test('normalizeAvatarUrl rewrites backend IP/port URLs to relative /api paths to prevent mixed-content blocking', () => {
      const rawBackendUrl = 'http://13.127.214.25:8080/api/users/user-123/avatar?v=1730000000';
      assert.equal(normalizeAvatarUrl(rawBackendUrl), '/api/users/user-123/avatar?v=1730000000');

      const localhostBackendUrl = 'http://localhost:8080/api/users/user-456/avatar';
      assert.equal(normalizeAvatarUrl(localhostBackendUrl), '/api/users/user-456/avatar');
    });

    test('normalizeAvatarUrl preserves external OAuth provider URLs', () => {
      const googlePhoto = 'https://lh3.googleusercontent.com/a/ACg8ocISomething=s96-c';
      assert.equal(normalizeAvatarUrl(googlePhoto), googlePhoto);
    });

    test('getAuthorInitial extracts uppercase initial with fallback', () => {
      assert.equal(getAuthorInitial('Alice Smith'), 'A');
      assert.equal(getAuthorInitial('bob'), 'B');
      assert.equal(getAuthorInitial(''), 'U');
      assert.equal(getAuthorInitial(null, 'Guest'), 'Guest');
      assert.equal(getAuthorInitial(undefined), 'U');
    });
  });

  describe('2. Public Journals Page & Preview Cards', () => {
    test('PublicJournalsPage imports avatar utils and renders author avatar img with fallback initial', () => {
      const code = fs.readFileSync(path.join(srcDir, 'pages/PublicJournalsPage.jsx'), 'utf-8');
      assert.ok(code.includes("import { normalizeAvatarUrl, getAuthorInitial } from '../utils/avatarUtils'"), 'Must import avatar utils');
      assert.ok(code.includes('authorAvatar = normalizeAvatarUrl'), 'Must normalize journal author avatar');
      assert.ok(code.includes('pj-author-avatar-img'), 'Must render img with pj-author-avatar-img class');
      assert.ok(code.includes('pj-author-avatar'), 'Must retain pj-author-avatar fallback initial element');
      assert.ok(code.includes('onError'), 'Must handle img onError gracefully by displaying fallback initial');
    });

    test('PublicJournalsPage.css defines circular 32px avatar dimensions for both image and fallback', () => {
      const css = fs.readFileSync(path.join(srcDir, 'pages/PublicJournalsPage.css'), 'utf-8');
      assert.ok(css.includes('.pj-author-avatar-img'), 'Must define .pj-author-avatar-img');
      assert.ok(css.includes('.pj-author-avatar'), 'Must define .pj-author-avatar');
      assert.ok(css.includes('width: 32px') && css.includes('height: 32px'), 'Must be 32x32px');
      assert.ok(css.includes('border-radius: 50%'), 'Must be circular');
    });

    test('PublicStoriesSection imports avatar utils and handles onError fallback to initial', () => {
      const code = fs.readFileSync(path.join(srcDir, 'components/landing/PublicStoriesSection.jsx'), 'utf-8');
      assert.ok(code.includes("import { normalizeAvatarUrl, getAuthorInitial } from '../../utils/avatarUtils'"), 'Must import avatar utils');
      assert.ok(code.includes('authorAvatar = normalizeAvatarUrl'), 'Must normalize story author avatar');
      assert.ok(code.includes('story-author-avatar'), 'Must render img with story-author-avatar class');
      assert.ok(code.includes('story-author-initial'), 'Must retain story-author-initial fallback element');
      assert.ok(code.includes('onError'), 'Must hide image and show initial on error');
    });
  });

  describe('3. Chat System Avatars & Real-time Update Propagation', () => {
    test('ChatPage renders participant avatar in conversation list and active chat header with fallback', () => {
      const code = fs.readFileSync(path.join(srcDir, 'pages/ChatPage.jsx'), 'utf-8');
      assert.ok(code.includes("import { normalizeAvatarUrl, getAuthorInitial } from '../utils/avatarUtils'"), 'Must import avatar utils in ChatPage');
      assert.ok(code.includes('convo.friendAvatarUrl'), 'Must inspect friendAvatarUrl in conversation items');
      assert.ok(code.includes('convo-avatar-img'), 'Must render convo-avatar-img');
      assert.ok(code.includes('chat-header-avatar-img'), 'Must render chat-header-avatar-img');
      assert.ok(code.includes('PresenceIndicator'), 'Must preserve PresenceIndicator next to avatar');
    });

    test('ChatPage listens to notesphere_profile_updated event to refresh without hard refresh', () => {
      const code = fs.readFileSync(path.join(srcDir, 'pages/ChatPage.jsx'), 'utf-8');
      assert.ok(code.includes('notesphere_profile_updated'), 'Must register notesphere_profile_updated listener');
      assert.ok(code.includes('loadConversations'), 'Must call loadConversations when avatar update occurs');
    });

    test('ChatPage.css defines circular styles for conversation and header avatars', () => {
      const css = fs.readFileSync(path.join(srcDir, 'pages/ChatPage.css'), 'utf-8');
      assert.ok(css.includes('.convo-avatar-img'), 'Must style .convo-avatar-img');
      assert.ok(css.includes('.chat-header-avatar-img'), 'Must style .chat-header-avatar-img');
      assert.ok(css.includes('width: 44px') && css.includes('height: 44px'), 'Convo avatar must be 44x44px');
      assert.ok(css.includes('width: 42px') && css.includes('height: 42px'), 'Header avatar must be 42x42px');
    });

    test('SettingsPage broadcasts notesphere_profile_updated custom event upon photo change or removal', () => {
      const code = fs.readFileSync(path.join(srcDir, 'pages/SettingsPage.jsx'), 'utf-8');
      assert.ok(code.includes("notesphere_profile_updated"), 'SettingsPage must dispatch notesphere_profile_updated');
    });
  });

  describe('4. Common Modals, Communities & Comments', () => {
    test('ContentDetailModal displays author photo with fallback initial and circular dimensions', () => {
      const code = fs.readFileSync(path.join(srcDir, 'components/common/ContentDetailModal.jsx'), 'utf-8');
      assert.ok(code.includes("import { normalizeAvatarUrl, getAuthorInitial } from '../../utils/avatarUtils'"), 'Must import avatar utils');
      assert.ok(code.includes('content-detail-avatar-img'), 'Must render content-detail-avatar-img');
      assert.ok(code.includes('content-detail-avatar'), 'Must retain content-detail-avatar fallback');

      const css = fs.readFileSync(path.join(srcDir, 'components/common/ContentDetailModal.css'), 'utf-8');
      assert.ok(css.includes('.content-detail-avatar-img'), 'Must style .content-detail-avatar-img');
    });

    test('CommentSection displays commenter avatar with fallback initial', () => {
      const code = fs.readFileSync(path.join(srcDir, 'components/common/CommentSection.jsx'), 'utf-8');
      assert.ok(code.includes("import { normalizeAvatarUrl, getAuthorInitial } from '../../utils/avatarUtils'"), 'Must import avatar utils');
      assert.ok(code.includes('comment-user-avatar-img'), 'Must render comment-user-avatar-img');
      assert.ok(code.includes('comment-user-avatar'), 'Must retain comment-user-avatar fallback');
    });

    test('CommunitiesPage displays post author avatar with fallback initial', () => {
      const code = fs.readFileSync(path.join(srcDir, 'pages/CommunitiesPage.jsx'), 'utf-8');
      assert.ok(code.includes("import { normalizeAvatarUrl, getAuthorInitial } from '../utils/avatarUtils'"), 'Must import avatar utils');
      assert.ok(code.includes('author-avatar-img'), 'Must render author-avatar-img');
      assert.ok(code.includes('author-avatar'), 'Must retain author-avatar fallback');
    });

    test('FriendsPage displays user avatars across suggestions, incoming invitations, friends list, and outgoing requests', () => {
      const code = fs.readFileSync(path.join(srcDir, 'pages/FriendsPage.jsx'), 'utf-8');
      assert.ok(code.includes("import { normalizeAvatarUrl, getAuthorInitial } from '../utils/avatarUtils'"), 'Must import avatar utils');
      assert.ok(code.includes('invitation-avatar-img'), 'Must render invitation-avatar-img');
      assert.ok(code.includes('user-avatar'), 'Must render user-avatar');
    });
  });

});
