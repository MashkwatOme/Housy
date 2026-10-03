export const createConversationApi = async (propertyId, ownerId) => {
    const res = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, ownerId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create conversation');
    return data;
};

export const sendMessageApi = async (conversationId, message) => {
    const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send message');
    return data;
};

export const getConversationsApi = async () => {
    const res = await fetch('/api/chat/conversations', {
        method: 'GET'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to get conversations');
    return data;
};

export const getMessagesApi = async (conversationId) => {
    const res = await fetch(`/api/chat/${conversationId}`, {
        method: 'GET'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to get messages');
    return data;
};

export const markMessagesReadApi = async (conversationId) => {
    const res = await fetch(`/api/chat/read/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to mark messages as read');
    return data;
};
