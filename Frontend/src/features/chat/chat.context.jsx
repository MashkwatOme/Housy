import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../auth/hooks/useAuth';
import {
    createConversationApi,
    sendMessageApi,
    getConversationsApi,
    getMessagesApi,
    markMessagesReadApi
} from './services/chat.api';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { isLoggedIn, user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingConversations, setTypingConversations] = useState({});
    const typingTimeouts = useRef({});
    const lastTypingTime = useRef(0);
    const [error, setError] = useState(null);

    const fetchConversations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getConversationsApi();
            setConversations(data.conversations || []);
            return data.conversations;
        } catch (err) {
            setError(err.message);
            console.error('Error fetching conversations:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMessages = useCallback(async (conversationId) => {
        if (!conversationId) return;
        setMessagesLoading(true);
        setError(null);
        try {
            const data = await getMessagesApi(conversationId);
            setMessages(data.messages || []);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching messages:', err);
        } finally {
            setMessagesLoading(false);
        }
    }, []);

    const markMessagesRead = useCallback(async (conversationId) => {
        if (!conversationId) return;
        try {
            await markMessagesReadApi(conversationId);
            // Refresh conversation list to clear unread indicator/badge
            await fetchConversations();
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    }, [fetchConversations]);

    const sendMessage = useCallback(async (conversationId, messageText) => {
        if (!conversationId || !messageText.trim()) return;
        setError(null);
        try {
            await sendMessageApi(conversationId, messageText);
            // Refresh conversation list to show the latest message in the sidebar
            await fetchConversations();
        } catch (err) {
            setError(err.message);
            console.error('Error sending message:', err);
            throw err;
        }
    }, [fetchConversations]);

    const startConversation = useCallback(async (propertyId, ownerId) => {
        setLoading(true);
        setError(null);
        setActiveConversation(null);
        setMessages([]);
        try {
            const data = await createConversationApi(propertyId, ownerId);
            const newConversation = data.conversation;
            
            // Refresh conversations list
            const updatedConversations = await fetchConversations();
            
            // Join the new conversation room immediately
            if (socket) {
                socket.emit('join_conversation', String(newConversation.id));
            }
            
            // Set as active
            const found = updatedConversations?.find(c => c.id === newConversation.id) || newConversation;
            setActiveConversation(found);
            
            return newConversation;
        } catch (err) {
            setError(err.message);
            console.error('Error starting conversation:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchConversations, socket]);

    const sendTypingNotification = useCallback((conversationId) => {
        if (!socket || !conversationId) return;
        const now = Date.now();
        if (now - lastTypingTime.current > 2000) {
            lastTypingTime.current = now;
            console.log('[Socket] Emitting typing event for room:', conversationId);
            socket.emit('typing', String(conversationId));
        }
    }, [socket]);

    // Socket Connection Lifecycle
    useEffect(() => {
        if (!isLoggedIn || !user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            setOnlineUsers([]);
            return;
        }

        const socketInstance = io('/', {
            autoConnect: true,
            reconnection: true,
        });

        socketInstance.on('connect', () => {
            console.log('Socket.io connected:', socketInstance.id);
            // Notify server that this user is online
            socketInstance.emit('user_online', user.id);
        });

        socketInstance.on('online_users', (users) => {
            console.log('Online users updated:', users);
            setOnlineUsers(users || []);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('Socket.io disconnected:', reason);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setOnlineUsers([]);
        };
    }, [isLoggedIn, user]);

    // Join all conversation rooms when connected or conversations list updates
    useEffect(() => {
        if (!socket || conversations.length === 0) return;
        
        conversations.forEach((conv) => {
            socket.emit('join_conversation', String(conv.id));
        });
    }, [socket, conversations]);

    // Listen to incoming real-time messages
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (msg) => {
            console.log('Received real-time message:', msg);

            if (activeConversation && msg.conversation_id === activeConversation.id) {
                // If it is from the other user, automatically mark it as read
                if (msg.sender_id !== user?.id) {
                    markMessagesRead(activeConversation.id);
                }
                setMessages((prev) => {
                    const exists = prev.some(m => 
                        (m.id && m.id === msg.id) || 
                        (m.sender_id === msg.sender_id && 
                         m.message === msg.message && 
                         Math.abs(new Date(m.created_at).getTime() - new Date(msg.created_at).getTime()) < 1000)
                    );
                    if (exists) return prev;

                    return [...prev, {
                        ...msg,
                        id: msg.id || `${msg.sender_id}-${new Date(msg.created_at).getTime()}`
                    }];
                });
            }

            // Always update the sidebar with latest snippets
            fetchConversations();
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [socket, activeConversation, fetchConversations, markMessagesRead, user]);

    // Listen to typing indicator event
    useEffect(() => {
        if (!socket) return;

        const handleUserTyping = (conversationId) => {
            console.log('[Socket] Typing indicator received for room:', conversationId);
            if (!conversationId) return;

            const roomKey = String(conversationId);
            setTypingConversations(prev => ({
                ...prev,
                [roomKey]: true
            }));

            // Clear previous timeout for this conversation if it exists
            if (typingTimeouts.current[roomKey]) {
                clearTimeout(typingTimeouts.current[roomKey]);
            }

            // Automatically clear typing status after 3 seconds of silence
            typingTimeouts.current[roomKey] = setTimeout(() => {
                setTypingConversations(prev => {
                    const updated = { ...prev };
                    delete updated[roomKey];
                    return updated;
                });
            }, 3000);
        };

        socket.on('user_typing', handleUserTyping);

        return () => {
            socket.off('user_typing', handleUserTyping);
            // Clear all typing timeouts on unmount or socket change
            Object.values(typingTimeouts.current).forEach(clearTimeout);
        };
    }, [socket]);

    // Listen to messages read/seen event
    useEffect(() => {
        if (!socket) return;

        const handleMessagesSeen = ({ conversationId, seenBy }) => {
            console.log('[Socket] Messages seen in room:', conversationId, 'by user:', seenBy);
            
            // If the other user has seen the messages in our active conversation
            if (activeConversation && String(conversationId) === String(activeConversation.id)) {
                if (seenBy !== user?.id) {
                    setMessages(prev => prev.map(m => {
                        if (m.sender_id === user?.id) {
                            return { ...m, is_read: 1 }; // Mark all our sent messages as read
                        }
                        return m;
                    }));
                }
            }
        };

        socket.on('messages_seen', handleMessagesSeen);

        return () => {
            socket.off('messages_seen', handleMessagesSeen);
        };
    }, [socket, activeConversation, user]);

    // Listen for incoming rent-payment notifications (owner side)
    useEffect(() => {
        if (!socket) return;

        const handlePaymentReceived = (payload) => {
            const monthLabel = payload.paymentMonth === 'security_deposit'
                ? 'a security deposit'
                : `rent for ${payload.paymentMonth}`;
            toast.success(
                `Payment received: ${payload.tenantName} paid ${monthLabel} (৳${payload.amount}) for "${payload.propertyTitle}"`
            );
            window.dispatchEvent(new CustomEvent('payment-notification-received'));
        };

        socket.on('payment_received', handlePaymentReceived);

        return () => {
            socket.off('payment_received', handlePaymentReceived);
        };
    }, [socket]);

    // Listen for incoming maintenance request notifications (owner side)
    useEffect(() => {
        if (!socket) return;

        const handleMaintenanceRequestReceived = (payload) => {
            toast.success(
                `New maintenance request from ${payload.tenantName}: ${payload.category} (${payload.severity} priority) at "${payload.propertyTitle}"`
            );
            window.dispatchEvent(new CustomEvent('maintenance-notification-received'));
        };

        socket.on('maintenance_request_received', handleMaintenanceRequestReceived);

        return () => {
            socket.off('maintenance_request_received', handleMaintenanceRequestReceived);
        };
    }, [socket]);

    // Fetch messages automatically when the active conversation changes
    useEffect(() => {
        if (activeConversation?.id) {
            setMessages([]); // Clear immediately to avoid lingering/flicker
            fetchMessages(activeConversation.id);
            markMessagesRead(activeConversation.id); // Mark as read immediately on open!
        } else {
            setMessages([]);
        }
    }, [activeConversation, fetchMessages, markMessagesRead]);

    // Sync conversations loading with authenticated user state
    useEffect(() => {
        if (isLoggedIn && user) {
            fetchConversations();
        } else {
            // Clear state on logout or unauthenticated state
            setConversations([]);
            setActiveConversation(null);
            setMessages([]);
        }
    }, [isLoggedIn, user, fetchConversations]);

    // Keep active conversation reference updated with fresh data from the list
    useEffect(() => {
        if (activeConversation && conversations.length > 0) {
            const updated = conversations.find(c => c.id === activeConversation.id);
            if (updated && JSON.stringify(updated) !== JSON.stringify(activeConversation)) {
                setActiveConversation(updated);
            }
        }
    }, [conversations, activeConversation]);

    return (
        <ChatContext.Provider
            value={{
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
                error,
                fetchConversations,
                fetchMessages,
                sendMessage,
                startConversation
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};
