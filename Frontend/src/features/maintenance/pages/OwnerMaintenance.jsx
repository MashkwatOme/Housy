import { useEffect } from 'react';
import './OwnerMaintenance.css';
import Navbar from '../../properties/components/Navbar';
import toast from 'react-hot-toast';
import { useMaintenance } from '../hooks/useMaintenance';

const STATUS_LABELS = {
    pending: 'Pending',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    cancelled: 'Cancelled'
};

const OwnerMaintenance = ({ onNavigate }) => {
    const { requests, loading, error, fetchOwnerRequests, updateStatus, markNotificationsRead } = useMaintenance();

    useEffect(() => {
        fetchOwnerRequests();
        markNotificationsRead().catch(() => {
            // Best-effort; the badge simply won't clear if this fails.
        });
    }, [fetchOwnerRequests, markNotificationsRead]);

    const handleStatusChange = async (requestId, status) => {
        try {
            await updateStatus(requestId, status);
            toast.success(`Request marked as ${STATUS_LABELS[status] || status}.`);
        } catch (err) {
            toast.error(err.message || 'Failed to update request status.');
        }
    };

    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const inProgressCount = requests.filter(r => r.status === 'in_progress').length;
    const resolvedCount = requests.filter(r => r.status === 'resolved').length;

    return (
        <div className="owner-maintenance-layout">
            <Navbar onNavigate={onNavigate} activeTab="owner-maintenance" />

            <main className="owner-maintenance-main">
                <div className="maintenance-header">
                    <div>
                        <h1 className="maintenance-heading">Maintenance Requests</h1>
                        <p className="maintenance-subheading">Review issues reported by tenants and track work to resolution.</p>
                    </div>
                    <button onClick={() => onNavigate('ownerdashboard')} className="btn-back-dashboard">
                        ← Back to Dashboard
                    </button>
                </div>

                {error && (
                    <div className="error-banner">
                        <p>Error: {error}</p>
                    </div>
                )}

                <div className="maintenance-stats-grid">
                    <div className="maintenance-stat-card">
                        <span className="stat-label">Pending</span>
                        <h2 className="stat-value">{pendingCount}</h2>
                    </div>
                    <div className="maintenance-stat-card">
                        <span className="stat-label">In Progress</span>
                        <h2 className="stat-value">{inProgressCount}</h2>
                    </div>
                    <div className="maintenance-stat-card">
                        <span className="stat-label">Resolved</span>
                        <h2 className="stat-value">{resolvedCount}</h2>
                    </div>
                </div>

                <div className="maintenance-list-card">
                    <h2>All Requests ({requests.length})</h2>
                    {loading && <p>Loading maintenance requests...</p>}
                    {!loading && requests.length === 0 && (
                        <p className="empty-state">No maintenance requests submitted yet.</p>
                    )}
                    {!loading && requests.length > 0 && (
                        <div className="maintenance-requests-stack">
                            {requests.map((req) => (
                                <div key={req.id} className="maintenance-request-row">
                                    <div className="request-row-main">
                                        <div className="request-row-top">
                                            <span className="request-tenant">{req.tenant_name}</span>
                                            <span className={`status-pill status-${req.status}`}>{STATUS_LABELS[req.status] || req.status}</span>
                                        </div>
                                        <p className="request-property">{req.property_title}</p>
                                        <p className="request-detail">
                                            <strong>{req.category}</strong> · {req.severity} Priority
                                        </p>
                                        <p className="request-description">{req.description}</p>
                                        <p className="request-date">
                                            Submitted {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="request-row-actions">
                                        {req.status === 'pending' && (
                                            <button className="btn-status-action" onClick={() => handleStatusChange(req.id, 'in_progress')}>Start Work</button>
                                        )}
                                        {req.status === 'in_progress' && (
                                            <button className="btn-status-action resolve" onClick={() => handleStatusChange(req.id, 'resolved')}>Mark Resolved</button>
                                        )}
                                        {(req.status === 'pending' || req.status === 'in_progress') && (
                                            <button className="btn-status-action cancel" onClick={() => handleStatusChange(req.id, 'cancelled')}>Cancel</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default OwnerMaintenance;
