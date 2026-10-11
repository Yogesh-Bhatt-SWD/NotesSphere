import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Quote,
  Code,
  Maximize2,
  Save,
  Plus,
  Briefcase
} from 'lucide-react';
import './EditorPage.css';

export function EditorPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('A Productive Day at Work');
  const [content, setContent] = useState(
    'Today I completed the backend implementation for the new feature. Had a great discussion with my team and learned a lot. Feeling motivated and happy with the progress. Excited for what\'s next!'
  );
  const [category, setCategory] = useState('Work');
  const [selectedTags, setSelectedTags] = useState(['productivity', 'team']);
  const [allTags, setAllTags] = useState(['productivity', 'team', 'learning', 'development']);
  const [isSaving, setIsSaving] = useState(false);

  // Live word counter
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddNewTag = () => {
    const newTag = prompt('Enter new tag name:');
    if (newTag && !allTags.includes(newTag.trim())) {
      setAllTags([...allTags, newTag.trim()]);
      setSelectedTags([...selectedTags, newTag.trim()]);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      navigate('/journals');
    }, 400);
  };

  return (
    <div className="new-journal-editor">
      {/* 1. Header Row */}
      <div className="editor-header-wrap">
        <h1>Create a New Journal</h1>
        <p>Write, reflect and understand your thoughts</p>
      </div>

      <div className="center-page-body">
        <div className="editor-container-card">
          {/* Title Input */}
          <input
            type="text"
            className="title-input-field"
            placeholder="Journal Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Rich Text Toolbar */}
          <div className="rich-toolbar">
            <select className="toolbar-select">
              <option>Normal</option>
              <option>Heading 1</option>
              <option>Heading 2</option>
            </select>

            <button type="button" className="toolbar-btn"><Bold size={15} /></button>
            <button type="button" className="toolbar-btn"><Italic size={15} /></button>
            <button type="button" className="toolbar-btn"><Underline size={15} /></button>

            <div className="toolbar-divider" />

            <button type="button" className="toolbar-btn"><List size={15} /></button>
            <button type="button" className="toolbar-btn"><ListOrdered size={15} /></button>
            <button type="button" className="toolbar-btn"><Link2 size={15} /></button>
            <button type="button" className="toolbar-btn"><Quote size={15} /></button>
            <button type="button" className="toolbar-btn"><Code size={15} /></button>

            <div className="toolbar-divider" />

            <button type="button" className="toolbar-btn" style={{ marginLeft: 'auto' }}>
              <Maximize2 size={15} />
            </button>
          </div>

          {/* Content Textarea with Words Badge */}
          <div className="content-textarea-wrap">
            <textarea
              className="content-textarea"
              placeholder="Start typing your reflection..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="word-count-badge">Words: {words}</div>
          </div>

          {/* Category & Suggested Tags Controls */}
          <div className="meta-controls-row">
            <div>
              <div className="meta-group-label">Category</div>
              <div className="category-dropdown-box">
                <Briefcase size={16} color="var(--primary)" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontWeight: 600 }}
                >
                  <option value="Work">Work</option>
                  <option value="Mindfulness">Mindfulness</option>
                  <option value="Study">Study</option>
                  <option value="Travel">Travel</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
            </div>

            <div>
              <div className="meta-group-label">Suggested Tags</div>
              <div className="suggested-tags-container">
                {allTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`suggested-tag-chip ${selectedTags.includes(t) ? 'active' : ''}`}
                    onClick={() => toggleTag(t)}
                  >
                    {t}
                  </button>
                ))}
                <button type="button" className="add-tag-chip-btn" onClick={handleAddNewTag}>
                  <Plus size={14} /> Add Tag
                </button>
              </div>
            </div>
          </div>

          {/* Large Save Journal Button */}
          <button
            type="button"
            className="save-journal-big-btn"
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
          >
            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Journal'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditorPage;
