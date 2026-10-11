import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import chatService from '../api/chatService';
import websocketService from '../api/websocketService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './ChatPage.css';

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConversationId = searchParams.get('conversationId');

  // State
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of message timeline
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // 1. Initialize WebSocket connection with stored token
  useEffect(() => {
    const token = localStorage.getItem('notesphere_access_token');
    if (token) {
      websocketService.connect(
        token,
        () => setWsConnected(true),
        () => setWsConnected(false)
      );
    }

    const unsubStatus = websocketService.onStatusChange((status) => {
      setWsConnected(status);
    });

    return () => {
      unsubStatus();
    };
  }, []);

  // 2. Load Conversation List
  const loadConversations = useCallback(async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data || []);
      return data || [];
    } catch (err) {
      console.error('Failed to load conversations:', err);
      return [];
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    loadConversations().then((convos) => {
      if (convos.length > 0 && !activeConversationId) {
        setSearchParams({ conversationId: convos[0].id });
      }
    });
  }, [loadConversations, activeConversationId, setSearchParams]);

  // 3. When activeConversationId changes, load messages & subscribe to STOMP channel
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setLoadingMessages(true);

    chatService
      .getMessages(activeConversationId, 0, 50)
      .then((data) => {
        if (!isMounted) return;
        // Backend returns descending (newest first); reverse for chat timeline display
        const chronological = (data.content || []).slice().reverse();
        setMessages(chronological);
        // Mark conversation messages as read
        chatService.markAsRead(activeConversationId).catch(() => {});
        // Update local unread counter in conversation list
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
        );
      })
      .catch((err) => {
        console.error('Failed to load messages:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingMessages(false);
        setTimeout(() => scrollToBottom(false), 100);
      });

    // Subscribe to STOMP topic for this conversation
    const unsubscribe = websocketService.subscribeToConversation(
      activeConversationId,
      (newMsg) => {
        if (!isMounted) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const msgWithDirection = {
            ...newMsg,
            isOutgoing: newMsg.senderId === user?.id,
          };
          return [...prev, msgWithDirection];
        });

        // Update last message snippet in conversation sidebar
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  lastMessage: newMsg.content,
                  lastMessageAt: newMsg.createdAt,
                  unreadCount: 0,
                }
              : c
          )
        );

        // Mark as read immediately since user is actively in conversation
        chatService.markAsRead(activeConversationId).catch(() => {});
        setTimeout(() => scrollToBottom(true), 50);
      }
    );

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [activeConversationId, user?.id]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages]);

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const content = messageText.trim();
    if (!content || !activeConversationId || isSending) return;

    setIsSending(true);
    setMessageText('');

    try {
      if (wsConnected) {
        // Primary real-time pathway via STOMP
        websocketService.sendMessage(activeConversationId, content);
      } else {
        // Fallback REST pathway if WebSocket is briefly disconnected
        const sentMsg = await chatService.sendMessage(activeConversationId, content);
        setMessages((prev) => [...prev, { ...sentMsg, isOutgoing: true }]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  lastMessage: sentMsg.content,
                  lastMessageAt: sentMsg.createdAt,
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Restore input text on error
      setMessageText(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations matching search
  const filteredConversations = conversations.filter((c) =>
    (c.friendUsername || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMessageTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-page-layout">
      {/* LEFT SIDEBAR: CONVERSATION LIST */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-title-row">
            <h2>Chats</h2>
            <button
              className="chat-header-action-btn"
              onClick={() => navigate('/friends')}
              title="Add or Find Friends"
            >
              <Users size={20} />
            </button>
          </div>

          <div className="chat-search-wrapper">
            <Search size={16} className="chat-search-icon" />
            <input
              type="text"
              className="chat-search-input"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="conversations-list">
          {loadingConversations ? (
            <div style={{ padding: '30px', textAlign: 'center' }}>
              <LoadingSpinner size="md" message="Loading chats..." />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No conversations found.</p>
              <button
                className="btn-add-friend"
                style={{ margin: '14px auto 0 auto' }}
                onClick={() => navigate('/friends')}
              >
                Find Friends to Chat
              </button>
            </div>
          ) : (
            filteredConversations.map((convo) => {
              const isActive = convo.id === activeConversationId;
              return (
                <div
                  key={convo.id}
                  className={`conversation-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSearchParams({ conversationId: convo.id })}
                >
                  <div className="convo-left">
                    <div className="convo-avatar-wrapper">
                      <div className="convo-avatar">
                        {convo.friendUsername ? convo.friendUsername.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="online-dot" />
                    </div>
                    <div className="convo-meta">
                      <span className="convo-name">{convo.friendUsername}</span>
                      <span className="convo-last-msg">
                        {convo.lastMessage || 'Say hello to start the chat!'}
                      </span>
                    </div>
                  </div>

                  <div className="convo-right">
                    <span className="convo-time">
                      {formatMessageTime(convo.lastMessageAt)}
                    </span>
                    {convo.unreadCount > 0 && (
                      <span className="convo-unread-badge">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT MAIN: ACTIVE CHAT WINDOW */}
      <div className="chat-window">
        {activeConversation ? (
          <>
            {/* Header matching Reference 3 */}
            <div className="chat-window-header">
              <div className="chat-header-user">
                <div className="chat-header-avatar">
                  {activeConversation.friendUsername
                    ? activeConversation.friendUsername.charAt(0).toUpperCase()
                    : 'U'}
                </div>
                <div className="chat-header-info">
                  <h3>{activeConversation.friendUsername}</h3>
                  <div className="chat-header-status">
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        display: 'inline-block',
                      }}
                    />
                    <span>online</span>
                  </div>
                </div>
              </div>

              <div className="chat-header-actions">
                <button className="chat-header-action-btn" title="Voice call">
                  <Phone size={18} />
                </button>
                <button className="chat-header-action-btn" title="Video call">
                  <Video size={18} />
                </button>
                <button className="chat-header-action-btn" title="Search conversation">
                  <Search size={18} />
                </button>
                <button className="chat-header-action-btn" title="More options">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Message Stream */}
            <div className="chat-messages-container">
              {loadingMessages ? (
                <div style={{ margin: 'auto' }}>
                  <LoadingSpinner size="md" message="Loading messages..." />
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-empty-state">
                  <div className="chat-empty-icon">
                    <MessageSquare size={32} />
                  </div>
                  <h3>No messages yet</h3>
                  <p>Send a message below to start your private conversation with {activeConversation.friendUsername}!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOutgoing = msg.isOutgoing || msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`message-bubble-wrapper ${isOutgoing ? 'outgoing' : 'incoming'}`}
                    >
                      <div className={`message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                        {msg.content}
                      </div>
                      <div className="message-time-row">
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        {isOutgoing && (
                          msg.isRead ? (
                            <CheckCheck size={14} color="#00B69B" />
                          ) : (
                            <Check size={14} />
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Composer matching Reference 3 */}
            <form className="chat-composer-wrapper" onSubmit={handleSendMessage}>
              <button
                type="button"
                className="composer-action-btn"
                title="Attach file"
              >
                <Paperclip size={20} />
              </button>
              <button
                type="button"
                className="composer-action-btn"
                title="Insert emoji"
              >
                <Smile size={20} />
              </button>

              <input
                type="text"
                className="composer-input-field"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
              />

              <button
                type="submit"
                className="composer-send-btn"
                disabled={!messageText.trim() || isSending}
                title="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">
              <MessageSquare size={36} />
            </div>
            <h3>Select a Conversation</h3>
            <p>Choose a friend from the list or add new connections to start a private chat.</p>
            <button
              className="btn-chat"
              style={{ marginTop: 14 }}
              onClick={() => navigate('/friends')}
            >
              <Users size={16} /> Discover Friends
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
