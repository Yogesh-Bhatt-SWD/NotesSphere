import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import journalService from '../api/journalService';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [entryDots, setEntryDots] = useState({});

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.getDate());
  };

  // Fetch real journals and map sentiment dots to days in current month
  const fetchMonthEntries = useCallback(async () => {
    try {
      const res = await journalService.getJournals({ size: 100, sortBy: 'createdAt', sortDir: 'desc' });
      const content = res?.data?.content || [];
      const dotsMap = {};

      content.forEach((j) => {
        if (!j.createdAt) return;
        const d = new Date(j.createdAt);
        if (d.getMonth() === month && d.getFullYear() === year) {
          const dayNum = d.getDate();
          if (!dotsMap[dayNum]) dotsMap[dayNum] = [];
          const s = (j.sentiment || 'NEUTRAL').toLowerCase();
          const mapped = s.includes('pos') ? 'positive' : s.includes('neg') ? 'negative' : 'neutral';
          if (dotsMap[dayNum].length < 3) {
            dotsMap[dayNum].push(mapped);
          }
        }
      });
      setEntryDots(dotsMap);
    } catch {
      setEntryDots({});
    }
  }, [month, year]);

  useEffect(() => {
    fetchMonthEntries();

    const handleMutation = () => fetchMonthEntries();
    window.addEventListener('notesphere:journal-mutated', handleMutation);
    return () => {
      window.removeEventListener('notesphere:journal-mutated', handleMutation);
    };
  }, [fetchMonthEntries]);

  // Dynamic calendar math
  const firstDayIndex = new Date(year, month, 1).getDay();
  const startDay = (firstDayIndex + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells = [];
  // Trailing previous month days
  for (let i = startDay - 1; i >= 0; i--) {
    calendarCells.push({ day: daysInPrevMonth - i, isOtherMonth: true });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, isOtherMonth: false });
  }
  // Leading next month days to complete a multiple of 7 grid
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    calendarCells.push({ day: d, isOtherMonth: true });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Row */}
      <div style={{ padding: '24px 32px 10px' }}>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Journal Calendar</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
          View your journaling activity and revisit past entries
        </p>
      </div>

      <div className="center-page-body">
        {/* 2. Big Calendar Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-card)',
          padding: '28px',
          boxShadow: 'var(--shadow-card)'
        }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={handlePrevMonth}
                aria-label="Previous month"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                  padding: '4px', display: 'flex', alignItems: 'center'
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {monthNames[month]} {year}
              </h2>
              <button
                onClick={handleNextMonth}
                aria-label="Next month"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                  padding: '4px', display: 'flex', alignItems: 'center'
                }}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <button
              onClick={handleGoToday}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-subtle)',
                background: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CalendarIcon size={14} /> Today
            </button>
          </div>

          {/* Weekday Labels */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            paddingBottom: '14px',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            {weekdays.map(d => <span key={d}>{d}</span>)}
          </div>

          {/* Calendar Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            rowGap: '16px',
            textAlign: 'center',
            paddingTop: '16px'
          }}>
            {calendarCells.map((cell, idx) => {
              const isSelected = !cell.isOtherMonth && cell.day === selectedDay;
              const dots = !cell.isOtherMonth ? entryDots[cell.day] : null;

              return (
                <div
                  key={idx}
                  onClick={() => !cell.isOtherMonth && setSelectedDay(cell.day)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '48px',
                    cursor: cell.isOtherMonth ? 'default' : 'pointer'
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.92rem',
                    fontWeight: isSelected ? 800 : 600,
                    backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                    color: isSelected
                      ? '#FFFFFF'
                      : cell.isOtherMonth
                      ? 'var(--text-muted)'
                      : 'var(--text-primary)',
                    boxShadow: isSelected ? '0 4px 12px var(--primary-glow)' : 'none',
                    opacity: cell.isOtherMonth ? 0.35 : 1,
                    transition: 'all 0.15s ease'
                  }}>
                    {cell.day}
                  </div>

                  {/* Colored sentiment dots underneath */}
                  <div style={{ display: 'flex', gap: '3px', height: '6px', marginTop: '4px' }}>
                    {dots && !isSelected && dots.map((s, i) => (
                      <span
                        key={i}
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor:
                            s === 'positive'
                              ? '#10B981'
                              : s === 'negative'
                              ? '#EF4444'
                              : '#94A3B8'
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend row at bottom matching Screen 4 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginTop: '28px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.82rem',
            fontWeight: 600
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} /> Positive
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94A3B8' }} /> Neutral
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} /> Negative
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
