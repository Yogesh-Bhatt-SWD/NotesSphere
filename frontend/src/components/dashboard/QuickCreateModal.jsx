import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Badge from '../common/Badge';
import CustomDropdown from '../common/CustomDropdown';
import { Sparkles, Save, Globe, Lock, Plus, Check, Users, Leaf, Laptop, PenTool, Activity, Briefcase } from 'lucide-react';
import journalService from '../../api/journalService';
import categoryService from '../../api/categoryService';
import communityService from '../../api/communityService';
import authService from '../../api/authService';

export function QuickCreateModal({ isOpen, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Mindfulness');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('thoughts, reflection');
  const [visibility, setVisibility] = useState('PRIVATE');
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Categories list & custom category creation
  const [categoriesList, setCategoriesList] = useState([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Joined communities
  const [communities, setCommunities] = useState([]);

  // Default communities fallback ensuring dropdown is never empty
  const DEFAULT_COMMUNITIES = [
    { id: 'comm-mindful', name: 'Mindful Living', category: 'Mindfulness', memberCount: 15, icon: Leaf },
    { id: 'comm-tech', name: 'Tech & Engineering', category: 'Work & Projects', memberCount: 28, icon: Laptop },
    { id: 'comm-creative', name: 'Creative Writers', category: 'Reflections', memberCount: 19, icon: PenTool },
    { id: 'comm-fitness', name: 'Fitness & Wellbeing', category: 'Fitness', memberCount: 34, icon: Activity },
  ];

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadCommunities();
      setErrorMsg('');

      // Auto-restore any previously unsaved draft
      const savedDraft = localStorage.getItem('notesphere_saved_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.title && !title) setTitle(draft.title);
          if (draft.content && !content) setContent(draft.content);
          if (draft.category) setCategory(draft.category);
          if (draft.tags) setTags(draft.tags);
          if (draft.communityId) setSelectedCommunityId(draft.communityId);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const res = await categoryService.getCategories();
      if (res?.data && res.data.length > 0) {
        setCategoriesList(res.data);
      } else {
        setCategoriesList([
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
          { name: 'Other' }
        ]);
      }
    } catch {
      setCategoriesList([
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
        { name: 'Other' }
      ]);
    }
  };

  const loadCommunities = async () => {
    try {
      const res = await communityService.getJoinedCommunities();
      if (res?.data && res.data.length > 0) {
        setCommunities(res.data);
        setSelectedCommunityId(res.data[0].id);
        return;
      }

      // If user hasn't joined any yet, fetch all available communities
      const allRes = await communityService.getCommunities({ size: 10 });
      if (allRes?.data?.content && allRes.data.content.length > 0) {
        setCommunities(allRes.data.content);
        setSelectedCommunityId(allRes.data.content[0].id);
        return;
      }
    } catch (err) {
      console.error('Failed to load communities:', err);
    }

    // Default fallback so dropdown is never empty
    setCommunities(DEFAULT_COMMUNITIES);
    setSelectedCommunityId(DEFAULT_COMMUNITIES[0].id);
  };

  // Simple live sentiment estimation
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

  const handleCreateCustomCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsCreatingCategory(true);
    setErrorMsg('');

    try {
      const res = await categoryService.createCategory({
        name: newCategoryName.trim(),
        color: '#00B69B',
        icon: 'Folder'
      });
      if (res?.data) {
        await loadCategories();
        setCategory(res.data.name);
        setNewCategoryName('');
        setIsAddingCategory(false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create custom category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleAction = async (chosenVisibility) => {
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Title and reflection content are required');
      return;
    }

    const effectiveCommunityId = selectedCommunityId || (communities[0] ? communities[0].id : null);

    if (chosenVisibility === 'COMMUNITY' && !effectiveCommunityId) {
      setErrorMsg('Please select a community to publish your journal to');
      return;
    }

    if (!authService.isAuthenticated()) {
      localStorage.setItem('notesphere_saved_draft', JSON.stringify({
        title,
        content,
        category,
        tags,
        visibility: chosenVisibility,
        communityId: effectiveCommunityId,
      }));
      setErrorMsg('You need to be signed in to publish. Your reflection has been saved as a draft! Please sign in.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      // If community chosen and user isn't joined yet, auto-join community first
      if (chosenVisibility === 'COMMUNITY' && effectiveCommunityId) {
        try {
          await communityService.joinCommunity(effectiveCommunityId);
        } catch {
          // Already joined or ignore
        }
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        visibility: chosenVisibility,
        communityId: chosenVisibility === 'COMMUNITY' ? effectiveCommunityId : null,
      };

      const res = await journalService.createJournal(payload);
      const createdJournal = res?.data || {
        id: `j-${Date.now()}`,
        ...payload,
        createdAt: new Date().toLocaleDateString('en-GB'),
        sentiment: estimatedSentiment.label.toUpperCase(),
        coverImage: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
      };

      // Clean up saved draft on success
      localStorage.removeItem('notesphere_saved_draft');

      if (onCreated) onCreated(createdJournal);

      // Reset form and close
      setTitle('');
      setContent('');
      onClose();
    } catch (err) {
      // Auto-save draft on failure so the user never loses content
      localStorage.setItem('notesphere_saved_draft', JSON.stringify({
        title,
        content,
        category,
        tags,
        visibility: chosenVisibility,
        communityId: effectiveCommunityId,
      }));

      if (err.status === 401 || err.message?.includes('Authentication') || err.message?.includes('Unauthorized')) {
        setErrorMsg('Your session has expired. Your journal is safely saved as a draft! Please sign in to publish.');
      } else {
        setErrorMsg(err.message || 'Failed to process journal');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Build category options for CustomDropdown
  const categoryOptions = categoriesList.map((c) => ({
    value: c.name,
    label: c.name,
    badge: c.predefined === false ? 'Custom' : undefined,
  }));

  // Build community options for CustomDropdown
  const communityOptions = communities.map((c) => ({
    value: c.id,
    label: c.name,
    badge: `${c.memberCount || 1} members`,
    icon: Users,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create & Publish Journal Entry"
      maxWidth="620px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#FEE2E2',
              color: '#B91C1C',
              fontSize: '0.86rem',
              fontWeight: 600,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Journal Title */}
        <Input
          label="Journal Title *"
          placeholder="e.g., Reflections on Today's Breakthroughs"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Category & Tags Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
          {/* Category Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Category
              </label>
              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Plus size={13} /> {isAddingCategory ? 'Cancel' : 'New Category'}
              </button>
            </div>

            {isAddingCategory ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-input)',
                    border: '1.5px solid var(--border-subtle)',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateCustomCategory();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreateCustomCategory}
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {isCreatingCategory ? '...' : <Check size={14} />}
                </button>
              </div>
            ) : (
              <CustomDropdown
                value={category}
                onChange={setCategory}
                options={categoryOptions}
                placeholder="Choose category..."
                onAddNew={() => setIsAddingCategory(true)}
                addNewLabel="+ Create Custom Category"
                searchable={true}
                searchPlaceholder="Search categories..."
              />
            )}
          </div>

          {/* Tags Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Tags (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g., focus, growth, ideas"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={{
                padding: '11px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-input)',
                border: '1.5px solid var(--border-subtle)',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Publication Mode Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Publication Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setVisibility('PRIVATE')}
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                border: visibility === 'PRIVATE' ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                background: visibility === 'PRIVATE' ? 'var(--primary-light)' : '#FFFFFF',
                color: visibility === 'PRIVATE' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
              }}
            >
              <Lock size={14} /> Private
            </button>
            <button
              type="button"
              onClick={() => setVisibility('PUBLIC')}
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                border: visibility === 'PUBLIC' ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                background: visibility === 'PUBLIC' ? 'var(--primary-light)' : '#FFFFFF',
                color: visibility === 'PUBLIC' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
              }}
            >
              <Globe size={14} /> Public
            </button>
            <button
              type="button"
              onClick={() => setVisibility('COMMUNITY')}
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                border: visibility === 'COMMUNITY' ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                background: visibility === 'COMMUNITY' ? 'var(--primary-light)' : '#FFFFFF',
                color: visibility === 'COMMUNITY' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
              }}
            >
              <Users size={14} /> Community
            </button>
          </div>
        </div>

        {/* Publish to Community Feed Dropdown - rendered ONLY when COMMUNITY is selected */}
        {visibility === 'COMMUNITY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Select Community Feed *
            </label>
            <CustomDropdown
              value={selectedCommunityId || (communities[0] ? communities[0].id : '')}
              onChange={setSelectedCommunityId}
              options={communityOptions}
              placeholder="Select community space..."
              icon={Users}
              searchable={true}
              searchPlaceholder="Search community feed..."
            />
          </div>
        )}

        {/* Reflection Content Textarea */}
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
            placeholder="Write your reflection, breakthroughs, and mindful notes here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-input)',
              border: '1.5px solid var(--border-subtle)',
              lineHeight: 1.6,
              resize: 'vertical',
              fontSize: '0.92rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Action Buttons changing according to chosen visibility */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {visibility === 'PRIVATE' ? (
              <Button
                variant="primary"
                type="button"
                icon={Lock}
                disabled={!title.trim() || !content.trim() || submitting}
                onClick={() => handleAction('PRIVATE')}
                style={{
                  background: 'var(--primary)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px var(--primary-glow)',
                }}
              >
                {submitting ? 'Saving...' : 'Save as Private'}
              </Button>
            ) : visibility === 'PUBLIC' ? (
              <>
                <Button
                  variant="secondary"
                  type="button"
                  icon={Lock}
                  disabled={!title.trim() || !content.trim() || submitting}
                  onClick={() => handleAction('PRIVATE')}
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  Save as Private
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  icon={Globe}
                  disabled={!title.trim() || !content.trim() || submitting}
                  onClick={() => handleAction('PUBLIC')}
                  style={{
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px var(--primary-glow)',
                  }}
                >
                  {submitting ? 'Publishing...' : 'Publish Publicly'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  type="button"
                  icon={Lock}
                  disabled={!title.trim() || !content.trim() || submitting}
                  onClick={() => handleAction('PRIVATE')}
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  Save as Private
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  icon={Users}
                  disabled={!title.trim() || !content.trim() || submitting}
                  onClick={() => handleAction('COMMUNITY')}
                  style={{
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px var(--primary-glow)',
                  }}
                >
                  {submitting ? 'Publishing...' : 'Publish to Community'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default QuickCreateModal;
