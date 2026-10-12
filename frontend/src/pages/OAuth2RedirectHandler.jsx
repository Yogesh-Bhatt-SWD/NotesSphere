import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../api/userService';
import LoadingSpinner from '../components/common/LoadingSpinner';

export function OAuth2RedirectHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [statusMessage, setStatusMessage] = useState('Authenticating with Google...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      setIsError(true);
      setStatusMessage(error || 'Google authentication failed. Redirecting to login...');
      setTimeout(() => navigate('/login?error=' + encodeURIComponent(error), { replace: true }), 2500);
      return;
    }

    if (token) {
      localStorage.setItem('notesphere_access_token', token);
      if (refreshToken) {
        localStorage.setItem('notesphere_refresh_token', refreshToken);
      }

      // Fetch user profile and sync with AuthContext
      userService
        .getMe()
        .then((userData) => {
          const normalized = {
            ...userData,
            name: userData.name || userData.username || userData.email?.split('@')[0] || 'Member',
          };
          localStorage.setItem('notesphere_user', JSON.stringify(normalized));
          setUser(normalized);
          navigate('/', { replace: true });
        })
        .catch((err) => {
          console.warn('Could not immediately fetch user profile after OAuth, continuing to dashboard:', err);
          navigate('/', { replace: true });
        });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, setUser]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '24px',
        gap: '16px',
      }}
    >
      <LoadingSpinner size="lg" />
      <p
        style={{
          color: isError ? 'var(--accent-coral, #EF4444)' : 'var(--text-secondary)',
          fontSize: '0.95rem',
          fontWeight: 600,
        }}
      >
        {statusMessage}
      </p>
    </div>
  );
}

export default OAuth2RedirectHandler;
