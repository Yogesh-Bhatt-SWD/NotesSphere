import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, User, Shield, FileJson, FileSpreadsheet, Check } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { mockCurrentUser } from '../mock/mockData';
import journalService from '../api/journalService';

export function SettingsPage() {
  const { user } = useAuth();
  const { toggleMobileMenu } = useOutletContext() || {};
  const currentUser = user || mockCurrentUser;

  const [name, setName] = useState(currentUser.name || currentUser.username || (user ? 'Member' : 'Arthur Fen'));
  const [email, setEmail] = useState(currentUser.email || (user ? '' : 'arthur.fen@notesphere.io'));
  const [downloading, setDownloading] = useState(null);

  const handleExport = async (format) => {
    setDownloading(format);
    try {
      if (format === 'json') {
        const res = await journalService.exportJson();
        const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notesphere-journals-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
      } else {
        const res = await journalService.exportCsv();
        const blob = new Blob([res], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notesphere-journals-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
      }
    } catch {
      // Mock fallback download for visual testing
      const sample = format === 'json'
        ? JSON.stringify({ app: 'NoteSphere', exportedAt: new Date(), journals: [] }, null, 2)
        : 'id,title,category,sentiment,created_at\nj-1,"Diary",Mindfulness,POSITIVE,2026-10-11';
      const blob = new Blob([sample], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notesphere-export.${format}`;
      a.click();
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  return (
    <div>
      <Header
        title="Settings & Profile"
        subtitle="Manage your profile information, data exports, and account preferences"
        onToggleMobileMenu={toggleMobileMenu}
      />

      <div className="center-page-body" style={{ maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Profile Details */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '30px',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} color="var(--primary)" /> Profile Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ alignSelf: 'flex-end', marginTop: '10px' }}>
            <Button variant="primary">Update Profile</Button>
          </div>
        </div>

        {/* Data Portability / Export */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '30px',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Download size={20} color="var(--primary)" /> Data Portability & Export
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Download complete archives of all your personal journals, sentiment scores, and tags.
          </p>

          <div style={{ display: 'flex', gap: '14px', marginTop: '6px' }}>
            <Button
              variant="secondary"
              icon={FileJson}
              onClick={() => handleExport('json')}
              disabled={downloading === 'json'}
            >
              {downloading === 'json' ? 'Exporting...' : 'Export as JSON'}
            </Button>
            <Button
              variant="secondary"
              icon={FileSpreadsheet}
              onClick={() => handleExport('csv')}
              disabled={downloading === 'csv'}
            >
              {downloading === 'csv' ? 'Exporting...' : 'Export as CSV'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
