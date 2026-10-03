import { useState, useEffect } from 'react';
import './TenantCurrentStay.css';
import Navbar from '../../properties/components/Navbar';
import toast from 'react-hot-toast';
import { useAgreement } from '../../agreement/hooks/useAgreement';
import { useChat } from '../../chat/hooks/useChat';
import { useMaintenance } from '../../maintenance/hooks/useMaintenance';

const calculateRemainingTime = (endDateStr) => {
    if (!endDateStr) return 'No end date';
    const end = new Date(endDateStr);
    const now = new Date();
    // Normalize dates to remove time part for accurate days comparison
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffTime = end - now;
    if (diffTime <= 0) return 'Lease Expired';
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 30) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    if (remainingDays === 0) {
        return `${months} month${months > 1 ? 's' : ''}`;
    }
    return `${months} month${months > 1 ? 's' : ''}, ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
};

const TenantCurrentStay = ({ onNavigate }) => {
    const { agreements, fetchAgreements, loading } = useAgreement();
    const { startConversation } = useChat();

    useEffect(() => {
        fetchAgreements('tenant');
    }, [fetchAgreements]);

    const activeStay = agreements.find(a => a.status === 'signed');

    const handleOpenOwnerChat = async () => {
        if (!activeStay || !activeStay.property_id || !activeStay.owner_id) {
            toast.error('Owner chat is unavailable for this stay.');
            return;
        }

        try {
            await startConversation(activeStay.property_id, activeStay.owner_id);
            onNavigate('tenant-messages');
        } catch (err) {
            console.error('Failed to start owner conversation:', err);
            toast.error('Could not open a chat with the owner right now.');
        }
    };

    const { requests, fetchMyRequests, createRequest, loading: maintenanceLoading } = useMaintenance();

    useEffect(() => {
        fetchMyRequests();
    }, [fetchMyRequests]);

    // Form states
    const [category, setCategory] = useState('Plumbing');
    const [severity, setSeverity] = useState('Low');
    const [desc, setDesc] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const STATUS_LABELS = {
        pending: 'Pending',
        in_progress: 'In Progress',
        resolved: 'Resolved',
        cancelled: 'Cancelled'
    };

    const handleNewRequestSubmit = async (e) => {
        e.preventDefault();
        if (!desc.trim()) {
            toast.error('Please describe the maintenance issue.');
            return;
        }
        if (!activeStay) {
            toast.error('You need an active signed lease to submit a maintenance request.');
            return;
        }

        setSubmitting(true);
        try {
            await createRequest({
                agreementId: activeStay.id,
                category,
                severity,
                description: desc
            });
            setDesc('');
            await fetchMyRequests();
            toast.success('Maintenance request submitted successfully!');
        } catch (err) {
            toast.error(err.message || 'Failed to submit maintenance request.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="tenant-stay-layout">
            <Navbar onNavigate={onNavigate} activeTab="leases" />
            
            <main className="tenant-stay-main">
                <div className="stay-header">
                    <div>
                        <h1 className="stay-heading">Your Current Stay</h1>
                        <p className="stay-subheading">Manage your active lease, landlord communication, and maintenance requests.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => onNavigate('browse')} className="btn-back-browse-stay">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            Back to Browse Properties
                        </button>
                        <button onClick={() => onNavigate('tenant-dashboard')} className="btn-back-dashboard">
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>

                <div className="stay-grid-columns">
                    {/* Left: Lease Details */}
                    {loading ? (
                        <div className="stay-left-pane">
                            <div className="stay-card" style={{ padding: '80px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                Loading your stay details...
                            </div>
                        </div>
                    ) : activeStay ? (
                        <div className="stay-left-pane">
                            <div className="stay-card property-showcase-card">
                                <div className="showcase-img-container">
                                    <img 
                                        src={activeStay.property_image || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80"} 
                                        alt={activeStay.property_title} 
                                    />
                                    <div className="stay-badge">Current Rented Home</div>
                                </div>
                                <div className="showcase-body">
                                    <h2>{activeStay.property_title}</h2>
                                    <p className="address-line">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                        {activeStay.property_address}
                                    </p>

                                    <div className="specs-list">
                                        <div className="spec-row">
                                            <span className="label">Monthly Rental</span>
                                            <span className="value font-accent">৳{Number(activeStay.monthly_rent).toLocaleString() || '—'} / month</span>
                                        </div>
                                        <div className="spec-row">
                                            <span className="label">Security Deposit</span>
                                            <span className="value">৳{Number(activeStay.security_deposit).toLocaleString() || '0.00'} (Refundable)</span>
                                        </div>
                                        <div className="spec-row">
                                            <span className="label">Lease Duration</span>
                                            <span className="value">
                                                {new Date(activeStay.agreement_start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} - {new Date(activeStay.agreement_end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="spec-row">
                                            <span className="label">Remaining Duration</span>
                                            <span className="value" style={{ color: '#dc2626', fontWeight: '700' }}>
                                                {calculateRemainingTime(activeStay.agreement_end_date)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="stay-card contact-landlord-card">
                                <h2>Landlord Profile</h2>
                                <div className="landlord-profile-flex">
                                    <div className="landlord-avatar-circle" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                                        {activeStay.owner_name ? activeStay.owner_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'LL'}
                                    </div>
                                    <div className="landlord-info">
                                        <h3>{activeStay.owner_name}</h3>
                                        <p className="relation">Property Owner</p>
                                        <div className="contact-details">
                                            <p><strong>Email:</strong> {activeStay.owner_email}</p>
                                            <p><strong>Phone:</strong> {activeStay.owner_phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleOpenOwnerChat} className="btn-chat-owner">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                    Send Chat Message
                                </button>
                            </div>

                            <div className="stay-card lease-docs-card">
                                <h2>Lease Documentation</h2>
                                <div className="doc-item-row">
                                    <div className="doc-info">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        <div>
                                            <p className="doc-title">{activeStay.template_name || 'Lease Agreement Document'}</p>
                                            <p className="doc-meta">Signed on {new Date(activeStay.updated_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onNavigate('agreement-details', activeStay.id)} 
                                        className="btn-download-doc"
                                    >
                                        View Document
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="stay-left-pane">
                            <div className="stay-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', color: 'var(--color-text-light)' }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-main)' }}>No Active Stay Found</h2>
                                <p style={{ fontSize: '14px', marginBottom: '24px' }}>You do not have any active signed rental agreements at the moment.</p>
                                <button onClick={() => onNavigate('browse')} className="btn-primary-full" style={{ maxWidth: '200px', margin: '0 auto' }}>Browse Properties</button>
                            </div>
                        </div>
                    )}

                    {/* Right: Maintenance Requests */}
                    <div className="stay-right-pane">
                        <div className="stay-card request-form-card">
                            <h2>Submit Maintenance Request</h2>
                            <form onSubmit={handleNewRequestSubmit} className="request-form">
                                <div className="form-row-half">
                                    <div className="form-group">
                                        <label className="label">Category</label>
                                        <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                                            <option value="Plumbing">Plumbing</option>
                                            <option value="Electrical">Electrical</option>
                                            <option value="Appliance">Appliance</option>
                                            <option value="Heating/AC">Heating / AC</option>
                                            <option value="Structural">Structural</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Urgency Level</label>
                                        <select className="form-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                                            <option value="Low">Low Priority</option>
                                            <option value="Medium">Medium Priority</option>
                                            <option value="High">Emergency / High</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="label">Issue Description</label>
                                    <textarea 
                                        className="form-textarea" 
                                        rows="4" 
                                        placeholder="Please provide full details of the issue (e.g. kitchen faucet is leaking about 2 drops a second, cupboard underneath getting damp...)"
                                        value={desc}
                                        onChange={(e) => setDesc(e.target.value)}
                                    ></textarea>
                                </div>

                                <button type="submit" className="btn-submit-ticket" disabled={submitting}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </form>
                        </div>

                        <div className="stay-card tickets-list-card">
                            <h2>Request History ({requests.length})</h2>
                            <div className="tickets-stack">
                                {maintenanceLoading ? (
                                    <p className="no-tickets">Loading your maintenance requests...</p>
                                ) : requests.length === 0 ? (
                                    <p className="no-tickets">No maintenance requests logged yet.</p>
                                ) : (
                                    requests.map((t) => (
                                        <div key={t.id} className="ticket-item">
                                            <div className="ticket-header">
                                                <span className="ticket-id">{t.id.slice(0, 8).toUpperCase()}</span>
                                                <span className={`status-tag status-${t.status}`}>
                                                    {STATUS_LABELS[t.status] || t.status}
                                                </span>
                                            </div>
                                            <p className="ticket-desc">{t.description}</p>
                                            <div className="ticket-footer">
                                                <span className="meta-badge category">{t.category}</span>
                                                <span className={`meta-badge severity-${t.severity.toLowerCase()}`}>{t.severity} Priority</span>
                                                <span className="ticket-date">
                                                    {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TenantCurrentStay;
