import React, { useState, useRef, useEffect } from 'react';

const SearchChat = ({ messages, loading, submitQuery, setHoveredPropertyId, onNavigate }) => {
    const [input, setInput] = useState('');
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = (e) => {
        e.preventDefault();
        if (input.trim()) {
            submitQuery(input);
            setInput('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSend(e);
        }
    };

    return (
        <>
            <div className="chat-header">
                <div className="ai-avatar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                </div>
                <strong>Housy AI</strong>
            </div>

            <div className="chat-history">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.type}`}>
                        {msg.text}
                        
                        {/* Render properties if AI attached them */}
                        {msg.results && msg.results.length > 0 && (
                            <div className="property-results">
                                {msg.results.map((prop, pIdx) => (
                                    <div 
                                        key={prop.id} 
                                        className="chat-property-card"
                                        onMouseEnter={() => setHoveredPropertyId(prop.id)}
                                        onMouseLeave={() => setHoveredPropertyId(null)}
                                        onClick={() => onNavigate('details', prop.id)}
                                    >
                                        <div className="match-badge">{prop.matchScore}% Match</div>
                                        <img src={prop.imageUrl} alt={prop.title} className="chat-card-img" />
                                        <div className="chat-card-content">
                                            <div className="chat-card-title">{prop.title}</div>
                                            <div className="chat-card-address">{prop.address}</div>
                                            <div className="chat-card-details">
                                                <span>🛏️ {prop.beds} Bed</span> &nbsp;&nbsp; 
                                                <span>🛁 {prop.baths} Bath</span>
                                            </div>
                                        </div>
                                        <div className="chat-card-price">৳{prop.price?.toLocaleString()}/mo</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                
                {loading && (
                    <div className="typing-indicator">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="chat-input-container">
                <div className="chat-input-wrapper">
                    <input 
                        type="text" 
                        placeholder="Ask follow-up (e.g., 'Which one has a gym?')" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button className="send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
};

export default SearchChat;
