import React, { useEffect, useState } from 'react';
import './IncomingRequests.css';
import { useStayRequests } from '../../stayRequest/hook/useStayRequests';
import { useSchedule } from '../../schedule/hooks/useSchedule';
import { useMaintenance } from '../../maintenance/hooks/useMaintenance';

const IncomingRequests = ({ onNavigate }) => {
    const { requests, fetchOwnerRequests } = useStayRequests();
    const { schedules, fetchOwnerSchedules } = useSchedule();
    const { requests: maintenanceRequests, fetchOwnerRequests: fetchOwnerMaintenanceRequests, updateStatus: updateMaintenanceStatus } = useMaintenance();
    const [activeTab, setActiveTab] = useState('stay-requests'); // 'stay-requests', 'visit-schedules' or 'maintenance'

    useEffect(() => {
        fetchOwnerRequests();
        fetchOwnerSchedules();
        fetchOwnerMaintenanceRequests();
    }, [fetchOwnerRequests, fetchOwnerSchedules, fetchOwnerMaintenanceRequests]);

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const pendingSchedules = schedules.filter(s => s.status === 'pending');
    const pendingMaintenance = maintenanceRequests.filter(m => m.status === 'pending');

    const handleViewDetails = () => {
        // Navigate to the owner requests page
        if (onNavigate) {
            onNavigate('owner-requests');
        }
    };

    const STATUS_LABELS = {
        pending: 'Pending',
        in_progress: 'In Progress',
        resolved: 'Resolved',
        cancelled: 'Cancelled'
    };

    return (
        <div className="requests-container">
            <div className="section-header-tabs" style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', gap: '16px' }}>
                <button 
                    onClick={() => setActiveTab('stay-requests')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '10px 4px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: activeTab === 'stay-requests' ? '#0a2540' : '#64748b',
                        cursor: 'pointer',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    Stay Requests
                    {pendingRequests.length > 0 && (
                        <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' }}>
                            {pendingRequests.length}
                        </span>
                    )}
                    {activeTab === 'stay-requests' && (
                        <div style={{ position: 'absolute', bottom: '-2px', left: 0, right: 0, height: '2px', backgroundColor: '#0a2540' }} />
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('visit-schedules')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '10px 4px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: activeTab === 'visit-schedules' ? '#0a2540' : '#64748b',
                        cursor: 'pointer',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    Visits
                    {pendingSchedules.length > 0 && (
                        <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' }}>
                            {pendingSchedules.length}
                        </span>
                    )}
                    {activeTab === 'visit-schedules' && (
                        <div style={{ position: 'absolute', bottom: '-2px', left: 0, right: 0, height: '2px', backgroundColor: '#0a2540' }} />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('maintenance')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '10px 4px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: activeTab === 'maintenance' ? '#0a2540' : '#64748b',
                        cursor: 'pointer',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    Maintenance
                    {pendingMaintenance.length > 0 && (
                        <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' }}>
                            {pendingMaintenance.length}
                        </span>
                    )}
                    {activeTab === 'maintenance' && (
                        <div style={{ position: 'absolute', bottom: '-2px', left: 0, right: 0, height: '2px', backgroundColor: '#0a2540' }} />
                    )}
                </button>
            </div>

            <div className="requests-list">
                {activeTab === 'maintenance' ? (
                    maintenanceRequests.length === 0 ? (
                        <div style={{ color: '#64748b', textAlign: 'center', padding: '20px', fontSize: '13px' }}>
                            No maintenance requests yet.
                        </div>
                    ) : (
                        maintenanceRequests.map(req => {
                            const name = req.tenant_name || 'Tenant';
                            const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e2e8f0&color=475569`;

                            return (
                                <div key={req.id} className="request-card">
                                    <div className="request-header">
                                        <img src={avatar} alt={name} className="request-avatar" />
                                        <div className="request-meta">
                                            <span className="request-name">{name}</span>
                                            <span className="request-time">
                                                {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '10px', backgroundColor: req.status === 'resolved' ? '#f0fff4' : req.status === 'in_progress' ? '#ebf8ff' : req.status === 'cancelled' ? '#f7fafc' : '#fffaf0', color: req.status === 'resolved' ? '#38a169' : req.status === 'in_progress' ? '#2b6cb0' : req.status === 'cancelled' ? '#718096' : '#dd6b20' }}>
                                            {STATUS_LABELS[req.status] || req.status}
                                        </span>
                                    </div>
                                    <div className="request-body">
                                        <div className="request-property-link">
                                            Property: <span className="property-highlight">{req.property_title}</span>
                                        </div>
                                        <p className="request-message" style={{ fontStyle: 'normal', color: '#475569', fontWeight: '500' }}>
                                            <strong>{req.category}</strong> · {req.severity} Priority<br />
                                            {req.description}
                                        </p>
                                    </div>
                                    <div className="request-actions">
                                        {req.status === 'pending' && (
                                            <button className="btn-view-details-small" onClick={() => updateMaintenanceStatus(req.id, 'in_progress')}>Start Work</button>
                                        )}
                                        {req.status === 'in_progress' && (
                                            <button className="btn-view-details-small" onClick={() => updateMaintenanceStatus(req.id, 'resolved')}>Mark Resolved</button>
                                        )}
                                        <button className="btn-message-small" onClick={() => onNavigate('tenant-messages')}>Message</button>
                                    </div>
                                </div>
                            );
                        })
                    )
                ) : activeTab === 'stay-requests' ? (
                    pendingRequests.length === 0 ? (
                        <div style={{ color: '#64748b', textAlign: 'center', padding: '20px', fontSize: '13px' }}>
                            No pending stay requests.
                        </div>
                    ) : (
                        pendingRequests.map(req => {
                            const name = req.tenant_name || 'James Davis';
                            const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e2e8f0&color=475569`;

                            return (
                                <div key={req.id} className="request-card">
                                    <div className="request-header">
                                        <img src={avatar} alt={name} className="request-avatar" />
                                        <div className="request-meta">
                                            <span className="request-name">{name}</span>
                                            <span className="request-time">
                                                {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="request-body">
                                        <div className="request-property-link">
                                            Interested in: <span className="property-highlight">{req.title}</span>
                                        </div>
                                        <p className="request-message">"{req.message || 'No custom message attached.'}"</p>
                                    </div>
                                    <div className="request-actions">
                                        <button className="btn-view-details-small" onClick={handleViewDetails}>View Details</button>
                                        <button className="btn-message-small" onClick={() => onNavigate('tenant-messages')}>Message</button>
                                    </div>
                                </div>
                            );
                        })
                    )
                ) : (
                    pendingSchedules.length === 0 ? (
                        <div style={{ color: '#64748b', textAlign: 'center', padding: '20px', fontSize: '13px' }}>
                            No pending visit schedules.
                        </div>
                    ) : (
                        pendingSchedules.map(sch => {
                            const name = sch.name || 'James Davis';
                            const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e2e8f0&color=475569`;

                            return (
                                <div key={sch.id} className="request-card">
                                    <div className="request-header">
                                        <img src={avatar} alt={name} className="request-avatar" />
                                        <div className="request-meta">
                                            <span className="request-name">{name}</span>
                                            <span className="request-time">
                                                {new Date(sch.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="request-body">
                                        <div className="request-property-link">
                                            Visit: <span className="property-highlight">{sch.title}</span>
                                        </div>
                                        <p className="request-message" style={{ fontStyle: 'normal', color: '#475569', fontWeight: '500' }}>
                                            Time Slot: <strong>{sch.time_slot}</strong> <br />
                                            Phone: {sch.phone}
                                        </p>
                                    </div>
                                    <div className="request-actions">
                                        <button className="btn-view-details-small" onClick={handleViewDetails}>View Details</button>
                                        <button className="btn-message-small" onClick={() => onNavigate('tenant-messages')}>Message</button>
                                    </div>
                                </div>
                            );
                        })
                    )
                )}
            </div>
        </div>
    );
};

export default IncomingRequests;
