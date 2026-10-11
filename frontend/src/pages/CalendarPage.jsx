import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState(12);

  // April 2026 dates with sentiments matching Screen 4 in Image B
  const entryDots = {
    4: ['positive'],
    6: ['neutral'],
    7: ['positive'],
    8: ['positive'],
    9: ['negative'],
    11: ['neutral'],
    12: ['positive'], // selected date
    14: ['positive'],
    15: ['neutral'],
    16: ['positive'],
    18: ['neutral'],
    19: ['positive'],
    21: ['positive', 'negative'],
    22: ['neutral'],
    24: ['positive'],
    26: ['negative'],
    28: ['positive'],
    29: ['positive']
  };

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Days layout: 2 previous month days (30, 31), 30 days of April, 3 next month days (1, 2, 3)
  const calendarCells = [
    { day: 30, isOtherMonth: true },
    { day: 31, isOtherMonth: true },
    ...Array.from({ length: 30 }, (_, i) => ({ day: i + 1, isOtherMonth: false })),
    { day: 1, isOtherMonth: true },
    { day: 2, isOtherMonth: true },
    { day: 3, isOtherMonth: true }
  ];

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
              <button style={{
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                padding: '4px', display: 'flex', alignItems: 'center'
              }}>
                <ChevronLeft size={20} />
              </button>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                April 2026
              </h2>
              <button style={{
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                padding: '4px', display: 'flex', alignItems: 'center'
              }}>
                <ChevronRight size={20} />
              </button>
            </div>

            <button
              onClick={() => setSelectedDay(12)}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-subtle)',
                background: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              Today
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
