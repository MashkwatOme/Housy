import React, { useEffect, useState } from 'react';
import './OwnerRequests.css';
import Navbar from '../../properties/components/Navbar';
import { useStayRequests } from '../hook/useStayRequests';
import { useSchedule } from '../../schedule/hooks/useSchedule';
import toast from 'react-hot-toast';

const OwnerRequests = ({ onNavigate }) => {
    const { requests, loading: requestsLoading, error: requestsError, fetchOwnerRequests, updateRequestStatus } = useStayRequests();
    const { schedules, loading: schedulesLoading, error: schedulesError, fetchOwnerSchedules, updateScheduleStatus } = useSchedule();
    
    const [activeSection, setActiveSection] = useState('stay-requests');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (activeSection === 'stay-requests') {
            fetchOwnerRequests();
        } else {
            fetchOwnerSchedules();
        }
    }, [activeSection, fetchOwnerRequests, fetchOwnerSchedules]);

    // Handle stay request approval
    const handleApproveRequest = async (id, name, title) => {
        try {
            await updateRequestStatus(id, 'approved');
            toast.success(`Approved stay request from "${name}" for "${title}"!`, {
                duration: 4000,
                icon: '✅'
            });
            toast.success("Agreement Draft Created\nwaiting for tenant review", {
                duration: 5000,
                icon: '📝',
                style: {
                    borderRadius: '10px',
                    background: '#0a2540',
                    color: '#fff',
                }
            });
        } catch (err) {
            toast.error(err.message || 'Failed to approve stay request.');
        }
    };

    // Handle stay request rejection
    const handleRejectRequest = async (id, name, title) => {
        try {
            await updateRequestStatus(id, 'rejected');
            toast.error(`Rejected stay request from "${name}" for "${title}".`, {
                duration: 4000,
                icon: '❌'
            });
        } catch (err) {
            toast.error(err.message || 'Failed to reject stay request.');
        }
    };

    // Handle schedule approval
    const handleApproveSchedule = async (id, name, title) => {
        try {
            await updateScheduleStatus(id, 'approved');
            toast.success(`Approved visit schedule for "${name}" on "${title}"!`, {
                duration: 4000,
                icon: '✅'
            });
        } catch (err) {
            toast.error(err.message || 'Failed to approve visit schedule.');
        }
    };

    // Handle schedule rejection
    const handleRejectSchedule = async (id, name, title) => {
        try {
            await updateScheduleStatus(id, 'rejected');
            toast.error(`Rejected visit schedule for "${name}" on "${title}".`, {
                duration: 4000,
                icon: '❌'
            });
        } catch (err) {
            toast.error(err.message || 'Failed to reject visit schedule.');
        }
    };

    // Handle schedule cancellation
    const handleCancelSchedule = async (id, name, title) => {
        if (window.confirm(`Are you sure you want to cancel the scheduled visit for "${name}" on "${title}"?`)) {
            try {
                await updateScheduleStatus(id, 'cancelled');
                toast.success(`Visit schedule for "${name}" cancelled successfully.`, {
                    duration: 4000,
                    icon: '🗑️'
                });
            } catch (err) {
                toast.error(err.message || 'Failed to cancel scheduled visit.');
            }
        }
    };

    // Statistics counts
    const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;
    const approvedRequestsCount = requests.filter(r => r.status === 'approved').length;

    const pendingSchedulesCount = schedules.filter(s => s.status === 'pending').length;
    const approvedSchedulesCount = schedules.filter(s => s.status === 'approved').length;

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

    // Helpers
    const getPropertyDetails = (propertyTitle) => {
        const titleLower = (propertyTitle || '').toLowerCase();
        if (titleLower.includes('azure') || titleLower.includes('skyline')) return '2-Bedroom Luxury';
        if (titleLower.includes('oakwood') || titleLower.includes('glass')) return 'Studio Loft';
        if (titleLower.includes('marble')) return '3-Bedroom Suite';
        return '1-Bedroom Cozy Suite';
    };

    const getInitialsColor = (name) => {
        const char = (name || 'J').charAt(0).toUpperCase();
        const code = char.charCodeAt(0);
        if (code % 4 === 0) return 'bg-cyan';
        if (code % 4 === 1) return 'bg-violet';
        if (code % 4 === 2) return 'bg-amber';
        return 'bg-blue';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const isLoading = activeSection === 'stay-requests' ? requestsLoading : schedulesLoading;
    const isError = activeSection === 'stay-requests' ? requestsError : schedulesError;

    return (
        <div className="owner-requests-layout">
            <Navbar onNavigate={onNavigate} activeTab="requests" />

            <main className="owner-requests-main">
                {/* Upper Section */}
                <div className="owner-requests-header">
                    <div className="header-text-container">
                        <h1 className="owner-title">
                            {activeSection === 'stay-requests' ? 'Incoming Stay Requests' : 'Incoming Visit Schedules'}
                        </h1>
                        <p className="owner-subtitle">
                            {activeSection === 'stay-requests'
                                ? 'Manage and review all pending residency applications for your property portfolio.'
                                : 'Manage and review scheduled property viewings for your property portfolio.'}
                        </p>
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
                        onClick={() => { setActiveSection('visit-schedules'); setFilter('all'); }}
                    >
                        Visit Schedules
                    </button>
                </div>

                {/* Statistics Row */}
                <div className="stats-row">
                    <div className="stat-box pending-box">
                        <div className="stat-info">
                            <span className="stat-label">TOTAL PENDING</span>
                            <div className="stat-val-wrapper">
                                <span className="stat-number">{activeSection === 'stay-requests' ? String(pendingRequestsCount).padStart(2, '0') : String(pendingSchedulesCount).padStart(2, '0')}</span>
                                <span className="stat-unit">{activeSection === 'stay-requests' ? 'Requests' : 'Visits'}</span>
                            </div>
                        </div>
                        <div className="stat-icon-wrapper pending-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                    </div>
                    <div className="stat-box approved-box">
                        <div className="stat-info">
                            <span className="stat-label">APPROVED TODAY</span>
                            <div className="stat-val-wrapper">
                                <span className="stat-number">{activeSection === 'stay-requests' ? String(approvedRequestsCount).padStart(2, '0') : String(approvedSchedulesCount).padStart(2, '0')}</span>
                                <span className="stat-unit">{activeSection === 'stay-requests' ? 'Units' : 'Visits'}</span>
                            </div>
                        </div>
                        <div className="stat-icon-wrapper approved-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {isError && (
                    <div className="error-banner">
                        <p>{isError}</p>
                        <button 
                            className="error-retry-btn" 
                            onClick={activeSection === 'stay-requests' ? fetchOwnerRequests : fetchOwnerSchedules}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Main Content Table */}
                {isLoading && (activeSection === 'stay-requests' ? requests.length === 0 : schedules.length === 0) ? (
                    <div className="owner-loading-wrapper">
                        <div className="spinner"></div>
                        <p>Loading {activeSection === 'stay-requests' ? 'stay requests' : 'visit schedules'}...</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="requests-table">
                            <thead>
                                <tr>
                                    <th>{activeSection === 'stay-requests' ? 'APPLICANT' : 'VISITOR'}</th>
                                    <th>PROPERTY</th>
                                    <th>{activeSection === 'stay-requests' ? 'REQUEST DATE' : 'VISIT DATE & TIME'}</th>
                                    <th>STATUS</th>
                                    <th className="actions-header">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeSection === 'stay-requests' ? (
                                    /* Stay Requests Rendering */
                                    filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="empty-table-row">
                                                No stay requests found matching your filter criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRequests.map(req => {
                                            const applicantName = req.tenant_name || 'James Davis';
                                            const applicantEmail = req.tenant_email || 'james.davis@email.com';
                                            const initials = applicantName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                                            return (
                                                <tr key={req.id}>
                                                    <td>
                                                        <div className="applicant-flex">
                                                            <div className={`applicant-avatar-circle ${getInitialsColor(applicantName)}`}>
                                                                {initials}
                                                            </div>
                                                            <div className="applicant-info">
                                                                <span className="applicant-name">{applicantName}</span>
                                                                <span className="applicant-email">{applicantEmail}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="property-cell">
                                                            <span className="property-title-cell">{req.title}</span>
                                                            <span className="property-desc-cell">{getPropertyDetails(req.title)}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="date-cell">
                                                            <span className="date-text">{formatDate(req.created_at)}</span>
                                                            <span className="time-text">{formatTime(req.created_at)}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`status-pill ${req.status}`}>
                                                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="actions-cell">
                                                        {req.status === 'pending' ? (
                                                            <div className="action-buttons">
                                                                <button 
                                                                    className="btn-action-view" 
                                                                    onClick={() => setSelectedRequest(req)} 
                                                                    title="View Details"
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                        <circle cx="12" cy="12" r="3"></circle>
                                                                    </svg>
                                                                </button>
                                                                <button 
                                                                    className="btn-action-approve" 
                                                                    onClick={() => handleApproveRequest(req.id, applicantName, req.title)} 
                                                                    title="Approve Applicant"
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                    </svg>
                                                                </button>
                                                                <button 
                                                                    className="btn-action-reject" 
                                                                    onClick={() => handleRejectRequest(req.id, applicantName, req.title)} 
                                                                    title="Reject Applicant"
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="resolved-text">Resolved</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )
                                ) : (
                                    /* Visit Schedules Rendering */
                                    filteredSchedules.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="empty-table-row">
                                                No visit schedules found matching your filter criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSchedules.map(sch => {
                                            const visitorName = sch.name || 'James Davis';
                                            const visitorEmail = sch.email || 'james.davis@email.com';
                                            const initials = visitorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                                            return (
                                                <tr key={sch.id}>
                                                    <td>
                                                        <div className="applicant-flex">
                                                            <div className={`applicant-avatar-circle ${getInitialsColor(visitorName)}`}>
                                                                {initials}
                                                            </div>
                                                            <div className="applicant-info">
                                                                <span className="applicant-name">{visitorName}</span>
                                                                <span className="applicant-email">{visitorEmail}</span>
                                                                <span style={{ fontSize: '11px', color: '#64748b' }}>{sch.phone}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="property-cell">
                                                            <span className="property-title-cell">{sch.title}</span>
                                                            <span className="property-desc-cell">{sch.address || sch.area}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="date-cell">
                                                            <span className="date-text">
                                                                {new Date(sch.visit_date).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}
                                                            </span>
                                                            <span className="time-text">{sch.time_slot}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`status-pill ${sch.status}`}>
                                                            {sch.status.charAt(0).toUpperCase() + sch.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="actions-cell">
                                                        {sch.status === 'pending' ? (
                                                            <div className="action-buttons">
                                                                <button 
                                                                    className="btn-action-view" 
                                                                    onClick={() => setSelectedSchedule(sch)} 
                                                                    title="View Details"
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                        <circle cx="12" cy="12" r="3"></circle>
                                                                    </svg>
                                                                </button>
                                                                <button 
                                                                    className="btn-action-approve" 
                                                                    onClick={() => handleApproveSchedule(sch.id, visitorName, sch.title)} 
                                                                    title="Approve Schedule"
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                    </svg>
                                                                </button>
                                                                <button 
                                                                    className="btn-action-reject" 
                                                                    onClick={() => handleRejectSchedule(sch.id, visitorName, sch.title)} 
                                                                    title="Reject Schedule"
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ) : sch.status === 'approved' ? (
                                                            <div className="action-buttons">
                                                                <button 
                                                                    className="btn-action-reject" 
                                                                    onClick={() => handleCancelSchedule(sch.id, visitorName, sch.title)} 
                                                                    title="Cancel Schedule"
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="resolved-text">Resolved</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )
                                )}
                            </tbody>
                        </table>

                        {/* Footer Pagination */}
                        <div className="table-footer">
                            <span className="footer-count">
                                Showing {activeSection === 'stay-requests' ? filteredRequests.length : filteredSchedules.length} of {activeSection === 'stay-requests' ? requests.length : schedules.length} entries
                            </span>
                            <div className="pagination-controls">
                                <button className="btn-pagination-prev" disabled>
                                    &lt;
                                </button>
                                <button className="btn-pagination-next" disabled>
                                    &gt;
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="owner-footer">
                <div className="footer-content">
                    <div className="footer-left">
                        <span className="footer-brand">Housy</span>
                        <span className="copyright">© 2026 Housy. All rights reserved.</span>
                    </div>
                    <div className="footer-links">
                        <a href="#support">Support Center</a>
                        <a href="#privacy">Privacy Policy</a>
                        <a href="#terms">Terms of Service</a>
                        <a href="#legal">Legal Notice</a>
                    </div>
                </div>
            </footer>

            {/* Modal: View Request Details and Message */}
            {selectedRequest && (
                <div className="owner-modal-overlay" onClick={() => setSelectedRequest(null)}>
                    <div className="owner-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Stay Request Application</h3>
                            <button className="modal-close-btn" onClick={() => setSelectedRequest(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="applicant-profile-card">
                                <div className={`profile-avatar ${getInitialsColor(selectedRequest.tenant_name)}`}>
                                    {(selectedRequest.tenant_name || 'J').charAt(0).toUpperCase()}
                                </div>
                                <div className="profile-details">
                                    <h4 className="profile-name">{selectedRequest.tenant_name || 'James Davis'}</h4>
                                    <span className="profile-email">{selectedRequest.tenant_email || 'james.davis@email.com'}</span>
                                </div>
                            </div>

                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Property:</span>
                                    <span className="info-value bold">{selectedRequest.title}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Preferred Move-In:</span>
                                    <span className="info-value">
                                        {selectedRequest.move_in_date 
                                            ? new Date(selectedRequest.move_in_date).toLocaleDateString('en-US', { dateStyle: 'medium' }) 
                                            : 'Flexible'}
                                    </span>
                                </div>
                            </div>

                            <div className="message-section">
                                <span className="info-label">Applicant's Cover Message:</span>
                                <div className="message-box">
                                    "{selectedRequest.message || 'No additional cover letter was attached.'}"
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-reject-modal" onClick={() => {
                                handleRejectRequest(selectedRequest.id, selectedRequest.tenant_name, selectedRequest.title);
                                setSelectedRequest(null);
                            }}>
                                Reject
                            </button>
                            <button className="btn-approve-modal" onClick={() => {
                                handleApproveRequest(selectedRequest.id, selectedRequest.tenant_name, selectedRequest.title);
                                setSelectedRequest(null);
                            }}>
                                Approve Applicant
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: View Schedule Details */}
            {selectedSchedule && (
                <div className="owner-modal-overlay" onClick={() => setSelectedSchedule(null)}>
                    <div className="owner-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Visit Schedule Request</h3>
                            <button className="modal-close-btn" onClick={() => setSelectedSchedule(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="applicant-profile-card">
                                <div className={`profile-avatar ${getInitialsColor(selectedSchedule.name)}`}>
                                    {(selectedSchedule.name || 'V').charAt(0).toUpperCase()}
                                </div>
                                <div className="profile-details">
                                    <h4 className="profile-name">{selectedSchedule.name}</h4>
                                    <span className="profile-email">{selectedSchedule.email}</span>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>{selectedSchedule.phone}</span>
                                </div>
                            </div>

                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Property:</span>
                                    <span className="info-value bold">{selectedSchedule.title}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Scheduled Date:</span>
                                    <span className="info-value">
                                        {new Date(selectedSchedule.visit_date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Scheduled Time Slot:</span>
                                    <span className="info-value bold">{selectedSchedule.time_slot}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Status:</span>
                                    <span className={`status-pill ${selectedSchedule.status}`} style={{ width: 'fit-content' }}>
                                        {selectedSchedule.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-reject-modal" onClick={() => {
                                handleRejectSchedule(selectedSchedule.id, selectedSchedule.name, selectedSchedule.title);
                                setSelectedSchedule(null);
                            }}>
                                Reject Visit
                            </button>
                            <button className="btn-approve-modal" onClick={() => {
                                handleApproveSchedule(selectedSchedule.id, selectedSchedule.name, selectedSchedule.title);
                                setSelectedSchedule(null);
                            }}>
                                Approve Visit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerRequests;
