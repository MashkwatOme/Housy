import { useEffect, useState } from 'react';
import './TenantRequests.css';
import Navbar from '../../properties/components/Navbar';
import StayRequestCard from '../component/StayRequestCard';
import { useStayRequests } from '../hook/useStayRequests';
import { useSchedule } from '../../schedule/hooks/useSchedule';
import toast from 'react-hot-toast';

const TenantRequests = ({ onNavigate }) => {
    const { requests, loading: requestsLoading, error: requestsError, fetchMyRequests } = useStayRequests();
    const {
        schedules,
        loading: schedulesLoading,
        error: schedulesError,
        unreadCount,
        fetchMySchedules,
        fetchUnreadCount,
        markStatusNotificationsRead,
        updateScheduleStatus
    } = useSchedule();
    
    const [activeSection, setActiveSection] = useState('stay-requests');
    const [filter, setFilter] = useState('all');
    
    // Modal states
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);

    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    useEffect(() => {
        if (activeSection === 'stay-requests') {
            fetchMyRequests();
        } else {
            fetchMySchedules();
        }
    }, [activeSection, fetchMyRequests, fetchMySchedules]);

    const openVisitSchedules = async () => {
        setActiveSection('visit-schedules');
        setFilter('all');
        if (unreadCount > 0) {
            try {
                await markStatusNotificationsRead();
            } catch (err) {
                toast.error(err.message || 'Failed to clear visit notifications.');
            }
        }
    };

    // Handle "Sign Lease"
    const handleSignLease = (id, propertyTitle) => {
        toast.success(`Congratulations! Lease for "${propertyTitle}" has been signed successfully! 🎉 Welcome home!`, {
            duration: 5000,
            icon: '🏠'
        });
    };

    // Handle "Cancel Schedule"
    const handleCancelSchedule = async (id, title) => {
        if (window.confirm(`Are you sure you want to cancel the scheduled visit for "${title}"?`)) {
            try {
                await updateScheduleStatus(id, 'cancelled');
                toast.success(`Visit schedule for "${title}" cancelled successfully.`, {
                    duration: 4000,
                    icon: '🗑️'
                });
            } catch (err) {
                toast.error(err.message || 'Failed to cancel scheduled visit.');
            }
        }
    };

    // Filtered requests list
    const filteredRequests = requests.filter(req => {
        if (filter === 'all') return true;
        return req.status === filter;
    });

    // Filtered schedules list
    const filteredSchedules = schedules.filter(sch => {
        if (filter === 'all') return true;
        return sch.status === filter;
    });

    const isLoading = activeSection === 'stay-requests' ? requestsLoading : schedulesLoading;
    const isError = activeSection === 'stay-requests' ? requestsError : schedulesError;

    return (
        <div className="tenant-requests-layout">
            <Navbar onNavigate={onNavigate} activeTab="requests" />

            <main className="tenant-requests-main">
                {/* Header Section */}
                <div className="tenant-requests-header">
                    <div className="header-text-container">
                        <h1 className="requests-title">
                            {activeSection === 'stay-requests' ? 'My Stay Requests' : 'My Visit Schedules'}
                        </h1>
                        <p className="requests-subtitle">
                            {activeSection === 'stay-requests' 
                                ? 'Manage and track your active rental applications.' 
                                : 'Manage and track your scheduled property viewings.'}
                        </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="filter-pill-container">
                        <button 
                            className={`filter-pill-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button 
                            className={`filter-pill-btn ${filter === 'pending' ? 'active' : ''}`}
                            onClick={() => setFilter('pending')}
                        >
                            Pending
                        </button>
                        <button 
                            className={`filter-pill-btn ${filter === 'approved' ? 'active' : ''}`}
                            onClick={() => setFilter('approved')}
                        >
                            Approved
                        </button>
                    </div>
                </div>

                {/* Section Tabs */}
                <div className="requests-section-tabs">
                    <button 
                        className={`section-tab-btn ${activeSection === 'stay-requests' ? 'active' : ''}`}
                        onClick={() => { setActiveSection('stay-requests'); setFilter('all'); }}
                    >
                        Stay Requests
                    </button>
                    <button 
                        className={`section-tab-btn ${activeSection === 'visit-schedules' ? 'active' : ''}`}
                        onClick={openVisitSchedules}
                    >
                        Visit Schedules
                        {unreadCount > 0 && (
                            <span className="schedule-tab-notification-badge">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Error Banner */}
                {isError && (
                    <div className="error-banner">
                        <p>{isError}</p>
                        <button 
                            className="error-retry-btn" 
                            onClick={activeSection === 'stay-requests' ? fetchMyRequests : fetchMySchedules}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Main Content Area */}
                {isLoading ? (
                    <div className="requests-loading-wrapper">
                        <div className="spinner"></div>
                        <p>
                            {activeSection === 'stay-requests' 
                                ? 'Fetching your active stay requests...' 
                                : 'Fetching your scheduled visits...'}
                        </p>
                    </div>
                ) : (
                    <div className="requests-grid">
                        {/* Dynamic Rendering based on activeSection */}
                        {activeSection === 'stay-requests' ? (
                            filteredRequests.map(request => (
                                <StayRequestCard 
                                    key={request.id} 
                                    request={request}
                                    onSignLease={handleSignLease}
                                    onViewFeedback={setSelectedFeedback}
                                    onViewDetails={setSelectedRequestDetails}
                                />
                            ))
                        ) : (
                            filteredSchedules.map(sch => (
                                <div className="stay-request-card" key={sch.id}>
                                    <div className="card-image-wrapper">
                                        <img 
                                            src={sch.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'} 
                                            alt={sch.title} 
                                            className="card-image" 
                                        />
                                        <span className={`status-badge ${sch.status}`}>{sch.status.toUpperCase()}</span>
                                    </div>
                                    <div className="card-body">
                                        <div>
                                            <div className="card-header-row">
                                                <h3 className="property-title">{sch.title}</h3>
                                                <div className="property-price">
                                                    <span className="price-bold">৳{Number(sch.monthly_rent).toLocaleString()}</span>
                                                    <span className="price-label">/mo</span>
                                                </div>
                                            </div>
                                            <div className="property-location" style={{ marginBottom: '16px' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="location-pin-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                                <span>{sch.address || sch.area}</span>
                                            </div>
                                            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: '600', color: '#64748b' }}>Date:</span>
                                                    <span style={{ fontWeight: '500', color: '#334155' }}>
                                                        {new Date(sch.visit_date).toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: '600', color: '#64748b' }}>Time Slot:</span>
                                                    <span style={{ fontWeight: '500', color: '#334155' }}>{sch.time_slot}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: '600', color: '#64748b' }}>Attendee:</span>
                                                    <span style={{ fontWeight: '500', color: '#334155' }}>{sch.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: '600', color: '#64748b' }}>Phone:</span>
                                                    <span style={{ fontWeight: '500', color: '#334155' }}>{sch.phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-footer">
                                        {(sch.status === 'pending' || sch.status === 'approved') ? (
                                            <button 
                                                className="btn-action-secondary feedback"
                                                onClick={() => handleCancelSchedule(sch.id, sch.title)}
                                            >
                                                Cancel Visit
                                            </button>
                                        ) : (
                                            <span className={`application-closed-text ${sch.status}`}>Visit {sch.status}</span>
                                        )}
                                        <span className="request-time-text">
                                            Created {new Date(sch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* "Finding a new place?" Dashed Card */}
                        <div className="finding-place-card">
                            <div className="icon-wrapper">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                                <span className="plus-overlay">+</span>
                            </div>
                            <h3 className="finding-title">Finding a new place?</h3>
                            <p className="finding-description">
                                Explore our premium properties and start a new request today.
                            </p>
                            <button className="btn-browse-properties" onClick={() => onNavigate('browse')}>
                                Browse Properties
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal: View Landlord Feedback */}
            {selectedFeedback && (
                <div className="requests-modal-overlay" onClick={() => setSelectedFeedback(null)}>
                    <div className="requests-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Application Feedback</h3>
                            <button className="modal-close-btn" onClick={() => setSelectedFeedback(null)}>&times;</button>
                        </div>
                        <div className="modal-body feedback">
                            <div className="feedback-quote-icon">“</div>
                            <p className="feedback-text">{selectedFeedback}</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal-close" onClick={() => setSelectedFeedback(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: View Details */}
            {selectedRequestDetails && (
                <div className="requests-modal-overlay" onClick={() => setSelectedRequestDetails(null)}>
                    <div className="requests-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Application Details</h3>
                            <button className="modal-close-btn" onClick={() => setSelectedRequestDetails(null)}>&times;</button>
                        </div>
                        <div className="modal-body details">
                            <div className="details-row">
                                <span className="details-label">Property:</span>
                                <span className="details-val bold">{selectedRequestDetails.title}</span>
                            </div>
                            <div className="details-row">
                                <span className="details-label">Rent:</span>
                                <span className="details-val highlight">৳{Number(selectedRequestDetails.monthly_rent || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo</span>
                            </div>
                            <div className="details-row">
                                <span className="details-label">Location:</span>
                                <span className="details-val">{selectedRequestDetails.area || 'Brooklyn, NY'}</span>
                            </div>
                            <div className="details-row">
                                <span className="details-label">Status:</span>
                                <span className={`status-badge inline ${selectedRequestDetails.status}`}>{selectedRequestDetails.status}</span>
                            </div>
                            <div className="details-row">
                                <span className="details-label">Move-In Date:</span>
                                <span className="details-val">{selectedRequestDetails.move_in_date ? new Date(selectedRequestDetails.move_in_date).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Not specified'}</span>
                            </div>
                            <div className="details-divider"></div>
                            <div className="details-row vertical">
                                <span className="details-label">Your message to landlord:</span>
                                <p className="details-message-content">"{selectedRequestDetails.message || 'No custom message was attached.'}"</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal-close" onClick={() => setSelectedRequestDetails(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantRequests;
