import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Plus, Briefcase, Heart, BookOpen, Compass, Coffee } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';

export function TagsPage() {
  const navigate = useNavigate();

  const [tags, setTags] = useState([
    { name: 'productivity', count: 14 },
    { name: 'team', count: 9 },
    { name: 'learning', count: 12 },
    { name: 'development', count: 8 },
    { name: 'mindfulness', count: 18 },
    { name: 'travel', count: 10 },
    { name: 'goals', count: 15 },
    { name: 'morning-thoughts', count: 6 }
  ]);

  const [newTagName, setNewTagName] = useState('');

  const handleAddTag = (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    if (!tags.some(t => t.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      setTags([...tags, { name: newTagName.trim().toLowerCase(), count: 0 }]);
    }
    setNewTagName('');
  };

  const categories = [
    { name: 'Work', icon: Briefcase, color: '#10B981', count: 28 },
    { name: 'Personal', icon: Heart, color: '#6366F1', count: 18 },
    { name: 'Study', icon: BookOpen, color: '#8B5CF6', count: 12 },
    { name: 'Travel', icon: Compass, color: '#FF8F6B', count: 10 },
    { name: 'Mindfulness', icon: Coffee, color: '#06B6D4', count: 15 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Header
        title="Tags & Categories"
        subtitle="Manage user-defined tags and organize your mindfulness thoughts"
      />

      <div className="center-page-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Categories Section */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px' }}>
            System Categories
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.name}
                  onClick={() => navigate('/journals')}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px', background: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{c.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.count} entries</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Tags Cloud */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '28px',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>User-Defined Tags</h2>

            <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="New tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem'
                }}
              />
              <Button type="submit" size="sm" icon={Plus}>Add</Button>
            </form>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {tags.map((t) => (
              <div
                key={t.name}
                onClick={() => navigate('/journals')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  border: '1px solid rgba(0, 182, 155, 0.2)'
                }}
              >
                <Tag size={14} />
                <span>#{t.name}</span>
                <span style={{
                  fontSize: '0.74rem',
                  background: '#FFFFFF',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  color: 'var(--text-secondary)'
                }}>
                  {t.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TagsPage;
