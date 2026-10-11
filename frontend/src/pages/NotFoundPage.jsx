import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileQuestion } from 'lucide-react';
import Button from '../components/common/Button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '30px'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: 'var(--primary-light)',
        color: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <FileQuestion size={40} />
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Page Not Found</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '24px' }}>
        The journal page you're looking for might have been moved, deleted, or doesn't exist yet.
      </p>
      <Button variant="primary" icon={Home} onClick={() => navigate('/')}>
        Back to Dashboard
      </Button>
    </div>
  );
}

export default NotFoundPage;
