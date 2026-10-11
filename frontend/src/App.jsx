import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';

// Pages
import DashboardPage from './pages/DashboardPage';
import JournalsPage from './pages/JournalsPage';
import EditorPage from './pages/EditorPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CalendarPage from './pages/CalendarPage';
import RemindersPage from './pages/RemindersPage';
import SettingsPage from './pages/SettingsPage';
import TagsPage from './pages/TagsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated Dashboard Shell Layout */}
          <Route path="/" element={<MainLayout showRightPanel={true} />}>
            <Route index element={<DashboardPage />} />
            <Route path="journals" element={<JournalsPage />} />
            <Route path="editor" element={<EditorPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="tags" element={<TagsPage />} />
            <Route path="reminders" element={<RemindersPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
