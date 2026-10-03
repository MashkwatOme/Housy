import React from 'react';

const StayRequestCard = ({ request, onSignLease, onViewFeedback, onViewDetails }) => {
    const { id, title, monthly_rent, area, status, created_at, message, image_url } = request;

    // Format rent nicely
    const formatRent = (amount) => {
        return `৳${Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    };

    // Calculate days ago for pending request
    const getDaysAgoText = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) return 'Sent today';
        if (diffDays === 2) return 'Sent yesterday';
        return `Sent ${diffDays} days ago`;
    };

    // Nice placeholder images based on title or fallback to beautiful Unsplash house image
    const getPropertyImage = (propertyTitle) => {
        const lower = (propertyTitle || '').toLowerCase();
        if (lower.includes('skyline')) {
            return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'; // highrise
        }
        if (lower.includes('glass')) {
            return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'; // modern glass
        }
        if (lower.includes('chic') || lower.includes('industrial')) {
            return 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'; // loft
        }
        if (lower.includes('marble')) {
            return 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'; // kitchen
        }
        return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'; // standard nice house
    };

    return (
        <div className="stay-request-card">
            {/* Card Image Wrapper */}
            <div className="card-image-wrapper">
                <img src={image_url || getPropertyImage(title)} alt={title} className="card-image" />
                <span className={`status-badge ${status}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
            </div>

            {/* Card Body */}
            <div className="card-body">
                <div className="card-header-row">
                    <h3 className="property-title">{title}</h3>
                    <div className="property-price">
                        <span className="price-bold">{formatRent(monthly_rent)}</span>
                        <span className="price-label">/ month</span>
                    </div>
                </div>

                <div className="property-location">
                    <svg className="location-pin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>{area || 'Brooklyn, NY'}</span>
                </div>
            </div>

            {/* Card Footer */}
            <div className="card-footer">
                {status === 'approved' && (
                    <>
                        {/* We alternate between Sign Lease style (Marble Residence style) and View Details style */}
                        {title.toLowerCase().includes('marble') ? (
                            <>
                                <div className="lease-ready-wrapper">
                                    <svg className="check-circle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                    <span className="lease-ready-text">Lease Ready</span>
                                </div>
                                <button className="btn-action-primary" onClick={() => onSignLease(id, title)}>
                                    Sign Lease
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="avatar-preview-group">
                                    <div className="avatar-circle">
                                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40&q=80" alt="Landlord" />
                                    </div>
                                    <span className="avatar-plus">+2</span>
                                </div>
                                <button className="btn-action-secondary" onClick={() => onViewDetails(request)}>
                                    View Details
                                </button>
                            </>
                        )}
                    </>
                )}

                {status === 'pending' && (
                    <>
                        <span className="request-time-text">{getDaysAgoText(created_at)}</span>
                        <button className="btn-action-secondary" onClick={() => onViewDetails(request)}>
                            View Details
                        </button>
                    </>
                )}

                {status === 'rejected' && (
                    <>
                        <span className="application-closed-text">Application closed</span>
                        <button className="btn-action-secondary feedback" onClick={() => onViewFeedback(message || 'No additional feedback was provided.')}>
                            View Feedback
                        </button>
                    </>
                )}

                {status === 'cancelled' && (
                    <>
                        <span className="application-closed-text cancel">Cancelled by you</span>
                        <button className="btn-action-secondary" onClick={() => onViewDetails(request)}>
                            View Details
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default StayRequestCard;
