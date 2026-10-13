import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Users,
  Search,
  X,
  Check,
  MessageSquare,
  UserX,
  Eye,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import friendService from '../api/friendService';
import chatService from '../api/chatService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import PresenceIndicator from '../components/common/PresenceIndicator';
import './FriendsPage.css';

export default function FriendsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tab & search states
  const [activeTab, setActiveTab] = useState('suggestion'); // 'suggestion' | 'connection'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [removeFriendTarget, setRemoveFriendTarget] = useState(null);

  // Privacy toggles matching Reference 4
  const [accountVisibility, setAccountVisibility] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);

  // Load all social data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [friendsData, incomingData, outgoingData, searchData] = await Promise.all([
        friendService.getFriends().catch(() => []),
        friendService.getIncomingRequests().catch(() => []),
        friendService.getOutgoingRequests().catch(() => []),
        friendService.searchUsers(searchQuery).catch(() => ({ content: [] })),
      ]);

      setFriends(friendsData || []);
      setIncomingRequests(incomingData || []);
      setOutgoingRequests(outgoingData || []);
      setSuggestedUsers(searchData?.content || []);
    } catch (err) {
      console.error('Failed to load friends data:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Search Input with Debounce
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Friend Request Actions
  const handleSendRequest = async (targetUserId) => {
    setActionLoadingId(targetUserId);
    try {
      await friendService.sendFriendRequest(targetUserId);
      setStatusMessage({ type: 'success', text: 'Friend request sent!' });
      // Update local state
      setSuggestedUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserId
            ? { ...u, friendshipStatus: 'PENDING_SENT' }
            : u
        )
      );
      const updatedOutgoing = await friendService.getOutgoingRequests();
      setOutgoingRequests(updatedOutgoing);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to send friend request' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setActionLoadingId(requestId);
    try {
      const acceptedFriend = await friendService.acceptFriendRequest(requestId);
      setStatusMessage({ type: 'success', text: `Connected with ${acceptedFriend?.username || 'new friend'}!` });
      // Refresh friends and incoming requests
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      const updatedFriends = await friendService.getFriends();
      setFriends(updatedFriends);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to accept request' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setActionLoadingId(requestId);
    try {
      await friendService.rejectFriendRequest(requestId);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      setStatusMessage({ type: 'info', text: 'Friend invitation rejected' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reject request' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelRequest = async (requestId, targetUserId) => {
    setActionLoadingId(requestId);
    try {
      await friendService.cancelFriendRequest(requestId);
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== requestId));
      setSuggestedUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserId || u.friendRequestId === requestId
            ? { ...u, friendshipStatus: 'NONE', friendRequestId: null }
            : u
        )
      );
      setStatusMessage({ type: 'info', text: 'Friend request cancelled' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to cancel request' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenChat = async (friendId) => {
    try {
      const convo = await chatService.getOrCreateConversation(friendId);
      if (convo?.id) {
        navigate(`/chat?conversationId=${convo.id}`);
      } else {
        navigate('/chat');
      }
    } catch (err) {
      navigate('/chat');
    }
  };

  const handleConfirmRemoveFriend = async () => {
    if (!removeFriendTarget) return;
    try {
      await friendService.removeFriend(removeFriendTarget.friendId);
      setFriends((prev) => prev.filter((f) => f.friendId !== removeFriendTarget.friendId));
      setStatusMessage({ type: 'info', text: `Removed ${removeFriendTarget.username} from your connections` });
      setRemoveFriendTarget(null);
      // Refresh suggestions
      loadData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to remove connection' });
    }
  };

  return (
    <div className="friends-page-container">
      {/* Top Header */}
      <div className="friends-header">
        <div className="friends-title-row">
          <h1>
            <Users size={26} color="var(--primary)" />
            Add Friends
          </h1>
        </div>

        {/* Search Bar matching Reference 1 */}
        <div className="friends-search-wrapper">
          <Search size={18} className="friends-search-icon" />
          <input
            type="text"
            className="friends-search-input"
            placeholder="Find Friends by username..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button className="friends-search-clear" onClick={handleClearSearch} title="Clear search">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Tab Controls matching Reference 1 */}
        <div className="friends-tabs">
          <button
            className={`friends-tab-btn ${activeTab === 'suggestion' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestion')}
          >
            Suggestion
          </button>
          <button
            className={`friends-tab-btn ${activeTab === 'connection' ? 'active' : ''}`}
            onClick={() => setActiveTab('connection')}
          >
            Your Connection
            {incomingRequests.length > 0 && (
              <span className="friends-section-badge" style={{ marginLeft: 4 }}>
                {incomingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Temporary Toast / Banner Message */}
      {statusMessage && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor:
              statusMessage.type === 'error'
                ? '#FEE2E2'
                : statusMessage.type === 'success'
                ? '#E7F8F5'
                : '#F1F5F9',
            color:
              statusMessage.type === 'error'
                ? '#DC2626'
                : statusMessage.type === 'success'
                ? 'var(--primary)'
                : '#475569',
          }}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
          <LoadingSpinner size="lg" message="Loading connections..." />
        </div>
      ) : (
        <>
          {/* TAB 1: SUGGESTION / DISCOVER */}
          {activeTab === 'suggestion' && (
            <div className="friends-section">
              <div className="friends-section-title">
                <span>People You May Know</span>
                <span className="friends-section-badge">{suggestedUsers.length}</span>
              </div>

              {suggestedUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p>No new user suggestions found matching "{searchQuery}".</p>
                </div>
              ) : (
                <div className="users-grid">
                  {suggestedUsers.map((target) => (
                    <div key={target.id} className="user-card">
                      <div
                        className="user-card-left"
                        onClick={() => navigate('/profile/' + target.id)}
                        style={{ cursor: 'pointer' }}
                        title="View Public Profile"
                      >
                        <div className="user-avatar-wrapper">
                          {target.avatarUrl ? (
                            <img
                              src={target.avatarUrl}
                              alt={target.username}
                              className="user-avatar"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="user-avatar">
                              {target.username ? target.username.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                        </div>
                        <div className="user-meta">
                          <h4>{target.fullName || target.username}</h4>
                          <div className="user-handle">@{target.username?.toLowerCase()}</div>
                          {target.profileLabel && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                              {target.profileLabel}
                            </div>
                          )}
                          {target.mutualFriendsCount > 0 && (
                            <div className="user-mutuals">
                              <Sparkles size={12} />
                              {target.mutualFriendsCount} mutual connection{target.mutualFriendsCount > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="user-card-actions">
                        {target.friendshipStatus === 'FRIENDS' ? (
                          <button
                            className="btn-chat"
                            onClick={() => handleOpenChat(target.id)}
                            title="Chat with friend"
                          >
                            <MessageSquare size={14} />
                            Chat
                          </button>
                        ) : target.friendshipStatus === 'PENDING_SENT' ? (
                          <button
                            className="status-badge-pending"
                            onClick={() => target.friendRequestId && handleCancelRequest(target.friendRequestId, target.id)}
                            title="Click to cancel pending request"
                            style={{ cursor: 'pointer', border: 'none' }}
                          >
                            Pending
                          </button>
                        ) : target.friendshipStatus === 'PENDING_RECEIVED' ? (
                          <button
                            className="btn-accept"
                            onClick={() => target.friendRequestId && handleAcceptRequest(target.friendRequestId)}
                          >
                            <Check size={14} /> Accept
                          </button>
                        ) : (
                          <button
                            className="btn-add-friend"
                            disabled={actionLoadingId === target.id}
                            onClick={() => handleSendRequest(target.id)}
                          >
                            <UserPlus size={14} />
                            {actionLoadingId === target.id ? 'Adding...' : 'Add'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: YOUR CONNECTION (Invitations + Friends List) */}
          {activeTab === 'connection' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {/* Section 1: Invitations Matching Reference 1 & 2 */}
              {incomingRequests.length > 0 && (
                <div className="friends-section">
                  <div className="friends-section-title">
                    <span>Pending Invitations</span>
                    <span className="friends-section-badge">{incomingRequests.length}</span>
                  </div>

                  <div className="invitation-cards-list">
                    {incomingRequests.map((req) => (
                      <div key={req.id} className="invitation-card">
                        <div className="invitation-info">
                          <div className="invitation-avatar">
                            {req.senderUsername ? req.senderUsername.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="invitation-details">
                            <h4>
                              {req.senderUsername} <span>wants to connect with you</span>
                            </h4>
                            <div className="invitation-meta">
                              <Clock size={13} />
                              Sent {new Date(req.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="invitation-actions">
                          <button
                            className="btn-accept"
                            disabled={actionLoadingId === req.id}
                            onClick={() => handleAcceptRequest(req.id)}
                          >
                            <Check size={14} />
                            Accept
                          </button>
                          <button
                            className="btn-reject"
                            disabled={actionLoadingId === req.id}
                            onClick={() => handleRejectRequest(req.id)}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Established Connections Matching Reference 1 */}
              <div className="friends-section">
                <div className="friends-section-title">
                  <span>Your Connection</span>
                  <span className="friends-section-badge">{friends.length}</span>
                </div>

                {friends.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p>You haven't connected with any friends yet.</p>
                    <button
                      className="btn-add-friend"
                      style={{ margin: '12px auto' }}
                      onClick={() => setActiveTab('suggestion')}
                    >
                      <UserPlus size={15} /> Find Friends
                    </button>
                  </div>
                ) : (
                  <div className="users-grid">
                    {friends.map((friend) => (
                      <div key={friend.friendId} className="user-card">
                        <div
                          className="user-card-left"
                          onClick={() => navigate('/profile/' + friend.friendId)}
                          style={{ cursor: 'pointer' }}
                          title="View Public Profile"
                        >
                          <div className="user-avatar-wrapper">
                            {friend.avatarUrl ? (
                              <img
                                src={friend.avatarUrl}
                                alt={friend.username}
                                className="user-avatar"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="user-avatar">
                                {friend.username ? friend.username.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                            <PresenceIndicator
                              userId={friend.friendId}
                              fallbackOnline={friend.online}
                              fallbackLastSeen={friend.lastSeenAt}
                              size="sm"
                              className="avatar-presence-dot"
                            />
                          </div>
                          <div className="user-meta">
                            <h4>{friend.fullName || friend.username}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span className="user-handle" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                                @{friend.username?.toLowerCase()}
                              </span>
                              <span style={{ color: 'var(--border-subtle, #CBD5E1)', fontSize: '0.75rem' }}>•</span>
                              <PresenceIndicator
                                userId={friend.friendId}
                                showLabel={true}
                                fallbackOnline={friend.online}
                                fallbackLastSeen={friend.lastSeenAt}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="invitation-actions">
                          <button
                            className="btn-chat"
                            onClick={() => handleOpenChat(friend.friendId)}
                            title="Open Chat"
                          >
                            <MessageSquare size={14} />
                            Chat
                          </button>
                          <button
                            className="btn-remove-friend"
                            title="Remove connection"
                            onClick={() => setRemoveFriendTarget(friend)}
                          >
                            <UserX size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Outgoing Requests */}
              {outgoingRequests.length > 0 && (
                <div className="friends-section">
                  <div className="friends-section-title">
                    <span>Sent Requests</span>
                    <span className="friends-section-badge">{outgoingRequests.length}</span>
                  </div>

                  <div className="invitation-cards-list">
                    {outgoingRequests.map((req) => (
                      <div key={req.id} className="invitation-card">
                        <div className="invitation-info">
                          <div className="invitation-avatar" style={{ background: '#CBD5E1' }}>
                            {req.receiverUsername ? req.receiverUsername.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="invitation-details">
                            <h4>
                              Request to <strong>{req.receiverUsername}</strong>
                            </h4>
                            <div className="invitation-meta">
                              <Clock size={13} />
                              Pending approval
                            </div>
                          </div>
                        </div>

                        <button
                          className="btn-reject"
                          onClick={() => handleCancelRequest(req.id, req.receiverId)}
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Privacy & Security Section matching Reference 4 */}
          <div className="privacy-settings-card" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Privacy & Security
              </h3>
            </div>

            <div className="privacy-toggle-item">
              <div className="privacy-toggle-left">
                <div className="privacy-toggle-icon">
                  <Eye size={18} />
                </div>
                <div className="privacy-toggle-text">
                  <h4>Account visibility</h4>
                  <p>People can find you in search suggestions</p>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={accountVisibility}
                  onChange={(e) => setAccountVisibility(e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="privacy-toggle-item">
              <div className="privacy-toggle-left">
                <div className="privacy-toggle-icon">
                  <Users size={18} />
                </div>
                <div className="privacy-toggle-text">
                  <h4>Online status</h4>
                  <p>People can see your active online status</p>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={onlineStatus}
                  onChange={(e) => setOnlineStatus(e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal for Removing a Friend */}
      {removeFriendTarget && (
        <Modal
          isOpen={true}
          onClose={() => setRemoveFriendTarget(null)}
          title="Remove Connection"
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>{removeFriendTarget.username}</strong> from your friends?
              You will not be able to send private messages until you connect again.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn-reject"
                onClick={() => setRemoveFriendTarget(null)}
              >
                Keep Connection
              </button>
              <button
                style={{
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={handleConfirmRemoveFriend}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
