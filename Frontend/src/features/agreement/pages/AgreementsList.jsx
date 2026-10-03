import React, { useEffect, useState } from 'react';
import './AgreementsList.css';
import Navbar from '../../properties/components/Navbar';
import { useAgreement } from '../hooks/useAgreement';
import { useAuth } from '../../auth/hooks/useAuth';
import toast from 'react-hot-toast';

const AgreementsList = ({ onNavigate }) => {
    const { user } = useAuth();
    const { agreements, loading, error, fetchAgreements, downloadAgreementPdf } = useAgreement();
    const [activeFilter, setActiveFilter] = useState('all');
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        if (user?.role) {
            fetchAgreements(user.role);
        }
    }, [fetchAgreements, user]);

    // Handle filter tabs
    const getFilteredAgreements = () => {
        if (activeFilter === 'all') return agreements;
        if (activeFilter === 'awaiting_review') {
            return agreements.filter(a => a.status === 'draft');
        }
        if (activeFilter === 'pending_signature') {
            return agreements.filter(a => a.status === 'pending_signature' || a.status === 'tenant_signed');
        }
        if (activeFilter === 'signed') {
            return agreements.filter(a => a.status === 'signed');
        }
        return agreements;
    };

    const filtered = getFilteredAgreements();

    // Download the final signed agreement PDF for a given row
    const handleDownloadPdf = async (agreement) => {
        setDownloadingId(agreement.id);
        try {
            const blob = await downloadAgreementPdf(agreement.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `agreement-${agreement.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Agreement PDF downloaded!', { icon: '📄' });
        } catch (err) {
            toast.error(err.message || 'Failed to download agreement PDF.');
        } finally {
            setDownloadingId(null);
        }
    };

    // Helper to get formatted status pill
    const renderStatusPill = (status) => {
        switch (status) {
            case 'draft':
                return (
                    <span className="agreement-status-pill awaiting-review">
                        <span className="dot"></span> Awaiting Review
                    </span>
                );
            case 'pending_signature':
                return (
                    <div className="status-flex-col">
                        <span className="agreement-status-pill pending-signature">
                            <span className="dot"></span> Pending Signature
                        </span>
                        <span className="expiry-hint">Expires in 2 days</span>
                    </div>
                );
            case 'tenant_signed':
                return (
                    <div className="status-flex-col">
                        <span className="agreement-status-pill tenant-signed">
                            <span className="dot"></span> Tenant Signed
                        </span>
                        <span className="expiry-hint warning">Awaiting Owner Signature</span>
                    </div>
                );
            case 'signed':
                return (
                    <span className="agreement-status-pill signed">
                        <span className="dot"></span> Signed
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="agreement-status-pill cancelled">
                        <span className="dot"></span> Cancelled
                    </span>
                );
            default:
                return <span className="agreement-status-pill">{status}</span>;
        }
    };

    // Helper to format currency
    const formatCurrency = (val) => {
        return `৳${Number(val).toLocaleString('en-IN')}`;
    };

    // Helper for placeholder images
    const getPropertyImage = (title) => {
        const t = (title || '').toLowerCase();
        if (t.includes('skyline') || t.includes('penthouse')) {
            return "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=300&q=80";
        }
        if (t.includes('greenwood') || t.includes('loft') || t.includes('garden')) {
            return "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=300&q=80";
        }
        return "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=300&q=80";
    };

    return (
        <div className="agreements-list-layout">
            <Navbar onNavigate={onNavigate} activeTab="agreements" />

            <main className="agreements-list-main">
                <div className="agreements-list-header">
                    <h1 className="list-title">My Agreements</h1>
                    <p className="list-subtitle">Review rental agreements and complete signing to secure your next home.</p>
                </div>

                {/* Filter and Tab Section */}
                <div className="filters-row-container">
                    <div className="tabs-pill-group">
                        <button 
                            className={`tab-pill-btn ${activeFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('all')}
                        >
                            All Agreements
                        </button>
                        <button 
                            className={`tab-pill-btn ${activeFilter === 'awaiting_review' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('awaiting_review')}
                        >
                            Awaiting Review
                        </button>
                        <button 
                            className={`tab-pill-btn ${activeFilter === 'pending_signature' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('pending_signature')}
                        >
                            Pending Signature
                        </button>
                        <button 
                            className={`tab-pill-btn ${activeFilter === 'signed' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('signed')}
                        >
                            Signed
                        </button>
                    </div>

                    <button className="advanced-filters-btn" onClick={() => toast.success('Advanced filters opened')}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="21" x2="4" y2="14"></line>
                            <line x1="4" y1="10" x2="4" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12" y2="3"></line>
                            <line x1="20" y1="21" x2="20" y2="16"></line>
                            <line x1="20" y1="12" x2="20" y2="3"></line>
                            <line x1="1" y1="14" x2="7" y2="14"></line>
                            <line x1="9" y1="8" x2="15" y2="8"></line>
                            <line x1="17" y1="16" x2="23" y2="16"></line>
                        </svg>
                        <span>Advanced Filters</span>
                    </button>
                </div>

                {/* Main Content Area */}
                {loading ? (
                    <div className="loading-state-wrapper">
                        <div className="agreements-spinner"></div>
                        <p>Loading your lease agreements...</p>
                    </div>
                ) : error ? (
                    <div className="error-state-wrapper">
                        <p className="error-message-text">{error}</p>
                        <button className="btn-retry-agreements" onClick={() => fetchAgreements(user?.role)}>
                            Retry Loading
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state-card">
                        <div className="empty-state-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <h3>No agreements found</h3>
                        <p>You do not have any agreements matching the selected filter.</p>
                    </div>
                ) : (
                    <div className="agreements-cards-stack">
                        {filtered.map(agreement => {
                            const partnerName = user?.role === 'owner' ? agreement.tenant_name : agreement.owner_name;
                            const partnerLabel = user?.role === 'owner' ? 'Tenant' : 'Owner';
                            
                            return (
                                <div className="agreement-row-card" key={agreement.id}>
                                    <div className="agreement-card-left-section">
                                        <div className="property-thumbnail-box">
                                            <img src={getPropertyImage(agreement.property_title)} alt="Property Preview" />
                                        </div>
                                        <div className="agreement-brief-info">
                                            <h2 className="prop-name-title">{agreement.property_title || 'Skyline View Residences'}</h2>
                                            <span className="partner-details-line">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                                {partnerLabel}: {partnerName || 'James Sterling'}
                                            </span>
                                            <span className="location-details-line">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                    <circle cx="12" cy="10" r="3"></circle>
                                                </svg>
                                                {agreement.property_address || 'Financial District, New York'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="agreement-card-stats-grid">
                                        <div className="stat-value-box">
                                            <span className="stat-label-header">RENT</span>
                                            <span className="stat-primary-value">{formatCurrency(agreement.monthly_rent)}</span>
                                            <span className="stat-value-sub">/ month</span>
                                        </div>
                                        <div className="stat-value-box">
                                            <span className="stat-label-header">MOVE-IN</span>
                                            <span className="stat-primary-value">
                                                {agreement.agreement_start_date 
                                                    ? new Date(agreement.agreement_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                    : 'Flexible'}
                                            </span>
                                        </div>
                                        <div className="stat-value-box">
                                            <span className="stat-label-header">DURATION</span>
                                            <span className="stat-primary-value">12 Months</span>
                                        </div>
                                    </div>

                                    <div className="agreement-card-status-actions-cell">
                                        <div className="status-container-box">
                                            {renderStatusPill(agreement.status)}
                                        </div>
                                        <div className="actions-button-stack">
                                            {agreement.status === 'draft' && (
                                                <>
                                                    <button 
                                                        className="btn-action-main primary"
                                                        onClick={() => onNavigate('agreement-details', agreement.id)}
                                                    >
                                                        Review Terms
                                                    </button>
                                                    <button 
                                                        className="btn-action-secondary outline"
                                                        onClick={() => toast.success(`Viewing property details...`)}
                                                    >
                                                        View Property
                                                    </button>
                                                </>
                                            )}
                                            {agreement.status === 'pending_signature' && (
                                                <>
                                                    <button 
                                                        className="btn-action-main primary"
                                                        onClick={() => onNavigate('agreement-details', agreement.id)}
                                                    >
                                                        Sign Agreement
                                                    </button>
                                                    <button 
                                                        className="btn-action-secondary outline"
                                                        onClick={() => onNavigate('agreement-details', agreement.id)}
                                                    >
                                                        Review Terms
                                                    </button>
                                                </>
                                            )}
                                            {agreement.status === 'tenant_signed' && (
                                                <>
                                                    {user?.role === 'owner' ? (
                                                        <>
                                                            <button 
                                                                className="btn-action-main primary"
                                                                onClick={() => onNavigate('agreement-details', agreement.id)}
                                                            >
                                                                Finalize & Sign
                                                            </button>
                                                            <button 
                                                                className="btn-action-secondary outline"
                                                                onClick={() => onNavigate('agreement-details', agreement.id)}
                                                            >
                                                                Review Terms
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button 
                                                            className="btn-action-secondary outline"
                                                            onClick={() => onNavigate('agreement-details', agreement.id)}
                                                        >
                                                            View Agreement
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            {agreement.status === 'signed' && (
                                                <>
                                                    <button
                                                        className="btn-action-main primary"
                                                        onClick={() => handleDownloadPdf(agreement)}
                                                        disabled={downloadingId === agreement.id}
                                                    >
                                                        {downloadingId === agreement.id ? 'Preparing...' : 'Download PDF'}
                                                    </button>
                                                    <button
                                                        className="btn-action-secondary outline"
                                                        onClick={() => onNavigate('agreement-details', agreement.id)}
                                                    >
                                                        View Agreement
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination footer */}
                {!loading && filtered.length > 0 && (
                    <div className="agreements-pagination-footer">
                        <span className="showing-indicator">
                            Showing <strong>1-{filtered.length}</strong> of <strong>{filtered.length}</strong> agreements
                        </span>
                        <div className="nav-page-controls">
                            <button className="page-nav-arrow disabled" disabled>&lt; Previous</button>
                            <button className="page-num-btn active">1</button>
                            <button className="page-num-btn">2</button>
                            <button className="page-num-btn">3</button>
                            <button className="page-nav-arrow disabled" disabled>Next &gt;</button>
                        </div>
                    </div>
                )}
            </main>

            <footer className="tenant-footer-premium">
                <div className="footer-content-premium">
                    <div className="footer-left-side">
                        <span className="brand-bold">Housy</span>
                        <span className="copyright-text">© 2026 Housy Rental Management. All rights reserved.</span>
                    </div>
                    <div className="footer-right-links">
                        <a href="#support">Support</a>
                        <a href="#privacy">Privacy Policy</a>
                        <a href="#terms">Terms of Service</a>
                        <a href="#legal">Legal Notice</a>
                        <a href="#contact">Contact Us</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default AgreementsList;
