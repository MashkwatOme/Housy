import React, { useState, useRef, useEffect } from 'react';
import './TenantMessages.css';
import Navbar from '../../properties/components/Navbar';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../../auth/hooks/useAuth';

const TenantMessages = ({ onNavigate }) => {
    const { user } = useAuth();
    const {
        conversations,
        activeConversation,
        setActiveConversation,
        messages,
        loading,
        messagesLoading,
        onlineUsers,
        typingConversations,
        sendTypingNotification,
        markMessagesRead,
        sendMessage
    } = useChat();

    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    const isPartnerTyping = activeConversation ? typingConversations[String(activeConversation.id)] : false;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isPartnerTyping]);

    useEffect(() => {
        console.log('[Messenger] Partner is typing:', isPartnerTyping, 'Typing map:', typingConversations);
    }, [isPartnerTyping, typingConversations]);

    useEffect(() => {
        if (!activeConversation && conversations.length > 0) {
            setActiveConversation(conversations[0]);
        }
    }, [conversations, activeConversation, setActiveConversation]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !activeConversation) return;

        const text = inputText;
        setInputText('');
        try {
            await sendMessage(activeConversation.id, text);
        } catch (err) {
            console.error('Failed to send message:', err);
            // Put it back in input if it fails
            setInputText(text);
        }
    };

    const handleInputChange = (e) => {
        setInputText(e.target.value);
        if (activeConversation) {
            sendTypingNotification(activeConversation.id);
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const date = new Date(timeString);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + 
               date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Determine the active user display details
    const getOtherUserName = (conv) => {
        if (!conv || !user) return '';
        return user.id === conv.tenant_id ? conv.owner_name : conv.tenant_name;
    };

    const activeOtherUserName = getOtherUserName(activeConversation);

    return (
        <div className="tenant-messages-layout">
            <Navbar onNavigate={onNavigate} activeTab="messages" />
            
            <main className="tenant-messages-main">
                <div className="messages-container-card">
                    
                    {/* Left: Chat list */}
                    <div className="messages-sidebar">
                        <div className="sidebar-header">
                            <h2>Conversations</h2>
                            <p className="subtitle">Housy Direct Messenger</p>
                        </div>
                        <div className="chats-list">
                            {loading && conversations.length === 0 ? (
                                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    Loading conversations...
                                </div>
                            ) : conversations.length === 0 ? (
                                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                                    No active conversations. Browse properties to start chatting with owners!
                                </div>
                            ) : (
                                conversations.map((conv) => {
                                    const otherName = getOtherUserName(conv);
                                    const isActive = activeConversation?.id === conv.id;
                                    const latestMsg = conv.latest_message || "No messages yet";
                                    const timeStr = conv.latest_message_time ? formatTime(conv.latest_message_time) : "";
                                    const initials = otherName ? otherName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

                                    const otherUserId = user?.id === conv.tenant_id ? conv.owner_id : conv.tenant_id;
                                    const isPartnerOnline = onlineUsers.includes(String(otherUserId));

                                    return (
                                        <div 
                                            key={conv.id}
                                            className={`chat-channel-item ${isActive ? 'active' : ''}`}
                                            onClick={() => setActiveConversation(conv)}
                                        >
                                            <div className="channel-avatar support-avatar" style={{ marginTop: '2px' }}>
                                                <div className="avatar-support-initials">{initials}</div>
                                                <span className={`online-indicator ${isPartnerOnline ? 'online' : 'offline'}`}></span>
                                            </div>
                                            <div className="channel-details">
                                                <div className="channel-meta">
                                                    <span className="name">{otherName}</span>
                                                    <span className="time">{timeStr}</span>
                                                </div>
                                                <p className="last-msg" style={{ marginBottom: '8px', WebkitLineClamp: 1, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {latestMsg}
                                                </p>
                                                
                                                {/* Mini Property Card */}
                                                {conv.title && (
                                                    <div style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: '8px', 
                                                        padding: '6px 8px', 
                                                        backgroundColor: isActive ? '#f8fafc' : '#f1f5f9', 
                                                        borderRadius: '6px', 
                                                        border: '1px solid var(--color-border)' 
                                                    }}>
                                                        <div style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '4px',
                                                            backgroundColor: 'var(--color-primary)',
                                                            color: 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '10px',
                                                            fontWeight: 'bold',
                                                            flexShrink: 0
                                                        }}>
                                                            {conv.title.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div style={{ minWidth: 0, textAlign: 'left' }}>
                                                            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {conv.title}
                                                            </div>
                                                            {conv.monthly_rent && (
                                                                <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                                                                    ${parseFloat(conv.monthly_rent).toLocaleString()}/mo • {conv.area || 'Housy'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right: Message feed */}
                    <div className="messages-feed-pane">
                        <div className="feed-header">
                            {activeConversation ? (
                                <div className="active-user-details">
                                    <div className="header-avatar support-avatar-header">
                                        {activeOtherUserName ? activeOtherUserName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                                    </div>
                                    <div>
                                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {activeOtherUserName} 
                                            <span className="role-tag" style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>
                                                — {user?.id === activeConversation.tenant_id ? 'Owner' : 'Tenant'}
                                            </span>
                                        </h3>
                                        {(() => {
                                            const otherUserId = user?.id === activeConversation.tenant_id ? activeConversation.owner_id : activeConversation.tenant_id;
                                            const isActivePartnerOnline = onlineUsers.includes(String(otherUserId));
                                            return isActivePartnerOnline ? (
                                                <span className="active-status" style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                                                    <span style={{ width: '6px', height: '6px', backgroundColor: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
                                                    Online now
                                                </span>
                                            ) : (
                                                <span className="active-status offline" style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                                                    <span style={{ width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%', display: 'inline-block' }}></span>
                                                    Offline
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ) : (
                                <div className="active-user-details">
                                    <div className="header-avatar support-avatar-header">CR</div>
                                    <div>
                                        <h3>No Chat Selected</h3>
                                        <span className="active-status offline">Select a conversation to start chatting</span>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {activeConversation && (
                                    <button onClick={() => onNavigate('details', activeConversation.property_id)} className="btn-view-property">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
                                        View Property
                                    </button>
                                )}
                                <button onClick={() => onNavigate('browse')} className="btn-back-browse-messages">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    Back to Browse Properties
                                </button>
                                <button onClick={() => onNavigate('tenant-dashboard')} className="btn-close-chat">
                                    Close Chat
                                </button>
                            </div>
                        </div>

                        {activeConversation && (
                            <div className="discussing-bar">
                                <div className="discussing-left">
                                    <span className="label">Discussing:</span>
                                    <strong className="property-title">{activeConversation.title}</strong>
                                    {activeConversation.monthly_rent && (
                                        <>
                                            <span className="divider">|</span>
                                            <span className="property-price">৳{parseFloat(activeConversation.monthly_rent).toLocaleString()}/mo</span>
                                        </>
                                    )}
                                    {activeConversation.area && (
                                        <>
                                            <span className="bullet">•</span>
                                            <span className="property-location">{activeConversation.area}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="feed-messages-wrapper">
                            {activeConversation ? (
                                messagesLoading ? (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                                        Loading messages...
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                                        No messages in this conversation yet. Send a message to start the chat!
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isMe = msg.sender_id === user?.id;
                                        const senderName = msg.name || (isMe ? user?.name : 'Other');
                                        const initials = senderName ? senderName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
                                        
                                        return (
                                            <div key={msg.id} className={`message-bubble-row ${isMe ? 'me' : 'them'}`}>
                                                {!isMe && (
                                                    <div className="sender-chat-avatar">
                                                        <div className="avatar-support-initials small">{initials}</div>
                                                    </div>
                                                )}
                                                <div className="bubble-content-block">
                                                    <div className="bubble-text">{msg.message}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                                        <span className="bubble-time">{formatTime(msg.created_at)}</span>
                                                        {isMe && (
                                                            msg.is_read ? (
                                                                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                                    ✓✓ <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Seen</span>
                                                                </span>
                                                            ) : (
                                                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>
                                                                    ✓
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            ) : (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                                    Select a conversation from the sidebar to view messages.
                                </div>
                            )}
                            
                            {activeConversation && isPartnerTyping && (
                                <div className="message-bubble-row them" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                                    <div className="sender-chat-avatar">
                                        <div className="avatar-support-initials small">
                                            {activeOtherUserName ? activeOtherUserName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                                        </div>
                                    </div>
                                    <div className="bubble-content-block">
                                        <div className="bubble-text" style={{ padding: '10px 14px' }}>
                                            <div className="typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="feed-input-footer">
                            <input 
                                type="text" 
                                className="chat-input-field" 
                                placeholder={activeConversation ? "Type your message here..." : "Select a chat first..."}
                                value={inputText}
                                onChange={handleInputChange}
                                disabled={!activeConversation}
                            />
                            <button type="submit" className="btn-send-message" disabled={!activeConversation}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TenantMessages;
