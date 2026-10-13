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
  BookOpen,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import journalService from '../../api/journalService';
import './RightSidebar.css';

const SIDEBAR_CACHE_KEY = 'notesphere_sidebar_activities_cache';

const getCachedActivities = () => {
  try {
    const raw = sessionStorage.getItem(SIDEBAR_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return null;
};

const setCachedActivities = (data) => {
  try {
    sessionStorage.setItem(SIDEBAR_CACHE_KEY, JSON.stringify(data));
  } catch {}
};

export function RightSidebar({ className = '' }) {
  const { user } = useAuth();
  const currentUser = user;
  const location = useLocation();
  const navigate = useNavigate();

  const userName = user?.fullName || user?.name || user?.username || 'Member';
  const userInitial = userName.charAt(0).toUpperCase();
  const path = location.pathname;

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const cachedActs = getCachedActivities();
  const [activities, setActivities] = useState(() => cachedActs || []);
  const [entryDates, setEntryDates] = useState(() => {
    const set = new Set();
    const list = cachedActs || [];
    const now = new Date();
    list.forEach((j) => {
      if (j.createdAt) {
        const d = new Date(j.createdAt);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          set.add(d.getDate());
        }
      }
    });
    return set;
  });

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

  const fetchActivities = () => {
    if (!user) {
      setActivities([]);
      setEntryDates(new Set());
      return;
    }

    journalService.getJournals({ size: 10, sortBy: 'createdAt', sortDir: 'desc' })
      .then((res) => {
        const list = res?.data?.content || [];
        setActivities(list);
        setCachedActivities(list);
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
        if (!cachedActs) {
          setActivities([]);
          setEntryDates(new Set());
        }
      });
  };

  useEffect(() => {
    fetchActivities();

    const handleMutation = () => fetchActivities();
    window.addEventListener('notesphere:journal-mutated', handleMutation);
    return () => {
      window.removeEventListener('notesphere:journal-mutated', handleMutation);
    };
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

  // Real entries for selected calendar date
  const selectedDateEntries = activities.filter((j) => {
    if (!j.createdAt) return false;
    const d = new Date(j.createdAt);
    return d.getDate() === selectedDay && d.getMonth() === month && d.getFullYear() === year;
  });

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

      {/* 2. CONTEXTUAL CONTENT BASED ON CURRENT SCREEN */}

      {/* SCREEN 2: MINDFUL WRITING COMPANION */}
      {path === '/editor' && (
        <div className="insights-sidebar-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--primary-light, #e7f8f5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary, #00B69B)'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="insights-card-title" style={{ margin: 0, fontSize: '0.98rem' }}>Writing Companion</h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mindful reflection space</span>
            </div>
          </div>

          {/* Thought Prompt */}
          <div style={{
            background: 'var(--bg-subtle, #f8fafc)',
            borderRadius: 'var(--radius-md, 10px)',
            padding: '12px',
            marginBottom: '14px',
            border: '1px solid var(--border-subtle, #e2e8f0)'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
              Today's Reflection Prompt
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.45, fontStyle: 'italic' }}>
              "What moment today brought you clarity, gratitude, or a lesson worth remembering?"
            </p>
          </div>

          {/* Helpful Tips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Mindful Writing Tips
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>•</span>
              <span>Express authentic feelings without judging or self-editing.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>•</span>
              <span>Add a cover photo to visually anchor this memory.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>•</span>
              <span>Categorize and tag your entry to track your personal journey.</span>
            </div>
          </div>

          <button
            className="add-journal-calendar-btn"
            onClick={() => navigate('/journals')}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <BookOpen size={16} /> View All My Journals
          </button>
        </div>
      )}

      {/* SCREEN 4: CALENDAR SELECTED DATE INSPECTOR */}
      {path === '/calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <div className="date-inspector-header">
            <div className="inspector-date-title">
              {monthNames[month].slice(0, 3)} {selectedDay}, {year}
            </div>
            <div className="inspector-entry-count">
              {selectedDateEntries.length} {selectedDateEntries.length === 1 ? 'Journal Entry' : 'Journal Entries'}
            </div>
          </div>

          <div className="inspector-entries-list">
            {selectedDateEntries.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '28px 16px',
                background: 'var(--bg-subtle, #f8fafc)',
                borderRadius: 'var(--radius-lg, 12px)',
                border: '1px dashed var(--border-card, #e2e8f0)',
                color: 'var(--text-muted)'
              }}>
                <BookOpen size={24} style={{ margin: '0 auto 8px', opacity: 0.4, color: 'var(--primary)' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.86rem' }}>
                  No entries for this date
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Capture your thoughts for {monthNames[month].slice(0, 3)} {selectedDay}.
                </p>
              </div>
            ) : (
              selectedDateEntries.map((item) => (
                <div key={item.id} className="inspector-entry-card" onClick={() => navigate(`/editor?id=${item.id}`)}>
                  {item.coverImageUrl || item.coverImage ? (
                    <img src={item.coverImageUrl || item.coverImage} alt={item.title} className="inspector-entry-thumb" />
                  ) : (
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      background: 'var(--primary-light, #e7f8f5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary, #00B69B)',
                      flexShrink: 0
                    }}>
                      <BookOpen size={20} />
                    </div>
                  )}
                  <div className="inspector-entry-details">
                    <div className="inspector-entry-title">{item.title}</div>
                    <div className="inspector-badges-row">
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                        background: '#EFF6FF', color: '#1E40AF'
                      }}>
                        {item.category || 'Journal'}
                      </span>
                      {item.sentiment && (
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                          background: item.sentiment === 'POSITIVE' ? '#D1FAE5' : '#F1F5F9',
                          color: item.sentiment === 'POSITIVE' ? '#065F46' : '#475569'
                        }}>
                          {item.sentiment}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
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
                <div className="insight-item-title">
                  {activities.length > 0 ? `${activities.length} entries written` : 'Journal consistency'}
                </div>
                <div className="insight-item-desc">
                  {activities.length > 0
                    ? 'Consistent journaling builds mindfulness and personal growth.'
                    : 'Start capturing your daily reflections to build your streak.'}
                </div>
              </div>
            </div>

            <div className="insight-stat-item">
              <div className="insight-icon-box">
                <Folder size={18} color="#F59E0B" />
              </div>
              <div>
                <div className="insight-item-title">Active Themes</div>
                <div className="insight-item-desc">
                  {activities.length > 0
                    ? `Latest in ${activities[0]?.category || 'General'}`
                    : 'Personal reflections and daily growth'}
                </div>
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
