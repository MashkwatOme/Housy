import React, { useEffect, useMemo, useState } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import './VerificationQueue.css';

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'owner', label: 'Owners' },
    { key: 'tenant', label: 'Tenants' },
];

const ZoomIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
);

const ChevronIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const CloseIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const EmptyIllustration = () => (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
    </svg>
);

const VerificationQueue = () => {
    const { pendingUsers, loading, fetchPendingUsers, approveUser, rejectUser } = useAdmin();
    const [selectedId, setSelectedId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        fetchPendingUsers();
    }, [fetchPendingUsers]);

    const visibleUsers = useMemo(
        () => pendingUsers.filter(u => filter === 'all' || (u.role || '').toLowerCase() === filter),
        [pendingUsers, filter]
    );

    // Fall back to the first visible user when nothing (or a stale id) is selected
    const selectedUser = visibleUsers.find(u => u.id === selectedId) || visibleUsers[0] || null;

    // Close the image preview with Escape
    useEffect(() => {
        if (!preview) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') setPreview(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [preview]);

    const handleApprove = () => {
        if (selectedUser) approveUser(selectedUser.id);
    };

    const handleReject = () => {
        if (selectedUser) rejectUser(selectedUser.id);
    };

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const renderNid = (title, url, alt, emptyText) => (
        <div className="nid-card">
            <div className="nid-title">
                <span>{title}</span>
                {url && (
                    <button type="button" className="nid-zoom" onClick={() => setPreview({ url, alt })} aria-label={`Enlarge ${title}`}>
                        <ZoomIcon />
                    </button>
                )}
            </div>
            <div
                className={`nid-img-wrapper ${url ? 'clickable' : ''}`}
                onClick={url ? () => setPreview({ url, alt }) : undefined}
            >
                {url ? <img src={url} alt={alt} /> : <span className="nid-missing">{emptyText}</span>}
            </div>
        </div>
    );

    return (
        <div className="vq-container">
            <div className="vq-header">
                <div className="vq-title">
                    <h1>Verification Queue</h1>
                    <p>Manage and review identification documents for platform safety.</p>
                </div>
                <div className="vq-stats">
                    <div className="stat-box">
                        <h4>Pending Queue</h4>
                        <span>{pendingUsers.length}</span>
                    </div>
                    <div className="stat-box dark">
                        <h4>Verified Today</h4>
                        <span>--</span>
                    </div>
                </div>
            </div>

            <div className="vq-content">
                <div className="queue-list">
                    <div className="ql-header">
                        <h3>Accounts Pending</h3>
                        <div className="filter-pills" role="tablist">
                            {FILTERS.map(f => (
                                <button
                                    key={f.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={filter === f.key}
                                    className={`filter-pill ${filter === f.key ? 'active' : ''}`}
                                    onClick={() => setFilter(f.key)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="ql-items">
                        {loading && <div className="empty-state">Loading...</div>}
                        {!loading && visibleUsers.length === 0 && (
                            <div className="empty-state">
                                <EmptyIllustration />
                                <span>No pending users</span>
                            </div>
                        )}
                        {visibleUsers.map(user => (
                            <div
                                key={user.id}
                                className={`ql-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                                onClick={() => setSelectedId(user.id)}
                            >
                                <div className="ql-avatar">
                                    {getInitials(user.name)}
                                </div>
                                <div className="ql-info">
                                    <h4>{user.name}</h4>
                                    <p>{user.role || 'User'} • ID: ER-{user.id}</p>
                                    <div className="ql-status">
                                        <span className="status-dot"></span> Pending
                                    </div>
                                </div>
                                <span className="ql-chevron"><ChevronIcon /></span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="queue-details">
                    {selectedUser ? (
                        <>
                            <div className="qd-header">
                                <div className="qd-user">
                                    <div className="qd-avatar">
                                        {getInitials(selectedUser.name)}
                                    </div>
                                    <div className="qd-info">
                                        <span className="qd-badge">Active Selection</span>
                                        <h2>{selectedUser.name}</h2>
                                        <p>Submitting for: {selectedUser.role} Account Verification</p>
                                        <div className="qd-contact-info">
                                            <span>{selectedUser.email}</span>
                                            {selectedUser.phone && <span>{selectedUser.phone}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="qd-meta">
                                    <span>Submitted on</span>
                                    <p>{formatDate(selectedUser.created_at)}</p>
                                </div>
                            </div>

                            <div className="qd-body">
                                <div className="nid-section">
                                    {renderNid('NID Front View', selectedUser.nid_front_url, 'NID Front', 'No Front Image')}
                                    {renderNid('NID Back View', selectedUser.nid_back_url, 'NID Back', 'No Back Image')}
                                </div>
                            </div>

                            <div className="qd-actions">
                                <button className="btn-reject" onClick={handleReject}>
                                    <CloseIcon /> Reject Account
                                </button>
                                <button className="btn-approve" onClick={handleApprove}>
                                    <CheckIcon /> Approve Verification
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <EmptyIllustration />
                            <span>Select a user from the queue to review</span>
                        </div>
                    )}
                </div>
            </div>

            {preview && (
                <div className="vq-lightbox" onClick={() => setPreview(null)}>
                    <button type="button" className="vq-lightbox-close" onClick={() => setPreview(null)} aria-label="Close preview">
                        <CloseIcon size={22} />
                    </button>
                    <img src={preview.url} alt={preview.alt} onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
};

export default VerificationQueue;
