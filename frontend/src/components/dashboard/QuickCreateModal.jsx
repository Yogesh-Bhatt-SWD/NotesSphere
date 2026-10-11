import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Sparkles, Save } from 'lucide-react';

export function QuickCreateModal({ isOpen, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Mindfulness');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('thoughts, reflection');
  const [submitting, setSubmitting] = useState(false);

  // Simple live sentiment estimation for visual feedback
  const getEstimatedSentiment = (text) => {
    if (!text.trim()) return { label: 'Neutral', variant: 'neutral' };
    const positiveWords = ['happy', 'great', 'grateful', 'peace', 'good', 'joy', 'love', 'blessed', 'excited'];
    const negativeWords = ['sad', 'bad', 'angry', 'stressed', 'tired', 'hate', 'pain', 'anxious'];
    const lower = text.toLowerCase();
    const hasPos = positiveWords.some(w => lower.includes(w));
    const hasNeg = negativeWords.some(w => lower.includes(w));
    if (hasPos && !hasNeg) return { label: 'Positive', variant: 'success' };
    if (hasNeg && !hasPos) return { label: 'Negative', variant: 'danger' };
    return { label: 'Neutral', variant: 'neutral' };
  };

  const estimatedSentiment = getEstimatedSentiment(content);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    setTimeout(() => {
      const newEntry = {
        id: `j-${Date.now()}`,
        title,
        category,
        content,
        snippet: content.slice(0, 80) + '...',
        createdAt: new Date().toLocaleDateString('en-GB'),
        sentiment: estimatedSentiment.label.toUpperCase(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        icon: 'book',
        coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
      };

      if (onCreated) onCreated(newEntry);
      setSubmitting(false);
      onClose();
      // Reset form
      setTitle('');
      setContent('');
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Journal Entry"
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Journal Title"
          placeholder="e.g., Morning Meditations & Reflection"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <option value="Mindfulness">Mindfulness</option>
              <option value="Goals">Goals</option>
              <option value="Daily">Daily Life</option>
              <option value="Work">Work & Projects</option>
              <option value="Reflections">Reflections</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Tags (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g., morning, focus, ideas"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Your Reflection Content *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sentiment:</span>
              <Badge variant={estimatedSentiment.variant} dot>
                {estimatedSentiment.label}
              </Badge>
            </div>
          </div>
          <textarea
            rows={5}
            placeholder="Write your thoughts, observations, and mindful notes here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              lineHeight: 1.6,
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={Save}
            disabled={!title.trim() || !content.trim() || submitting}
          >
            {submitting ? 'Saving...' : 'Save Journal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default QuickCreateModal;
