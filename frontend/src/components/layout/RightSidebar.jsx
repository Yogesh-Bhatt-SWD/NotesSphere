import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Smile,
  Briefcase,
  TrendingUp,
  Folder,
  BarChart2,
  Plus,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import journalService from '../../api/journalService';
import './RightSidebar.css';

export function RightSidebar({ className = '' }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const userName = user?.fullName || user?.name || user?.username || 'Member';
  const userInitial = userName.charAt(0).toUpperCase();
  const path = location.pathname;

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [activities, setActivities] = useState([]);
  const [entryDates, setEntryDates] = useState(new Set());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const startDay = (firstDayIndex + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    if (!user) {
      setActivities([]);
      setEntryDates(new Set());
      return;
    }

    journalService.getJournals({ size: 5, sortBy: 'createdAt', sortDir: 'desc' })
      .then((res) => {
        const list = res?.data?.content || [];
        setActivities(list);
        const days = new Set();
        list.forEach((j) => {
          if (j.createdAt) {
            const d = new Date(j.createdAt);
            if (d.getMonth() === month && d.getFullYear() === year) {
              days.add(d.getDate());
            }
          }
        });
        setEntryDates(days);
      })
      .catch(() => {
        setActivities([]);
        setEntryDates(new Set());
      });
  }, [user, month, year]);

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push({ day: null, empty: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      day: d,
      empty: false,
      hasEntry: entryDates.has(d),
      isActive: d === selectedDay
    });
  }

  // Calendar entries for selected date (Screen 4)
  const calendarEntries = [
    {
      id: 'cal-1',
      title: 'A Productive Day at Work',
      sentiment: 'Positive',
      category: 'Work',
      thumb: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=120&q=80'
    },
    {
      id: 'cal-2',
      title: 'Team Learning Session',
      sentiment: 'Neutral',
      category: 'Study',
      thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=120&q=80'
    },
    {
      id: 'cal-3',
      title: 'Evening Reflection',
      sentiment: 'Positive',
      category: 'Personal',
      thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=120&q=80'
    }
  ];

  return (
    <aside className={`right-sidebar ${className}`}>
      {/* 1. User Profile Widget (Common to all 4 screens) */}
      <div className="user-profile-widget" onClick={() => navigate('/settings')}>
        {currentUser?.avatarUrl || currentUser?.avatar ? (
          <img
            src={currentUser.avatarUrl || currentUser.avatar}
            alt={userName}
            className="user-avatar"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextElementSibling) {
                e.currentTarget.nextElementSibling.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          className="user-avatar-initial"
          style={{ display: (currentUser?.avatarUrl || currentUser?.avatar) ? 'none' : 'flex' }}
        >
          {userInitial}
        </div>
        <div className="user-info">
          <div className="user-name">{userName}</div>
          <div className="user-role">{currentUser?.profileLabel || currentUser?.role || 'Writer'}</div>
        </div>
        <ChevronDown size={18} className="user-chevron" />
      </div>

      {/* 2. CONTEXTUAL CONTENT BASED ON CURRENT SCREEN IN IMAGE B */}

      {/* SCREEN 2: EDITOR INSIGHTS PANEL */}
      {path === '/editor' && (
        <div className="insights-sidebar-card">
          <h3 className="insights-card-title">Journal Insights</h3>

          {/* Sentiment Emoji & Text */}
          <div className="sentiment-meter-box">
            <div className="sentiment-avatar-circle">
              <Smile size={28} />
            </div>
            <div>
              <div className="sentiment-text-label">Sentiment</div>
              <div className="sentiment-val-status">Positive</div>
            </div>
          </div>

          {/* Score & Progress Bar */}
          <div className="score-progress-box">
            <div className="score-progress-header">
              <span style={{ color: 'var(--text-muted)' }}>Score</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>0.72</span>
            </div>
            <div className="score-progress-bar-bg">
              <div className="score-progress-fill" style={{ width: '72%' }} />
            </div>
          </div>

          {/* Category */}
          <div className="category-badge-row">
            <Briefcase size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Work
            </span>
          </div>

          {/* Keywords */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Keywords
            </div>
            <div className="keywords-chips-wrap">
              {['productivity', 'team', 'progress', 'learning', 'motivation'].map((kw) => (
                <span key={kw} className="keyword-chip">{kw}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 4: CALENDAR SELECTED DATE INSPECTOR */}
      {path === '/calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <div className="date-inspector-header">
            <div className="inspector-date-title">Apr 12, 2026</div>
            <div className="inspector-entry-count">3 Journal Entries</div>
          </div>

          <div className="inspector-entries-list">
            {calendarEntries.map((item) => (
              <div key={item.id} className="inspector-entry-card" onClick={() => navigate('/editor')}>
                <img src={item.thumb} alt={item.title} className="inspector-entry-thumb" />
                <div className="inspector-entry-details">
                  <div className="inspector-entry-title">{item.title}</div>
                  <div className="inspector-badges-row">
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                      background: item.sentiment === 'Positive' ? '#D1FAE5' : '#F1F5F9',
                      color: item.sentiment === 'Positive' ? '#065F46' : '#475569'
                    }}>
                      {item.sentiment}
                    </span>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                      background: '#EFF6FF', color: '#1E40AF'
                    }}>
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="add-journal-calendar-btn" onClick={() => navigate('/editor')}>
            <Plus size={18} /> Add Journal
          </button>
        </div>
      )}

      {/* SCREEN 3: ANALYTICS RECENT INSIGHTS */}
      {path === '/analytics' && (
        <>
          {/* Mini Calendar */}
          <div className="calendar-widget">
            <div className="calendar-header">
              <div className="calendar-month-title">
                April <span>2026</span>
              </div>
              <div className="calendar-nav-buttons">
                <button className="calendar-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={14} /></button>
                <button className="calendar-nav-btn" onClick={handleNextMonth}><ChevronRight size={14} /></button>
              </div>
            </div>
            <div className="calendar-weekdays">
              <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
            </div>
            <div className="calendar-grid">
              {calendarDays.slice(0, 35).map((item, idx) => (
                <div
                  key={idx}
                  className={`calendar-cell ${item.isActive ? 'active-day' : ''}`}
                >
                  {item.day && <span>{item.day}</span>}
                  {item.hasEntry && <span className="calendar-dot" />}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Insights Card */}
          <div style={{ marginTop: '8px' }}>
            <div className="widget-section-header">
              <h4 className="widget-section-title">Recent Insights</h4>
              <span className="view-all-link" onClick={() => navigate('/analytics')}>View all</span>
            </div>

            <div className="insight-stat-item">
              <div className="insight-icon-box">
                <TrendingUp size={18} color="var(--primary)" />
              </div>
              <div>
                <div className="insight-item-title">Positive trend this week</div>
                <div className="insight-item-desc">Your mood has been improving compared to last week.</div>
              </div>
            </div>

            <div className="insight-stat-item">
              <div className="insight-icon-box">
                <Folder size={18} color="#F59E0B" />
              </div>
              <div>
                <div className="insight-item-title">Most common category</div>
                <div className="insight-item-desc">Work (28% of entries)</div>
              </div>
            </div>

            <div className="insight-stat-item">
              <div className="insight-icon-box">
                <BarChart2 size={18} color="#3B82F6" />
              </div>
              <div>
                <div className="insight-item-title">Peak journaling day</div>
                <div className="insight-item-desc">Wednesday (5 entries)</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DEFAULT / SCREEN 1: JOURNAL HISTORY & DASHBOARD */}
      {(path === '/' || path === '/journals' || path === '/tags' || path === '/settings' || path === '/reminders') && (
        <>
          {/* Mini Calendar */}
          <div className="calendar-widget">
            <div className="calendar-header">
              <div className="calendar-month-title">
                {monthNames[month]} <span>{year}</span>
              </div>
              <div className="calendar-nav-buttons">
                <button className="calendar-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={14} /></button>
                <button className="calendar-nav-btn" onClick={handleNextMonth}><ChevronRight size={14} /></button>
              </div>
            </div>
            <div className="calendar-weekdays">
              <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
            </div>
            <div className="calendar-grid">
              {calendarDays.map((item, idx) => (
                <div
                  key={idx}
                  className={`calendar-cell ${item.isActive ? 'active-day' : ''}`}
                  onClick={() => item.day && setSelectedDay(item.day)}
                >
                  {item.day && <span>{item.day}</span>}
                  {item.hasEntry && <span className="calendar-dot" />}
                </div>
              ))}
            </div>
          </div>

          {/* Today's Activities */}
          <div style={{ marginTop: '8px' }}>
            <div className="widget-section-header">
              <h4 className="widget-section-title">Today's Activities</h4>
              <span className="view-all-link" onClick={() => navigate('/journals')}>View all</span>
            </div>

            {activities.length === 0 ? (
              <div style={{
                padding: '16px 12px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                background: 'var(--bg-subtle, #f8fafc)',
                borderRadius: 'var(--radius-md)',
                marginTop: '8px'
              }}>
                No journal activities recorded today.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="activity-item-card" onClick={() => navigate(`/editor?id=${act.id}`)}>
                  {act.coverImageUrl || act.coverImage ? (
                    <img src={act.coverImageUrl || act.coverImage} alt={act.title} className="activity-thumb" />
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'var(--primary-light, #e7f8f5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary, #00B69B)',
                      flexShrink: 0
                    }}>
                      <BookOpen size={18} />
                    </div>
                  )}
                  <div className="activity-info">
                    <div className="activity-name">{act.title}</div>
                    <div className="activity-meta">
                      {act.createdAt ? new Date(act.createdAt).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </aside>
  );
}

export default RightSidebar;
