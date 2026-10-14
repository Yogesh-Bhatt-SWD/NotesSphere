import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PresenceProvider } from './context/PresenceContext';
import MainLayout from './components/layout/MainLayout';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import JournalsPage from './pages/JournalsPage';
import EditorPage from './pages/EditorPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CalendarPage from './pages/CalendarPage';
import RemindersPage from './pages/RemindersPage';
import SettingsPage from './pages/SettingsPage';
import PublicProfilePage from './pages/PublicProfilePage';
import TagsPage from './pages/TagsPage';
import CommunitiesPage from './pages/CommunitiesPage';
import FriendsPage from './pages/FriendsPage';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OAuth2RedirectHandler from './pages/OAuth2RedirectHandler';
import BlogDetailPage from './pages/BlogDetailPage';
import SearchPage from './pages/SearchPage';
import NotFoundPage from './pages/NotFoundPage';
import PublicJournalsPage from './pages/PublicJournalsPage';

/**
 * AppShellLayout determines whether to render the public LandingPage (for logged-out visitors at '/')
 * or the authenticated MainLayout shell (for logged-in users or guarded sub-routes).
 */
function AppShellLayout() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)'
      }}>
        <div style={{
          fontSize: '0.95rem',
          color: 'var(--text-secondary)',
          fontWeight: 600
        }}>
          Loading NoteSphere...
        </div>
      </div>
    );
  }

  // 1. Logged-out visitor on root URL ('/'): render the Landing Page
  if (!isAuthenticated && location.pathname === '/') {
    return <LandingPage />;
  }

  // 2. Logged-out visitor accessing protected sub-routes: redirect to login preserving destination
  if (!isAuthenticated) {
    const redirectParam = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectParam)}`} replace />;
  }

  // 4. Authenticated user: Render standard dashboard shell with Sidebar, Center Outlet, and RightSidebar
  return <MainLayout showRightPanel={true} />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get('redirect') || '/';
    return <Navigate to={redirectUrl} replace />;
  }
  return children;
}

export function App() {
  return (
    <AuthProvider>
      <PresenceProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

            {/* Direct Landing & Explore Aliases */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/explore" element={<Navigate to="/public-journals" replace />} />
            <Route path="/stories" element={<Navigate to="/public-journals" replace />} />

            {/* Shareable Blog Detail Page (Public Preview + Login Gate) */}
            <Route path="/blogs/:slug" element={<BlogDetailPage />} />

            {/* Root Application Shell Layout */}
            <Route path="/" element={<AppShellLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="journals" element={<JournalsPage />} />
              <Route path="public-journals" element={<PublicJournalsPage />} />
              <Route path="editor" element={<EditorPage />} />
              <Route path="communities" element={<CommunitiesPage />} />
              <Route path="friends" element={<FriendsPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="tags" element={<TagsPage />} />
              <Route path="reminders" element={<RemindersPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile/:userId" element={<PublicProfilePage />} />
              <Route path="profile" element={<Navigate to="/settings" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PresenceProvider>
    </AuthProvider>
  );
}

export default App;

