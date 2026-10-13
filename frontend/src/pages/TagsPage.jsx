import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag,
  Plus,
  Briefcase,
  Heart,
  BookOpen,
  Compass,
  Coffee,
  Folder,
  Target,
  Calendar,
  GraduationCap,
  HeartPulse,
  Activity,
  TrendingUp,
  Hash,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import categoryService from '../api/categoryService';
import journalService from '../api/journalService';

const ICON_MAP = {
  Briefcase,
  Heart,
  BookOpen,
  Compass,
  Coffee,
  Folder,
  Target,
  Calendar,
  GraduationCap,
  HeartPulse,
  Activity,
  TrendingUp,
};

export function TagsPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [catRes, tagsRes] = await Promise.allSettled([
        categoryService.getCategories(),
        journalService.getUserTagsWithCounts()
      ]);

      if (catRes.status === 'fulfilled' && catRes.value?.data) {
        setCategories(catRes.value.data);
      } else {
        setCategories([]);
      }

      if (tagsRes.status === 'fulfilled' && tagsRes.value?.data) {
        const userTags = (tagsRes.value.data || []).map((t) => ({
          name: t.tag || t.name,
          count: typeof t.count === 'number' ? t.count : 0
        }));
        setTags(userTags);
      } else {
        setTags([]);
      }
    } catch (err) {
      console.error('Failed to load categories or tags:', err);
      setError('Unable to load tags and categories right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const sanitized = newTagName.trim().toLowerCase().replace(/^#+/, '');
    if (!sanitized) return;

    if (!tags.some((t) => t.name.toLowerCase() === sanitized)) {
      setTags([...tags, { name: sanitized, count: 0 }]);
    }
    setNewTagName('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Header
        title="Tags & Categories"
        subtitle="Manage and explore your journal entries by category and personalized tags"
      />

      <div className="center-page-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            background: 'var(--danger-light, #FEE2E2)',
            color: 'var(--danger, #DC2626)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            gap: '12px',
            color: 'var(--text-secondary)'
          }}>
            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.92rem', fontWeight: 500 }}>Loading tags and categories...</span>
          </div>
        ) : (
          <>
            {/* Categories Section */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: '28px',
              border: '1px solid var(--border-card)',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  Categories
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Entry counts reflect your personal journals in each category
                </p>
              </div>

              {categories.length === 0 ? (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.88rem'
                }}>
                  No categories found.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                  gap: '16px'
                }}>
                  {categories.map((c) => {
                    const IconComponent = (c.icon && ICON_MAP[c.icon]) ? ICON_MAP[c.icon] : Folder;
                    const catColor = c.color || 'var(--primary)';
                    const count = typeof c.entryCount === 'number' ? c.entryCount : 0;

                    return (
                      <div
                        key={c.id || c.name}
                        onClick={() => navigate(`/journals?category=${encodeURIComponent(c.name)}`)}
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        title={`View journals in ${c.name}`}
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: catColor,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                          flexShrink: 0
                        }}>
                          <IconComponent size={19} />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {count} {count === 1 ? 'entry' : 'entries'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* User Tags Cloud */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              padding: '28px',
              border: '1px solid var(--border-card)',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '18px'
              }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                    User-Defined Tags
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Tags extracted from your journals or custom-defined
                  </p>
                </div>

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
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                  <Button type="submit" size="sm" icon={Plus}>Add</Button>
                </form>
              </div>

              {tags.length === 0 ? (
                <div style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Hash size={30} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                  <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text-primary)' }}>
                    No tags used yet
                  </div>
                  <div style={{ fontSize: '0.84rem', maxWidth: '420px', lineHeight: 1.5 }}>
                    You haven't added any tags to your journals yet. Add tags like #productivity or #travel when creating a journal, or add a tag above to prepare it.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {tags.map((t) => (
                    <div
                      key={t.name}
                      onClick={() => navigate(`/journals?search=${encodeURIComponent('#' + t.name)}`)}
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
                        border: '1px solid rgba(0, 182, 155, 0.2)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 182, 155, 0.18)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      title={`Filter journals by #${t.name}`}
                    >
                      <Tag size={14} />
                      <span>#{t.name}</span>
                      <span style={{
                        fontSize: '0.74rem',
                        background: '#FFFFFF',
                        padding: '1px 7px',
                        borderRadius: '10px',
                        color: 'var(--text-secondary)',
                        fontWeight: 600
                      }}>
                        {t.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TagsPage;
