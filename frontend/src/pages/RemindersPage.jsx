import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BellRing, Clock, Mail, CheckCircle2, Save } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';

export function RemindersPage() {
  const { toggleMobileMenu } = useOutletContext() || {};

  const [enabled, setEnabled] = useState(true);
  const [time, setTime] = useState('21:00');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div>
      <Header
        title="Mindful Reminders"
        subtitle="Configure daily reminders to protect and maintain your journaling streaks"
        onToggleMobileMenu={toggleMobileMenu}
      />

      <div className="center-page-body" style={{ maxWidth: '780px' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Main Toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Daily Journaling Prompt</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Receive a nudge when it's time to log your evening reflection
              </p>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              style={{ width: '22px', height: '22px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>

          {/* Time Picker */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={20} color="var(--primary)" />
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>Scheduled Notification Time</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Local system timezone</div>
              </div>
            </div>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={!enabled}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-input)',
                fontSize: '1rem',
                fontWeight: 600
              }}
            />
          </div>

          {/* Delivery Channels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Delivery Channels</h4>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inAppAlerts}
                onChange={(e) => setInAppAlerts(e.target.checked)}
                disabled={!enabled}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                In-App Dashboard Alerts
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                disabled={!enabled}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Email Notifications (active when email provider is configured)
              </span>
            </label>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            {savedMessage && (
              <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 600 }}>
                <CheckCircle2 size={18} /> Preferences updated successfully!
              </span>
            )}
            <div style={{ marginLeft: 'auto' }}>
              <Button variant="primary" icon={Save} onClick={handleSave}>
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RemindersPage;
