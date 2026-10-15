import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import {
  User,
  MapPin,
  Globe,
  Calendar,
  BookOpen,
  Users,
  UserPlus,
  UserCheck,
  Clock,
  MessageSquare,
  ArrowLeft,
  Shield,
  Heart,
  Share2,
  Check,
  Edit3,
  Eye
} from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ContentDetailModal } from '../components/common/ContentDetailModal';
import { useAuth } from '../context/AuthContext';
import userService from '../api/userService';
import friendService from '../api/friendService';
import { normalizeAvatarUrl } from '../utils/avatarUtils';
import { formatJournalCardDate } from '../utils/dateUtils';

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

export function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { toggleMobileMenu } = useOutletContext() || {};

  const [profile, setProfile] = useState(null);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);

  const isOwnProfile = authUser && (authUser.id === userId || authUser.username === userId);

  useEffect(() => {
    let isMounted = true;
    async function fetchProfileData() {
      setLoading(true);
      setError(null);
      try {
        const targetId = isOwnProfile ? authUser.id : userId;
        const [profileData, journalsData] = await Promise.all([
          userService.getUserProfile(targetId).catch(err => {
            if (isOwnProfile) {
              return userService.getMe();
            }
            throw err;
          }),
          userService.getUserPublishedJournals(targetId, 0, 20).catch(() => ({ content: [] }))
        ]);

        if (isMounted) {
          setProfile(profileData);
          setJournals(journalsData?.content || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load user profile');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (userId || authUser) {
      fetchProfileData();
    }
    return () => {
      isMounted = false;
    };
  }, [userId, authUser, isOwnProfile]);

  const handleFriendAction = async () => {
    if (!profile || isOwnProfile) return;
    setActionLoading(true);
    try {
      if (profile.friendshipStatus === 'NONE' || !profile.friendshipStatus) {
        await friendService.sendFriendRequest(profile.id);
        setProfile(prev => ({ ...prev, friendshipStatus: 'PENDING_SENT' }));
      } else if (profile.friendshipStatus === 'PENDING_RECEIVED' && profile.friendRequestId) {
        await friendService.acceptFriendRequest(profile.friendRequestId);
        setProfile(prev => ({
          ...prev,
          friendshipStatus: 'FRIENDS',
          friendsCount: (prev.friendsCount || 0) + 1
        }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update friendship status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div>
        <Header
          title="User Profile"
          subtitle="Loading public writer profile..."
          onToggleMobileMenu={toggleMobileMenu}
        />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div>
        <Header
          title="Profile Not Found"
          subtitle="The requested user profile could not be found or is private."
          onToggleMobileMenu={toggleMobileMenu}
        />
        <div className="center-page-body" style={{ maxWidth: '640px', padding: '40px 20px' }}>
          <EmptyState
            title="Profile Unavailable"
            description={error || "This profile may be set to private or does not exist."}
            actionLabel="Back to Community"
            onAction={() => navigate('/communities')}
          />
        </div>
      </div>
    );
  }

  const displayName = profile.fullName || profile.username || 'NoteSphere Writer';
  const label = profile.profileLabel || 'Writer';
  const initials = displayName
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div>
      <Header
        title={displayName}
        subtitle={`@${profile.username} • ${label}`}
        onToggleMobileMenu={toggleMobileMenu}
      />

      <div className="center-page-body" style={{ maxWidth: '880px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={18} /> Back
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={copiedLink ? Check : Share2}
              onClick={handleCopyLink}
            >
              {copiedLink ? 'Link Copied!' : 'Share Profile'}
            </Button>
            {isOwnProfile && (
              <Button
                variant="primary"
                size="sm"
                icon={Edit3}
                onClick={() => navigate('/settings')}
              >
                Edit My Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '36px',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            {/* Avatar & Identifiers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
              {(() => {
                const profileAvatar = normalizeAvatarUrl(profile.avatarUrl);
                return (
                  <>
                    {profileAvatar ? (
                      <img
                        src={profileAvatar}
                        alt={displayName}
                        style={{
                          width: '92px',
                          height: '92px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '3px solid var(--primary-light)',
                          boxShadow: 'var(--shadow-md)'
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div style={{
                      width: '92px',
                      height: '92px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00B69B 0%, #10B981 100%)',
                      color: '#FFFFFF',
                      fontSize: '2rem',
                      fontWeight: 800,
                      display: profileAvatar ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-md)'
                    }}>
                      {initials}
                    </div>
                  </>
                );
              })()}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {displayName}
                  </h2>
                  <span style={{
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-pill)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {label}
                  </span>
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '8px' }}>
                  @{profile.username}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {profile.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={15} color="var(--primary)" /> {profile.location}
                    </span>
                  )}
                  {profile.createdAt && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={15} /> Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Interaction Buttons (If not own profile) */}
            {!isOwnProfile && authUser && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {profile.friendshipStatus === 'FRIENDS' ? (
                  <>
                    <Badge variant="primary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                      <UserCheck size={16} style={{ marginRight: '6px' }} /> Friends
                    </Badge>
                    <Button
                      variant="primary"
                      icon={MessageSquare}
                      onClick={() => navigate('/chat')}
                    >
                      Message
                    </Button>
                  </>
                ) : profile.friendshipStatus === 'PENDING_SENT' ? (
                  <Button variant="secondary" disabled icon={Clock}>
                    Request Sent
                  </Button>
                ) : profile.friendshipStatus === 'PENDING_RECEIVED' ? (
                  <Button
                    variant="primary"
                    icon={UserCheck}
                    onClick={handleFriendAction}
                    disabled={actionLoading}
                  >
                    Accept Request
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    icon={UserPlus}
                    onClick={handleFriendAction}
                    disabled={actionLoading}
                  >
                    Add Friend
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              lineHeight: 1.6
            }}>
              {profile.bio}
            </div>
          )}

          {/* Interests & Social Links */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingTop: '10px' }}>
            {/* Interests Chips */}
            {profile.interests && profile.interests.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Interests:
                </span>
                {profile.interests.map((topic, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}

            {/* Social / Web Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {profile.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--text-secondary)',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'var(--transition-fast)'
                  }}
                  title="Website"
                >
                  <Globe size={18} />
                </a>
              )}
              {profile.twitterUrl && (
                <a
                  href={profile.twitterUrl.startsWith('http') ? profile.twitterUrl : `https://${profile.twitterUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--text-secondary)',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'var(--transition-fast)'
                  }}
                  title="Twitter / X"
                >
                  <TwitterIcon size={18} />
                </a>
              )}
              {profile.githubUrl && (
                <a
                  href={profile.githubUrl.startsWith('http') ? profile.githubUrl : `https://${profile.githubUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--text-secondary)',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'var(--transition-fast)'
                  }}
                  title="GitHub"
                >
                  <GithubIcon size={18} />
                </a>
              )}
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl.startsWith('http') ? profile.linkedinUrl : `https://${profile.linkedinUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--text-secondary)',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'var(--transition-fast)'
                  }}
                  title="LinkedIn"
                >
                  <LinkedinIcon size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                {journals.length || profile.publishedJournalsCount || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Published Stories
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {profile.friendsCount || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Friends
              </div>
            </div>

            {profile.mutualFriendsCount > 0 && !isOwnProfile && (
              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-mint)' }}>
                  {profile.mutualFriendsCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Mutual Friends
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Published Stories Section */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <BookOpen size={20} color="var(--primary)" />
              Published Stories & Reflections ({journals.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} color="var(--primary)" /> Private journals & mood analytics kept confidential
            </span>
          </div>

          {journals.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center' }}>
              <EmptyState
                title="No Public Stories Yet"
                description={`${displayName} has not published any public journal entries or community articles yet.`}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {journals.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => setSelectedJournal(entry)}
                  style={{
                    padding: '20px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-card-hover)',
                    transition: 'var(--transition-fast)',
                    cursor: 'pointer'
                  }}
                  title="Click to read full story"
                >
                  {/* Cover Photo */}
                  {(entry.coverImageUrl || entry.coverImage) && (
                    <div style={{
                      width: '100%',
                      height: '210px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      marginBottom: '14px',
                      backgroundColor: 'var(--bg-subtle)'
                    }}>
                      <img
                        src={entry.coverImageUrl || entry.coverImage}
                        alt={entry.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        onError={(e) => {
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.style.display = 'none';
                          }
                        }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {entry.title}
                    </h4>
                    {entry.category && (
                      <Badge variant="secondary" size="sm">
                        {entry.category}
                      </Badge>
                    )}
                  </div>

                  <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: '8px 0 12px 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {entry.content}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={13} style={{ color: 'var(--primary)' }} />
                        {formatJournalCardDate(entry)}
                      </span>
                      {entry.communityName && (
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                          in {entry.communityName}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }} title="Total Views">
                        <Eye size={14} /> {entry.viewCount || 0} {entry.viewCount === 1 ? 'view' : 'views'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Heart size={14} color="var(--accent-coral)" /> {entry.likeCount || 0}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={14} color="var(--primary)" /> {entry.commentCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Story Detail / View Modal */}
      {selectedJournal && (
        <ContentDetailModal
          journal={selectedJournal}
          onClose={() => setSelectedJournal(null)}
          onViewCountUpdate={(journalId, newCount) => {
            setJournals((prev) =>
              prev.map((j) => (j.id === journalId ? { ...j, viewCount: newCount } : j))
            );
            setSelectedJournal((prev) => (prev && prev.id === journalId ? { ...prev, viewCount: newCount } : prev));
          }}
        />
      )}
    </div>
  );
}

export default PublicProfilePage;
