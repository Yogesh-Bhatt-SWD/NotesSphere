import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import {
  User,
  Shield,
  Sliders,
  Download,
  Globe,
  Upload,
  Trash2,
  Camera,
  Check,
  AlertCircle,
  Eye,
  Lock,
  Mail,
  MapPin,
  LogOut,
  FileJson,
  FileSpreadsheet,
  X,
  Plus,
  RefreshCw,
  Sparkles,
  HelpCircle,
  Bell,
  BookOpen
} from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import userService from '../api/userService';
import journalService from '../api/journalService';
import ImageCropModal from '../components/common/ImageCropModal';
import './SettingsPage.css';

const TwitterIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const GithubIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedinIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const PROFILE_LABELS = ['Writer', 'Creator', 'Storyteller', 'Poet', 'Thinker'];
const TOPIC_SUGGESTIONS = ['Mindfulness', 'Fiction', 'Philosophy', 'Daily Growth', 'Journaling', 'Poetry', 'Deep Work', 'Travel'];
const CATEGORY_OPTIONS = ['Mindfulness', 'Daily Reflection', 'Creative Writing', 'Goals & Habits', 'Productivity', 'Gratitude', 'Personal'];

export function SettingsPage() {
  const { user: authUser, updateUserData, logout } = useAuth();
  const { toggleMobileMenu } = useOutletContext() || {};
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Tab State
  const [activeTab, setActiveTab] = useState('profile');
  const [initialLoading, setInitialLoading] = useState(true);
  const [statusAlert, setStatusAlert] = useState(null);

  // 1. Profile Information State
  const [profileData, setProfileData] = useState({
    fullName: '',
    username: '',
    avatarUrl: null,
    bio: '',
    profileLabel: 'Writer',
    interests: [],
    location: '',
    website: '',
    twitterUrl: '',
    githubUrl: '',
    linkedinUrl: '',
  });
  const [originalProfile, setOriginalProfile] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar Crop & Resize State
  const [selectedImageForCrop, setSelectedImageForCrop] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  // 2. Preferences & Visibility State
  const [preferences, setPreferences] = useState({
    profilePublic: true,
    showLocation: true,
    showInterests: true,
    showBio: true,
    defaultJournalVisibility: 'PRIVATE',
    notifyFriendRequests: true,
    notifyMessages: true,
    notifyComments: true,
    notifyReactions: true,
    notifyCommunity: true,
    dailyWritingGoalWords: 500,
    preferredCategory: 'Mindfulness',
    themePreference: 'system',
  });
  const [savingPreferences, setSavingPreferences] = useState(false);

  // 3. Security State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    password: '',
  });
  const [activeSessions, setActiveSessions] = useState(1);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Deletion Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Public Profile Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Data Export State
  const [downloading, setDownloading] = useState(null);

  // Fetch full user profile and settings from backend
  useEffect(() => {
    let isMounted = true;
    async function loadUserData() {
      setInitialLoading(true);
      try {
        const userDetails = await userService.getMe();
        if (!isMounted) return;

        const loadedProfile = {
          fullName: userDetails.fullName || userDetails.name || '',
          username: userDetails.username || '',
          avatarUrl: userDetails.avatarUrl || null,
          bio: userDetails.bio || '',
          profileLabel: userDetails.profileLabel || 'Writer',
          interests: Array.isArray(userDetails.interests) ? userDetails.interests : Array.from(userDetails.interests || []),
          location: userDetails.location || '',
          website: userDetails.website || '',
          twitterUrl: userDetails.twitterUrl || '',
          githubUrl: userDetails.githubUrl || '',
          linkedinUrl: userDetails.linkedinUrl || '',
        };

        setProfileData(loadedProfile);
        setOriginalProfile(loadedProfile);

        setPreferences({
          profilePublic: userDetails.profilePublic ?? true,
          showLocation: userDetails.showLocation ?? true,
          showInterests: userDetails.showInterests ?? true,
          showBio: userDetails.showBio ?? true,
          defaultJournalVisibility: userDetails.defaultJournalVisibility || 'PRIVATE',
          notifyFriendRequests: userDetails.notifyFriendRequests ?? true,
          notifyMessages: userDetails.notifyMessages ?? true,
          notifyComments: userDetails.notifyComments ?? true,
          notifyReactions: userDetails.notifyReactions ?? true,
          notifyCommunity: userDetails.notifyCommunity ?? true,
          dailyWritingGoalWords: userDetails.dailyWritingGoalWords || 500,
          preferredCategory: userDetails.preferredCategory || 'Mindfulness',
          themePreference: userDetails.themePreference || 'system',
        });

        setActiveSessions(userDetails.activeSessionsCount || 1);
      } catch (err) {
        console.error('Failed to load user profile from backend:', err);
        if (authUser) {
          setProfileData(prev => ({
            ...prev,
            fullName: authUser.name || authUser.username || '',
            username: authUser.username || '',
          }));
        }
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    }

    loadUserData();
    return () => {
      isMounted = false;
    };
  }, [authUser]);

  const showAlert = (type, message) => {
    setStatusAlert({ type, message });
    setTimeout(() => {
      setStatusAlert(null);
    }, 4500);
  };

  // Avatar Handling with Interactive Crop & Resize
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showAlert('error', 'Avatar image must be under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageForCrop(reader.result);
      setShowCropModal(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedUrl) => {
    setProfileData(prev => ({ ...prev, avatarUrl: croppedUrl }));
    setOriginalProfile(prev => ({ ...prev, avatarUrl: croppedUrl }));
    try {
      const updated = await userService.updateProfile({
        ...profileData,
        avatarUrl: croppedUrl,
      });
      updateUserData({
        fullName: updated.fullName,
        username: updated.username,
        name: updated.fullName || updated.username,
        avatarUrl: updated.avatarUrl,
        avatar: updated.avatarUrl,
      });
      showAlert('success', 'Profile photo cropped and saved successfully!');
    } catch (err) {
      showAlert('error', err.message || 'Failed to save cropped photo.');
    }
  };

  const handleRemoveAvatar = async () => {
    setProfileData(prev => ({ ...prev, avatarUrl: null }));
    setOriginalProfile(prev => ({ ...prev, avatarUrl: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    try {
      const updated = await userService.updateProfile({
        ...profileData,
        avatarUrl: '',
      });
      updateUserData({
        avatarUrl: null,
        avatar: null,
      });
      showAlert('success', 'Profile photo removed successfully.');
    } catch (err) {
      showAlert('error', err.message || 'Failed to remove photo.');
    }
  };

  // Tag Adder
  const handleAddTag = (topic) => {
    const trimmed = (topic || tagInput).trim();
    if (!trimmed) return;
    if (profileData.interests.includes(trimmed)) {
      setTagInput('');
      return;
    }
    setProfileData(prev => ({
      ...prev,
      interests: [...prev.interests, trimmed],
    }));
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.filter(t => t !== tagToRemove),
    }));
  };

  // Dirty state detection for profile
  const isProfileDirty = JSON.stringify(profileData) !== JSON.stringify(originalProfile);

  // Save Profile Handler
  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await userService.updateProfile(profileData);
      setOriginalProfile(profileData);
      updateUserData({
        fullName: updated.fullName,
        username: updated.username,
        name: updated.fullName || updated.username,
        avatarUrl: updated.avatarUrl,
        avatar: updated.avatarUrl,
      });
      showAlert('success', 'Profile information updated successfully!');
    } catch (err) {
      showAlert('error', err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Reset Profile
  const handleResetProfile = () => {
    setProfileData(originalProfile);
  };

  // Save Preferences Handler
  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    try {
      await userService.updatePreferences(preferences);
      showAlert('success', 'Preferences saved successfully!');
    } catch (err) {
      showAlert('error', err.message || 'Failed to save preferences.');
    } finally {
      setSavingPreferences(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showAlert('error', 'New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showAlert('error', 'New password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);
    try {
      await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showAlert('success', 'Password updated successfully!');
    } catch (err) {
      showAlert('error', err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Change Email Handler
  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.newEmail || !emailForm.password) {
      showAlert('error', 'Please fill in both the new email and your password.');
      return;
    }

    setEmailLoading(true);
    try {
      const updated = await userService.changeEmail({
        newEmail: emailForm.newEmail,
        password: emailForm.password,
      });
      updateUserData({ email: updated.email });
      setEmailForm({ newEmail: '', password: '' });
      showAlert('success', `Email updated to ${updated.email}!`);
    } catch (err) {
      showAlert('error', err.message || 'Failed to change email address.');
    } finally {
      setEmailLoading(false);
    }
  };

  // Sign out all sessions
  const handleSignOutAllSessions = async () => {
    if (!window.confirm('Are you sure you want to sign out of all active devices? You may need to log back in.')) return;
    setSessionsLoading(true);
    try {
      const res = await userService.signOutAllSessions();
      setActiveSessions(1);
      showAlert('success', res.message || 'All other active sessions have been signed out.');
    } catch (err) {
      showAlert('error', err.message || 'Failed to revoke active sessions.');
    } finally {
      setSessionsLoading(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmation.trim().toUpperCase() !== 'DELETE') {
      showAlert('error', 'Please type DELETE into the confirmation field.');
      return;
    }
    if (!deletePassword) {
      showAlert('error', 'Password confirmation is required.');
      return;
    }

    setDeletingAccount(true);
    try {
      await userService.deleteAccount({
        password: deletePassword,
        confirmationText: 'DELETE',
      });
      setShowDeleteModal(false);
      await logout();
      navigate('/register', { replace: true });
    } catch (err) {
      showAlert('error', err.message || 'Failed to delete account.');
      setDeletingAccount(false);
    }
  };

  // Export Data Handlers
  const handleExport = async (format) => {
    setDownloading(format);
    try {
      if (format === 'json') {
        await journalService.exportJson(`notesphere-journals-${new Date().toISOString().slice(0, 10)}.json`);
      } else {
        await journalService.exportCsv(`notesphere-journals-${new Date().toISOString().slice(0, 10)}.csv`);
      }
      showAlert('success', `Your journals have been exported as ${format.toUpperCase()}!`);
    } catch (err) {
      showAlert('error', err.message || `Export failed. Please try again.`);
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  if (initialLoading) {
    return (
      <div>
        <Header
          title="Settings & Profile"
          subtitle="Loading your profile and preferences..."
          onToggleMobileMenu={toggleMobileMenu}
        />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const displayName = profileData.fullName || profileData.username || 'Member';
  const initials = displayName
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div>
      <Header
        title="Settings & Profile"
        subtitle="Manage your profile identity, security, notifications, and personal data"
        onToggleMobileMenu={toggleMobileMenu}
      />

      <div className="settings-container">
        {/* Status Alert Banner */}
        {statusAlert && (
          <div className={`settings-alert ${statusAlert.type === 'success' ? 'settings-alert-success' : 'settings-alert-error'}`}>
            {statusAlert.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{statusAlert.message}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Profile Information
            {isProfileDirty && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-coral)' }} />
            )}
          </button>

          <button
            className={`settings-tab-btn ${activeTab === 'public-profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('public-profile')}
          >
            <Globe size={18} /> Public Profile
          </button>

          <button
            className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} /> Privacy & Security
          </button>

          <button
            className={`settings-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Sliders size={18} /> App Preferences
          </button>

          <button
            className={`settings-tab-btn ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <Download size={18} /> Data Portability
          </button>
        </div>

        {/* TAB 1: PROFILE INFORMATION */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="settings-card">
            <div className="settings-card-header">
              <div>
                <h3 className="settings-card-title">
                  <User size={20} color="var(--primary)" /> Profile Details
                </h3>
                <p className="settings-card-subtitle">
                  Customize how you appear to others on NoteSphere and in public community discussions.
                </p>
              </div>

              {isProfileDirty && (
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--accent-amber-light)',
                  color: 'var(--accent-amber)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)'
                }}>
                  Unsaved Changes
                </span>
              )}
            </div>

            {/* Avatar Row */}
            <div className="settings-avatar-row">
              {profileData.avatarUrl ? (
                <img
                  src={profileData.avatarUrl}
                  alt={displayName}
                  className="settings-avatar-preview"
                />
              ) : (
                <div className="settings-avatar-placeholder">
                  {initials}
                </div>
              )}

              <div className="settings-avatar-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleAvatarChange}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={Upload}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Photo
                  </Button>
                  {profileData.avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={handleRemoveAvatar}
                      style={{ color: 'var(--accent-coral)' }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  PNG, JPG or WEBP under 2MB. Square ratio recommended.
                </span>
              </div>
            </div>

            {/* Full Name & Username */}
            <div className="settings-form-grid-2">
              <Input
                label="Full Name"
                placeholder="e.g. Arthur Conan Doyle"
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                maxLength={100}
                required
              />

              <Input
                label="Unique Username"
                placeholder="e.g. arthur_doyle"
                value={profileData.username}
                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                maxLength={30}
                required
              />
            </div>

            {/* Profile Label */}
            <div className="settings-field-group">
              <label className="settings-field-label">Profile Label</label>
              <div className="settings-pill-group">
                {PROFILE_LABELS.map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    className={`settings-label-pill ${profileData.profileLabel === lbl ? 'selected' : ''}`}
                    onClick={() => setProfileData({ ...profileData, profileLabel: lbl })}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio / About */}
            <div className="settings-field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="settings-field-label">Bio / About Me</label>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {profileData.bio?.length || 0} / 500
                </span>
              </div>
              <textarea
                className="settings-textarea"
                placeholder="Share a short introduction, your journaling philosophy, or what brings you to NoteSphere..."
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                maxLength={500}
              />
            </div>

            {/* Interests & Topics Adder */}
            <div className="settings-field-group">
              <label className="settings-field-label">Interests & Writing Topics</label>
              <div className="settings-tags-box">
                {profileData.interests.map((tag) => (
                  <span key={tag} className="settings-tag-chip">
                    {tag}
                    <button
                      type="button"
                      className="settings-tag-remove"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={profileData.interests.length === 0 ? "Add your topics (e.g. Mindfulness)..." : "Add more topics..."}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '0.88rem',
                    flex: '1',
                    minWidth: '140px',
                    color: 'var(--text-primary)'
                  }}
                />
                {tagInput.trim() && (
                  <Button type="button" size="sm" variant="secondary" onClick={() => handleAddTag()}>
                    <Plus size={14} /> Add
                  </Button>
                )}
              </div>

              {/* Suggestions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Suggestions:</span>
                {TOPIC_SUGGESTIONS.filter(s => !profileData.interests.includes(s)).map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleAddTag(topic)}
                    style={{
                      background: 'none',
                      border: '1px dashed var(--border-subtle)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    + {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Location & Website */}
            <div className="settings-form-grid-2">
              <Input
                label="Location"
                placeholder="City, Country"
                icon={MapPin}
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                maxLength={100}
              />

              <Input
                label="Website URL"
                placeholder="https://yourportfolio.com"
                icon={Globe}
                value={profileData.website}
                onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                maxLength={200}
              />
            </div>

            {/* Social Links */}
            <div className="settings-field-group">
              <label className="settings-field-label">Social Connections</label>
              <div className="settings-form-grid-2">
                <Input
                  label="Twitter / X"
                  placeholder="https://x.com/username"
                  icon={TwitterIcon}
                  value={profileData.twitterUrl}
                  onChange={(e) => setProfileData({ ...profileData, twitterUrl: e.target.value })}
                  maxLength={200}
                />
                <Input
                  label="GitHub"
                  placeholder="https://github.com/username"
                  icon={GithubIcon}
                  value={profileData.githubUrl}
                  onChange={(e) => setProfileData({ ...profileData, githubUrl: e.target.value })}
                  maxLength={200}
                />
              </div>
              <div style={{ marginTop: '10px' }}>
                <Input
                  label="LinkedIn"
                  placeholder="https://linkedin.com/in/username"
                  icon={LinkedinIcon}
                  value={profileData.linkedinUrl}
                  onChange={(e) => setProfileData({ ...profileData, linkedinUrl: e.target.value })}
                  maxLength={200}
                />
              </div>
            </div>

            {/* Submit & Preview Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <Button
                type="button"
                variant="ghost"
                icon={Eye}
                onClick={() => setShowPreviewModal(true)}
              >
                Preview Public Profile
              </Button>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!isProfileDirty || savingProfile}
                  onClick={handleResetProfile}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={savingProfile || !profileData.username.trim()}
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: PUBLIC PROFILE PREVIEW & VISIBILITY */}
        {activeTab === 'public-profile' && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div>
                <h3 className="settings-card-title">
                  <Globe size={20} color="var(--primary)" /> Public Profile Visibility
                </h3>
                <p className="settings-card-subtitle">
                  Decide what details are shared publicly. Private journals and mood analysis are always kept confidential.
                </p>
              </div>

              {authUser?.id && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Eye}
                  onClick={() => navigate(`/profile/${authUser.id}`)}
                >
                  Open Live Public Page
                </Button>
              )}
            </div>

            {/* Live Interactive Preview Card */}
            <div style={{
              borderRadius: 'var(--radius-lg)',
              border: '2px dashed var(--primary-glow)',
              backgroundColor: 'var(--bg-app)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Live Public Preview
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  This is how other writers see you
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                {profileData.avatarUrl ? (
                  <img
                    src={profileData.avatarUrl}
                    alt={displayName}
                    style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00B69B 0%, #10B981 100%)',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.6rem'
                  }}>
                    {initials}
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {displayName}
                    </h4>
                    <span style={{
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)'
                    }}>
                      {profileData.profileLabel}
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    @{profileData.username}
                  </p>
                  {preferences.showLocation && profileData.location && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <MapPin size={13} color="var(--primary)" /> {profileData.location}
                    </span>
                  )}
                </div>
              </div>

              {preferences.showBio && profileData.bio && (
                <div style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                  backgroundColor: '#FFFFFF',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  lineHeight: 1.5
                }}>
                  {profileData.bio}
                </div>
              )}

              {preferences.showInterests && profileData.interests?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {profileData.interests.map(t => (
                    <span key={t} style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '3px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)'
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Visibility Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <h4>Publicly Searchable Profile</h4>
                  <p>Allow other members to discover your profile in user search and community spaces</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.profilePublic}
                    onChange={(e) => setPreferences({ ...preferences, profilePublic: e.target.checked })}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <h4>Show Bio on Public Profile</h4>
                  <p>Display your biography to community readers</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.showBio}
                    onChange={(e) => setPreferences({ ...preferences, showBio: e.target.checked })}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <h4>Show Location</h4>
                  <p>Display your city or country on your public page</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.showLocation}
                    onChange={(e) => setPreferences({ ...preferences, showLocation: e.target.checked })}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <h4>Show Interests & Topics</h4>
                  <p>Display your preferred writing topics and interests chips</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.showInterests}
                    onChange={(e) => setPreferences({ ...preferences, showInterests: e.target.checked })}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>

            <div style={{ alignSelf: 'flex-end', paddingTop: '10px' }}>
              <Button
                variant="primary"
                onClick={handleSavePreferences}
                disabled={savingPreferences}
              >
                {savingPreferences ? 'Saving...' : 'Save Visibility Settings'}
              </Button>
            </div>
          </div>
        )}

        {/* TAB 3: PRIVACY & SECURITY */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Change Password Card */}
            <form onSubmit={handleChangePassword} className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h3 className="settings-card-title">
                    <Lock size={20} color="var(--primary)" /> Change Password
                  </h3>
                  <p className="settings-card-subtitle">
                    Keep your account secure with a strong password of at least 6 characters.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />

                <div className="settings-form-grid-2">
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Repeat new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ alignSelf: 'flex-end', marginTop: '6px' }}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={passwordLoading || !passwordForm.currentPassword || !passwordForm.newPassword}
                >
                  {passwordLoading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </div>
            </form>

            {/* Change Email Card */}
            <form onSubmit={handleChangeEmail} className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h3 className="settings-card-title">
                    <Mail size={20} color="var(--primary)" /> Change Email Address
                  </h3>
                  <p className="settings-card-subtitle">
                    Current email: <strong>{authUser?.email || 'Registered account'}</strong>
                  </p>
                </div>
              </div>

              <div className="settings-form-grid-2">
                <Input
                  label="New Email Address"
                  type="email"
                  placeholder="new.email@example.com"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                  required
                />

                <Input
                  label="Current Password (Verification)"
                  type="password"
                  placeholder="Confirm with your password"
                  value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  required
                />
              </div>

              <div style={{ alignSelf: 'flex-end', marginTop: '6px' }}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={emailLoading || !emailForm.newEmail || !emailForm.password}
                >
                  {emailLoading ? 'Updating Email...' : 'Update Email'}
                </Button>
              </div>
            </form>

            {/* Active Sessions Management */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h3 className="settings-card-title">
                    <Shield size={20} color="var(--primary)" /> Active Sessions & Device Security
                  </h3>
                  <p className="settings-card-subtitle">
                    Manage active sign-in sessions across your browsers and mobile devices.
                  </p>
                </div>
                <span style={{
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary-hover)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-pill)'
                }}>
                  {activeSessions} Active Session{activeSessions === 1 ? '' : 's'}
                </span>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                NoteSphere uses rotated refresh tokens. If you suspect unauthorized access or logged in on a public computer, you can invalidate all sessions everywhere.
              </p>

              <div style={{ alignSelf: 'flex-start' }}>
                <Button
                  variant="secondary"
                  icon={LogOut}
                  onClick={handleSignOutAllSessions}
                  disabled={sessionsLoading}
                >
                  {sessionsLoading ? 'Signing out...' : 'Sign Out Everywhere Else'}
                </Button>
              </div>
            </div>

            {/* Danger Zone: Account Deletion */}
            <div className="settings-card settings-danger-card">
              <div className="settings-card-header" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <div>
                  <h3 className="settings-card-title" style={{ color: 'var(--accent-coral)' }}>
                    <Trash2 size={20} color="var(--accent-coral)" /> Danger Zone: Delete Account
                  </h3>
                  <p className="settings-card-subtitle">
                    Permanently delete your NoteSphere account, journals, comments, friend relations, and all personal data.
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Once deleted, your account cannot be recovered. All encrypted journals, streaks, and community posts will be permanently purged.
              </p>

              <div style={{ alignSelf: 'flex-start' }}>
                <Button
                  variant="danger"
                  icon={Trash2}
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Account...
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: APP PREFERENCES */}
        {activeTab === 'preferences' && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div>
                <h3 className="settings-card-title">
                  <Sliders size={20} color="var(--primary)" /> App & Journaling Preferences
                </h3>
                <p className="settings-card-subtitle">
                  Configure default journaling visibility, writing goals, and notification channels.
                </p>
              </div>
            </div>

            {/* Notification Settings */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="var(--primary)" /> Notification Alerts
              </h4>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <h4>Friend Requests</h4>
                  <p>Receive notifications when someone sends you a friend request</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.notifyFriendRequests}
                    onChange={(e) => setPreferences({ ...preferences, notifyFriendRequests: e.target.checked })}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <h4>Chat & Direct Messages</h4>
                  <p>Receive notifications for real-time messages from friends</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.notifyMessages}
                    onChange={(e) => setPreferences({ ...preferences, notifyMessages: e.target.checked })}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <h4>Comments on Published Posts</h4>
                  <p>Get notified when a reader leaves a thoughtful comment on your story</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.notifyComments}
                    onChange={(e) => setPreferences({ ...preferences, notifyComments: e.target.checked })}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <h4>Reactions & Hearts</h4>
                  <p>Get notified when community members react to your shared posts</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.notifyReactions}
                    onChange={(e) => setPreferences({ ...preferences, notifyReactions: e.target.checked })}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <h4>Community Highlights</h4>
                  <p>Receive featured articles and community updates</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={preferences.notifyCommunity}
                    onChange={(e) => setPreferences({ ...preferences, notifyCommunity: e.target.checked })}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>

            {/* Journaling Defaults */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="var(--primary)" /> Journaling Defaults & Habits
              </h4>

              <div className="settings-form-grid-2">
                {/* Default Journal Privacy */}
                <div className="settings-field-group">
                  <label className="settings-field-label">Default Journal Visibility</label>
                  <select
                    value={preferences.defaultJournalVisibility}
                    onChange={(e) => setPreferences({ ...preferences, defaultJournalVisibility: e.target.value })}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  >
                    <option value="PRIVATE">Private (Only visible to you - Recommended)</option>
                    <option value="PUBLIC">Public (Visible on public profile)</option>
                    <option value="COMMUNITY">Community (Shared with chosen community)</option>
                  </select>
                </div>

                {/* Preferred Category */}
                <div className="settings-field-group">
                  <label className="settings-field-label">Preferred Category</label>
                  <select
                    value={preferences.preferredCategory}
                    onChange={(e) => setPreferences({ ...preferences, preferredCategory: e.target.value })}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Daily Writing Goal */}
              <div className="settings-field-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="settings-field-label">Daily Writing Goal</label>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {preferences.dailyWritingGoalWords} words / day
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="3000"
                  step="50"
                  value={preferences.dailyWritingGoalWords}
                  onChange={(e) => setPreferences({ ...preferences, dailyWritingGoalWords: parseInt(e.target.value, 10) })}
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  A healthy baseline is 300 to 750 words per daily reflection.
                </span>
              </div>
            </div>

            <div style={{ alignSelf: 'flex-end', paddingTop: '10px' }}>
              <Button
                variant="primary"
                onClick={handleSavePreferences}
                disabled={savingPreferences}
              >
                {savingPreferences ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        )}

        {/* TAB 5: DATA PORTABILITY */}
        {activeTab === 'data' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Export Card */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h3 className="settings-card-title">
                    <Download size={20} color="var(--primary)" /> Data Portability & Archive
                  </h3>
                  <p className="settings-card-subtitle">
                    Export and download your complete journaling history, sentiment scores, and tags.
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                You own 100% of your personal writing on NoteSphere. You can generate full machine-readable JSON backups or tabular CSV files for Excel, Notion, or data analysis at any time.
              </p>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px' }}>
                <Button
                  variant="secondary"
                  icon={FileJson}
                  onClick={() => handleExport('json')}
                  disabled={downloading === 'json'}
                >
                  {downloading === 'json' ? 'Generating JSON...' : 'Export as JSON'}
                </Button>
                <Button
                  variant="secondary"
                  icon={FileSpreadsheet}
                  onClick={() => handleExport('csv')}
                  disabled={downloading === 'csv'}
                >
                  {downloading === 'csv' ? 'Generating CSV...' : 'Export as CSV'}
                </Button>
              </div>
            </div>

            {/* Retention & Privacy Policy Card */}
            <div className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h3 className="settings-card-title">
                    <Shield size={20} color="var(--primary)" /> Data Retention & Privacy Policy
                  </h3>
                  <p className="settings-card-subtitle">
                    How NoteSphere handles your personal entries and account records.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    End-to-End Ownership
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Your journals belong exclusively to you. NoteSphere never sells, licenses, or uses your personal entries for external machine-learning training.
                  </p>
                </div>

                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Zero Advertising
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    There are no tracking trackers or cross-site behavioral cookies embedded in NoteSphere.
                  </p>
                </div>

                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <h5 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Immediate Permanent Deletion
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    When you delete your account, all database entries, refresh tokens, and linked media are immediately and permanently erased.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: DELETE ACCOUNT CONFIRMATION */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Account Deletion"
        maxWidth="500px"
        footer={(
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deletingAccount}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={handleDeleteAccount}
              disabled={deletingAccount || deleteConfirmation.trim().toUpperCase() !== 'DELETE' || !deletePassword}
            >
              {deletingAccount ? 'Deleting Account...' : 'Permanently Delete'}
            </Button>
          </div>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            This action is <strong>irreversible</strong>. Please confirm your password and type <strong>DELETE</strong> below to permanently delete your account and all associated journals.
          </p>

          <Input
            label="Type DELETE to confirm"
            placeholder="DELETE"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            required
          />

          <Input
            label="Current Password"
            type="password"
            placeholder="Enter password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            required
          />
        </div>
      </Modal>

      {/* MODAL: LIVE PUBLIC PROFILE PREVIEW */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Public Profile Preview"
        maxWidth="640px"
        footer={(
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
              Close Preview
            </Button>
            {authUser?.id && (
              <Button
                variant="primary"
                onClick={() => {
                  setShowPreviewModal(false);
                  navigate(`/profile/${authUser.id}`);
                }}
              >
                Go to Public Page
              </Button>
            )}
          </div>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {profileData.avatarUrl ? (
              <img
                src={profileData.avatarUrl}
                alt={displayName}
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00B69B 0%, #10B981 100%)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.8rem'
              }}>
                {initials}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {displayName}
                </h3>
                <span style={{
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)'
                }}>
                  {profileData.profileLabel}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                @{profileData.username}
              </p>
              {preferences.showLocation && profileData.location && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <MapPin size={14} color="var(--primary)" /> {profileData.location}
                </span>
              )}
            </div>
          </div>

          {preferences.showBio && profileData.bio && (
            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.92rem',
              color: 'var(--text-primary)',
              lineHeight: 1.5
            }}>
              {profileData.bio}
            </div>
          )}

          {preferences.showInterests && profileData.interests?.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {profileData.interests.map(t => (
                <span
                  key={t}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '4px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)'
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-app)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Shield size={16} color="var(--primary)" />
            Private journal entries, personal drafts, and mood analytics are strictly hidden.
          </div>
        </div>
      </Modal>

      {/* Interactive Avatar Crop & Resize Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        imageSrc={selectedImageForCrop}
        onClose={() => setShowCropModal(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}

export default SettingsPage;
