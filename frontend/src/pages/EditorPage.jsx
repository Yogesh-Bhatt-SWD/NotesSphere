import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Plus,
  Briefcase,
  Lock,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Users
} from 'lucide-react';
import journalService from '../api/journalService';
import categoryService from '../api/categoryService';
import communityService from '../api/communityService';
import authService from '../api/authService';
import { CustomDropdown } from '../components/common/CustomDropdown';
import ShareModal from '../components/common/ShareModal';
import CoverPhotoUploader from '../components/common/CoverPhotoUploader';
import './EditorPage.css';

export function EditorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [publishedToShare, setPublishedToShare] = useState(null);
  const [category, setCategory] = useState('Daily Life');
  const [visibility, setVisibility] = useState('PRIVATE'); // 'PRIVATE' | 'COMMUNITY'
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [selectedTags, setSelectedTags] = useState(['reflection']);
  const [allTags, setAllTags] = useState(['reflection', 'growth', 'mindset', 'productivity', 'wellness']);

  // Dynamic data lists
  const [categoriesList, setCategoriesList] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);

  // NLP Category Suggestion
  const [suggestedCategory, setSuggestedCategory] = useState(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const userManuallySetCategory = useRef(false);

  // Status & modal states
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#00B69B');

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load categories and joined communities
  const loadCategories = async () => {
    try {
      const res = await categoryService.getCategories();
      if (res?.data) {
        setCategoriesList(res.data);
        if (!category && res.data.length > 0) {
          setCategory(res.data[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadJoinedCommunities = async () => {
    try {
      const res = await communityService.getJoinedCommunities();
      if (res?.data) {
        setJoinedCommunities(res.data);
        if (res.data.length > 0 && !selectedCommunityId) {
          setSelectedCommunityId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load joined communities:', err);
    }
  };

  // If edit mode, load existing journal entry
  const loadExistingJournal = async (id) => {
    try {
      const res = await journalService.getJournalById(id);
      if (res?.data) {
        const j = res.data;
        setTitle(j.title || '');
        setContent(j.content || '');
        setCoverImageUrl(j.coverImageUrl || '');
        if (j.category) {
          setCategory(j.category);
          userManuallySetCategory.current = true;
        }
        if (j.tags) setSelectedTags(j.tags);
        if (j.visibility) setVisibility(j.visibility);
        if (j.communityId) setSelectedCommunityId(j.communityId);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load journal entry', 'error');
    }
  };

  useEffect(() => {
    loadCategories();
    loadJoinedCommunities();
    if (editId) {
      loadExistingJournal(editId);
    } else {
      const savedDraft = localStorage.getItem('notesphere_saved_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.title) setTitle(draft.title);
          if (draft.content) setContent(draft.content);
          if (draft.coverImageUrl) setCoverImageUrl(draft.coverImageUrl);
          if (draft.category) {
            setCategory(draft.category);
            userManuallySetCategory.current = true;
          }
          if (draft.tags) setSelectedTags(draft.tags);
          if (draft.communityId) setSelectedCommunityId(draft.communityId);
          showToast('Restored your saved journal draft!', 'success');
        } catch {}
      }
    }
  }, [editId]);

  // Debounced NLP Category Suggestion on typing
  useEffect(() => {
    if (!content || content.trim().length < 20) {
      setSuggestedCategory(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSuggesting(true);
        const res = await categoryService.suggestCategory(content);
        if (res?.data?.suggestedCategory) {
          const suggested = res.data.suggestedCategory;
          // Only show suggestion if different from current selection
          if (suggested.toLowerCase() !== category.toLowerCase()) {
            setSuggestedCategory(suggested);
          } else {
            setSuggestedCategory(null);
          }
        }
      } catch (err) {
        console.error('NLP suggestion error:', err);
      } finally {
        setIsSuggesting(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [content, category]);

  const applySuggestedCategory = () => {
    if (suggestedCategory) {
      setCategory(suggestedCategory);
      setSuggestedCategory(null);
      userManuallySetCategory.current = true;
      showToast(`Category updated to "${suggestedCategory}"`);
    }
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    userManuallySetCategory.current = true;
    if (suggestedCategory && suggestedCategory.toLowerCase() === e.target.value.toLowerCase()) {
      setSuggestedCategory(null);
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddNewTag = () => {
    const newTag = prompt('Enter new tag:');
    if (newTag && !allTags.includes(newTag.trim())) {
      const clean = newTag.trim();
      setAllTags([...allTags, clean]);
      setSelectedTags([...selectedTags, clean]);
    }
  };

  // Custom Category creation
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await categoryService.createCategory({
        name: newCatName.trim(),
        color: newCatColor,
        icon: 'Folder',
      });
      if (res?.data) {
        showToast(`Category "${res.data.name}" created!`);
        await loadCategories();
        setCategory(res.data.name);
        userManuallySetCategory.current = true;
        setNewCatName('');
        setShowCategoryModal(false);
      }
    } catch (err) {
      showToast(err.message || 'Failed to create category', 'error');
    }
  };

  // Custom category deletion
  const handleDeleteCustomCategory = async (catId, catName) => {
    if (!window.confirm(`Delete custom category "${catName}"? Associated entries will safely re-associate to "Other".`)) return;

    try {
      await categoryService.deleteCategory(catId);
      showToast(`Category "${catName}" deleted`);
      await loadCategories();
      if (category === catName) {
        setCategory('Other');
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete category', 'error');
    }
  };

  // Save / Publish with specific mode
  const handleSaveWithMode = async (targetMode = visibility) => {
    if (!title.trim()) {
      showToast('Please provide a title for your journal', 'error');
      return;
    }
    if (!content.trim()) {
      showToast('Please write some content for your journal', 'error');
      return;
    }
    if (targetMode === 'COMMUNITY' && !selectedCommunityId) {
      showToast('Please select a community to publish to', 'error');
      return;
    }

    if (!authService.isAuthenticated()) {
      localStorage.setItem('notesphere_saved_draft', JSON.stringify({
        title,
        content,
        category,
        coverImageUrl,
        tags: selectedTags,
        visibility: targetMode,
        communityId: targetMode === 'COMMUNITY' ? selectedCommunityId : null,
      }));
      showToast('You must be signed in to save. Your journal has been preserved as a draft.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        tags: selectedTags,
        visibility: targetMode,
        communityId: targetMode === 'COMMUNITY' ? selectedCommunityId : null,
        coverImageUrl: coverImageUrl || '',
      };

      if (editId) {
        await journalService.updateJournal(editId, payload);
        if (targetMode === 'COMMUNITY') {
          await journalService.publishJournal(editId, { communityId: selectedCommunityId, visibility: 'COMMUNITY' });
          showToast('Journal updated and published to community feed!');
          setTimeout(() => navigate(`/communities?id=${selectedCommunityId}`), 600);
        } else if (targetMode === 'PUBLIC') {
          const pubRes = await journalService.publishJournal(editId, { visibility: 'PUBLIC' });
          showToast('Journal updated and published publicly!');
          setPublishedToShare(pubRes?.data || { id: editId, title, content, category });
        } else {
          await journalService.unpublishJournal(editId);
          showToast('Private journal updated successfully!');
          setTimeout(() => navigate('/journals'), 600);
        }
      } else {
        const createRes = await journalService.createJournal(payload);
        const created = createRes?.data || createRes;
        if (targetMode === 'COMMUNITY') {
          showToast('Journal successfully published to community feed!');
          setTimeout(() => navigate(`/communities?id=${selectedCommunityId}`), 600);
        } else if (targetMode === 'PUBLIC') {
          if (created?.id) {
            await journalService.publishJournal(created.id, { visibility: 'PUBLIC' });
          }
          showToast('Journal successfully published to public feed!');
          setPublishedToShare(created || { title, content, category });
        } else {
          showToast('Journal saved privately!');
          setTimeout(() => navigate('/journals'), 600);
        }
      }

      localStorage.removeItem('notesphere_saved_draft');
      window.dispatchEvent(new CustomEvent('notesphere:journal-mutated'));
    } catch (err) {
      localStorage.setItem('notesphere_saved_draft', JSON.stringify({
        title,
        content,
        category,
        coverImageUrl,
        tags: selectedTags,
        visibility: targetMode,
        communityId: targetMode === 'COMMUNITY' ? selectedCommunityId : null,
      }));
      if (err.status === 401 || err.message?.includes('Authentication') || err.message?.includes('Unauthorized')) {
        showToast('Your session has expired. Your reflection is saved as a draft. Please sign in.', 'error');
      } else {
        showToast(err.message || 'Failed to save journal', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const categoryOptions = (categoriesList.length > 0
    ? categoriesList
    : [
        { name: 'Mindfulness' },
        { name: 'Goals' },
        { name: 'Daily Life' },
        { name: 'Work & Projects' },
        { name: 'Reflections' },
        { name: 'Study' },
        { name: 'Travel' },
        { name: 'Health' },
        { name: 'Fitness' },
        { name: 'Personal Growth' },
        { name: 'Other' },
      ]
  ).map((c) => ({
    value: c.name,
    label: c.name,
    badge: c.predefined === false ? 'Custom' : undefined,
  }));

  const communityOptions = joinedCommunities.map((c) => ({
    value: c.id,
    label: c.name,
    badge: `${c.memberCount || 1} members`,
    icon: Users,
  }));

  return (
    <div className="new-journal-editor">
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: notification.type === 'error' ? '#EF4444' : 'var(--primary)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 'var(--radius-pill)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            zIndex: 9999,
          }}
        >
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="editor-header-wrap">
        <h1>{editId ? 'Edit Journal Entry' : 'Create & Publish Journal'}</h1>
        <p>Write, categorize, reflect, and share your thoughts privately or with a community</p>
      </div>

      <div className="center-page-body">
        <div className="editor-container-card">
          {/* Optional Cover Photo Field */}
          <CoverPhotoUploader
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            onError={(msg) => showToast(msg, 'error')}
          />

          {/* Title Input */}
          <input
            type="text"
            className="title-input-field"
            placeholder="Journal Title (e.g. Breakthroughs in Today's Project)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Formatting Toolbar */}
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

          {/* Content Textarea */}
          <div className="content-textarea-wrap">
            <textarea
              className="content-textarea"
              placeholder="What did you learn today? What gave you energy or challenged you?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="word-count-badge">Words: {words}</div>
          </div>

          {/* NLP Automatic Category Suggestion Chip */}
          {suggestedCategory && (
            <div className="nlp-suggestion-banner">
              <div className="nlp-suggestion-left">
                <Sparkles size={16} color="var(--primary)" />
                <span>
                  NLP Suggestion: <strong>{suggestedCategory}</strong> fits your reflection.
                </span>
              </div>
              <button
                type="button"
                className="nlp-apply-btn"
                onClick={applySuggestedCategory}
              >
                Apply Category
              </button>
            </div>
          )}

          {/* Category & Tags Row */}
          <div className="meta-controls-row">
            <div>
              <div className="meta-group-label">
                <span>Category</span>
                <button
                  type="button"
                  className="btn-manage-categories"
                  onClick={() => setShowCategoryModal(true)}
                >
                  + Add / Manage
                </button>
              </div>

              <CustomDropdown
                value={category}
                onChange={(val) => {
                  setCategory(val);
                  userManuallySetCategory.current = true;
                }}
                options={categoryOptions}
                placeholder="Select Category"
                icon={Briefcase}
                onAddNew={() => setShowCategoryModal(true)}
                addNewLabel="+ Create Custom Category"
                searchable={true}
                searchPlaceholder="Search category..."
              />
            </div>

            <div>
              <div className="meta-group-label">
                <span>Tags</span>
              </div>
              <div className="suggested-tags-container">
                {allTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`suggested-tag-chip ${selectedTags.includes(t) ? 'active' : ''}`}
                    onClick={() => toggleTag(t)}
                  >
                    #{t}
                  </button>
                ))}
                <button type="button" className="add-tag-chip-btn" onClick={handleAddNewTag}>
                  <Plus size={14} /> Add Tag
                </button>
              </div>
            </div>
          </div>

          {/* Visibility & Destination Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="meta-group-label">
              <span>Publication Mode</span>
            </div>

            <div className="visibility-card-group">
              <div
                className={`visibility-option-box ${visibility === 'PRIVATE' ? 'active' : ''}`}
                onClick={() => setVisibility('PRIVATE')}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'PRIVATE'}
                  onChange={() => setVisibility('PRIVATE')}
                  style={{ marginTop: '3px' }}
                />
                <div className="visibility-option-info">
                  <h4><Lock size={15} /> Private Journal</h4>
                  <p>Visible only to you. Never appears in any public or community feed.</p>
                </div>
              </div>

              <div
                className={`visibility-option-box ${visibility === 'PUBLIC' ? 'active' : ''}`}
                onClick={() => setVisibility('PUBLIC')}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'PUBLIC'}
                  onChange={() => setVisibility('PUBLIC')}
                  style={{ marginTop: '3px' }}
                />
                <div className="visibility-option-info">
                  <h4><Globe size={15} /> Public Publication</h4>
                  <p>Accessible to all users across NoteSphere and on your public profile.</p>
                </div>
              </div>

              <div
                className={`visibility-option-box ${visibility === 'COMMUNITY' ? 'active' : ''}`}
                onClick={() => setVisibility('COMMUNITY')}
              >
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'COMMUNITY'}
                  onChange={() => setVisibility('COMMUNITY')}
                  style={{ marginTop: '3px' }}
                />
                <div className="visibility-option-info">
                  <h4><Users size={15} /> Community Publication</h4>
                  <p>Publish to a selected community feed for fellow members.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Show community selector ONLY when COMMUNITY is selected */}
          {visibility === 'COMMUNITY' && (
            <div className="community-picker-box">
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Select Community Feed:
              </label>

              {joinedCommunities.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.86rem', color: '#EF4444' }}>
                    You have not joined any communities yet. Join one to publish!
                  </span>
                  <button
                    type="button"
                    className="btn-create-community"
                    onClick={() => navigate('/communities')}
                    style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                  >
                    Browse Communities
                  </button>
                </div>
              ) : (
                <CustomDropdown
                  value={selectedCommunityId}
                  onChange={(val) => setSelectedCommunityId(val)}
                  options={communityOptions}
                  placeholder="Select a community feed..."
                  icon={Users}
                  searchable={true}
                  searchPlaceholder="Search community feed..."
                />
              )}
            </div>
          )}

          {/* Action Buttons changing according to selected mode */}
          <div className="editor-actions-row">
            {visibility === 'PRIVATE' && (
              <button
                type="button"
                className="save-private-btn primary-action-btn"
                onClick={() => handleSaveWithMode('PRIVATE')}
                disabled={isSaving || !title.trim() || !content.trim()}
              >
                <Lock size={16} /> {isSaving ? 'Saving...' : (editId ? 'Update Private Journal' : 'Save as Private')}
              </button>
            )}

            {visibility === 'PUBLIC' && (
              <>
                <button
                  type="button"
                  className="save-private-btn"
                  onClick={() => handleSaveWithMode('PRIVATE')}
                  disabled={isSaving || !title.trim() || !content.trim()}
                >
                  <Lock size={16} /> Save as Private Draft
                </button>
                <button
                  type="button"
                  className="publish-community-btn"
                  onClick={() => handleSaveWithMode('PUBLIC')}
                  disabled={isSaving || !title.trim() || !content.trim()}
                >
                  <Globe size={16} /> {isSaving ? 'Processing...' : (editId ? 'Update & Publish Publicly' : 'Publish Publicly')}
                </button>
              </>
            )}

            {visibility === 'COMMUNITY' && (
              <>
                <button
                  type="button"
                  className="save-private-btn"
                  onClick={() => handleSaveWithMode('PRIVATE')}
                  disabled={isSaving || !title.trim() || !content.trim()}
                >
                  <Lock size={16} /> Save as Private Draft
                </button>
                <button
                  type="button"
                  className="publish-community-btn"
                  onClick={() => handleSaveWithMode('COMMUNITY')}
                  disabled={isSaving || !title.trim() || !content.trim() || !selectedCommunityId}
                >
                  <Users size={16} /> {isSaving ? 'Processing...' : (editId ? 'Update & Publish to Community' : 'Publish to Community')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Category Management */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title-row">
              <h2>Categories</h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {/* Create new category */}
            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="modal-field">
                <label>New Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Deep Work, Philosophy..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>

              <div className="modal-buttons-row">
                <button
                  type="submit"
                  className="btn-create-community"
                  disabled={!newCatName.trim()}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Plus size={16} /> Create Category
                </button>
              </div>
            </form>

            {/* List user's custom categories for management */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Your Custom Categories:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                {categoriesList.filter((c) => !c.predefined).length === 0 ? (
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    No custom categories created yet.
                  </div>
                ) : (
                  categoriesList
                    .filter((c) => !c.predefined)
                    .map((cat) => (
                      <div
                        key={cat.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{cat.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomCategory(cat.id, cat.name)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                          }}
                          title="Delete Category"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Published Blog Modal */}
      <ShareModal
        isOpen={!!publishedToShare}
        onClose={() => {
          setPublishedToShare(null);
          navigate('/journals?tab=published');
        }}
        journal={publishedToShare}
      />
    </div>
  );
}

export default EditorPage;
