import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Rocket,
  MoreVertical,
  ChevronRight as ArrowIcon
} from 'lucide-react';
import {
  mockCurrentUser,
  mockTodayActivities,
  mockUpcomingReminders,
  mockCalendarDatesWithEntries
} from '../../mock/mockData';
import { useAuth } from '../../context/AuthContext';
import './RightSidebar.css';

export function RightSidebar({ className = '' }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const currentUser = user || mockCurrentUser;

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

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

  // Generate calendar days for current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  // Adjust so Monday is 0:
  const startDay = (firstDayIndex + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  // Empty slots before first day
  for (let i = 0; i < startDay; i++) {
    calendarDays.push({ day: null, empty: true });
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      day: d,
      empty: false,
      hasEntry: mockCalendarDatesWithEntries.includes(d),
      isActive: d === selectedDay
    });
  }

  return (
    <aside className={`right-sidebar ${className}`}>
      {/* 1. User Profile Widget */}
      <div className="user-profile-widget" onClick={() => navigate('/settings')}>
        <img
          src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80"}
          alt={currentUser.name}
          className="user-avatar"
        />
        <div className="user-info">
          <div className="user-name">{currentUser.name || 'Arthur Fen'}</div>
          <div className="user-role">{currentUser.role || 'Journalist'}</div>
        </div>
        <ChevronDown size={18} className="user-chevron" />
      </div>

      {/* 2. Interactive Calendar Widget */}
      <div className="calendar-widget">
        <div className="calendar-header">
          <div className="calendar-month-title">
            {monthNames[month]} <span>{year}</span>
          </div>
          <div className="calendar-nav-buttons">
            <button className="calendar-nav-btn" onClick={handlePrevMonth} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <button className="calendar-nav-btn" onClick={handleNextMonth} aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="calendar-weekdays">
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
          <span>Su</span>
        </div>

        <div className="calendar-grid">
          {calendarDays.map((item, idx) => {
            if (item.empty) {
              return <div key={`empty-${idx}`} className="calendar-cell empty" />;
            }
            return (
              <div
                key={`day-${item.day}`}
                className={`calendar-cell ${item.isActive ? 'active-day' : ''}`}
                onClick={() => setSelectedDay(item.day)}
              >
                <span>{item.day}</span>
                {item.hasEntry && <span className="calendar-dot" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Today's Activities */}
      <div className="activities-section">
        <div className="widget-section-header">
          <h4 className="widget-section-title">Today's Activities</h4>
          <button style={{ color: 'var(--text-muted)' }} onClick={() => navigate('/journals')}>
            <MoreVertical size={16} />
          </button>
        </div>

        {mockTodayActivities.map((act) => (
          <div key={act.id} className="activity-item" onClick={() => navigate('/journals')}>
            <div className="activity-icon-badge">
              {act.icon === 'rocket' ? <Rocket size={18} /> : <BookOpen size={18} />}
            </div>
            <div className="activity-info">
              <div className="activity-name">{act.title}</div>
              <div className="activity-meta">{act.time}</div>
            </div>
            <ArrowIcon size={16} className="activity-chevron" />
          </div>
        ))}
      </div>

      {/* 4. Upcoming Activities / Reminders */}
      <div className="upcoming-section">
        <div className="widget-section-header">
          <h4 className="widget-section-title">Upcoming Reminders</h4>
          <button style={{ color: 'var(--text-muted)' }} onClick={() => navigate('/reminders')}>
            <MoreVertical size={16} />
          </button>
        </div>

        <div className="timeline-list">
          {mockUpcomingReminders.map((rem) => (
            <div key={rem.id} className="timeline-item" onClick={() => navigate('/reminders')}>
              <div className="timeline-dot" />
              <div className="timeline-date">{rem.date}</div>
              <div className="timeline-desc">{rem.title}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default RightSidebar;
