import React, { useState } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, Tag, Smile } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import './EditorPage.css';

export function EditorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toggleMobileMenu } = useOutletContext() || {};

  const [title, setTitle] = useState('Mindful Morning Reflections');
  const [category, setCategory] = useState('Mindfulness');
  const [content, setContent] = useState(
    'Today began with ten minutes of stillness and morning tea. I watched the golden sunrise stream across the workspace, feeling deeply centered and ready to make progress on creative endeavors...'
  );
  const [tags, setTags] = useState('mindfulness, tea, gratitude');
  const [saving, setSaving] = useState(false);

  // Word count & reading time
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTime = Math.ceil(words / 200);

  // Real-time sentiment estimation
  const getSentiment = (text) => {
    const positiveWords = ['happy', 'great', 'grateful', 'peace', 'good', 'joy', 'love', 'blessed', 'progress', 'centered'];
    const negativeWords = ['sad', 'bad', 'angry', 'stressed', 'tired', 'hate', 'pain', 'frustrated'];
    const lower = text.toLowerCase();
    const pos = positiveWords.filter(w => lower.includes(w)).length;
    const neg = negativeWords.filter(w => lower.includes(w)).length;
    if (pos > neg) return { label: 'Positive (VADER ~0.84)', variant: 'success' };
    if (neg > pos) return { label: 'Negative (VADER ~-0.62)', variant: 'danger' };
    return { label: 'Neutral (VADER ~0.0)', variant: 'neutral' };
  };

  const sentiment = getSentiment(content);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      navigate('/journals');
    }, 500);
  };

  return (
    <div className="editor-page">
      <Header
        title="Journal Editor"
        subtitle="Write, structure, and analyze your thoughts in real time"
        onToggleMobileMenu={toggleMobileMenu}
      />

      <div className="center-page-body">
        <div style={{ marginBottom: '16px' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </div>

        <div className="editor-card">
          <input
            type="text"
            className="editor-title-input"
            placeholder="Journal Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="editor-meta-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-input)'
                }}
              >
                <option value="Mindfulness">Mindfulness</option>
                <option value="Goals">Goals</option>
                <option value="Daily">Daily Life</option>
                <option value="Work">Work</option>
                <option value="Reflections">Reflections</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tags:</span>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tags separated by commas"
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-input)',
                  width: '240px'
                }}
              />
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smile size={16} color="var(--primary)" />
              <Badge variant={sentiment.variant} dot>
                {sentiment.label}
              </Badge>
            </div>
          </div>

          <textarea
            className="editor-content-area"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your mindful reflection here..."
          />

          <div className="editor-footer-row">
            <div className="editor-word-count">
              {words} words • {content.length} characters • ~{readTime} min read
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="ghost" onClick={() => navigate('/journals')}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={Save}
                onClick={handleSave}
                disabled={saving || !title.trim() || !content.trim()}
              >
                {saving ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
