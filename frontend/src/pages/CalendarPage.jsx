import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, BookOpen } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { mockFeaturedJournals, mockCalendarDatesWithEntries } from '../mock/mockData';

export function CalendarPage() {
  const navigate = useNavigate();
  const { toggleMobileMenu } = useOutletContext() || {};

  const [date, setDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(date.getDate());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div>
      <Header
        title="Schedule & Calendar"
        subtitle="Review your journaling consistency across the month"
        onToggleMobileMenu={toggleMobileMenu}
      />

      <div className="center-page-body" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Calendar Box */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              {monthNames[month]} <span style={{ color: 'var(--text-muted)' }}>{year}</span>
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setDate(new Date(year, month - 1, 1))}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setDate(new Date(year, month + 1, 1))}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', gap: '10px' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => (
              <div key={w} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', paddingBottom: '10px' }}>
                {w}
              </div>
            ))}

            {days.map((d, idx) => {
              if (!d) return <div key={`empty-${idx}`} />;
              const hasEntry = mockCalendarDatesWithEntries.includes(d);
              const isSelected = d === selectedDay;

              return (
                <div
                  key={`day-${d}`}
                  onClick={() => setSelectedDay(d)}
                  style={{
                    height: '46px',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                    color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                    border: hasEntry && !isSelected ? '1px solid #C4ECE1' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{d}</span>
                  {hasEntry && (
                    <span style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: isSelected ? '#FFFFFF' : '#FF7B54',
                      position: 'absolute',
                      bottom: '5px'
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Entries Panel */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              Entries for {selectedDay} {monthNames[month]}
            </h3>
            <Button size="sm" icon={Plus} onClick={() => navigate('/editor')}>
              Add
            </Button>
          </div>

          {mockCalendarDatesWithEntries.includes(selectedDay) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/editor?id=j-1')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Diary Reflection</h4>
                  <Badge variant="success">Positive</Badge>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Reflecting on morning mindfulness and peaceful moments...
                </p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
              <Calendar size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem' }}>No entries logged on this date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
