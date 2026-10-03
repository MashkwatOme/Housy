import { useEffect } from 'react';
import './TenantDashboard.css';
import Navbar from '../../properties/components/Navbar';
import { useAgreement } from '../../agreement/hooks/useAgreement';
import { usePayments } from '../../payments/hooks/usePayments';
import { useChat } from '../../chat/hooks/useChat';

const formatMoney = (value) => `৳${Number(value || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
})}`;

const formatDate = (value) => value
    ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Not specified';

const formatMonth = (value) => {
    if (value === 'security_deposit') return 'Security deposit';
    if (!/^\d{4}-\d{2}$/.test(value || '')) return value || 'Not specified';
    const [year, month] = value.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const TenantDashboard = ({ onNavigate, user }) => {
    const currentUser = user || { name: 'Tenant', email: '', role: 'tenant' };
    const displayName = currentUser.name || currentUser.full_name || 'Tenant';
    const { agreements, fetchAgreements, loading: agreementsLoading } = useAgreement();
    const { payments, dues, fetchMyPayments, loading: paymentsLoading } = usePayments();
    const { conversations, fetchConversations } = useChat();

    useEffect(() => {
        fetchAgreements('tenant');
        fetchMyPayments();
        fetchConversations();
    }, [fetchAgreements, fetchMyPayments, fetchConversations, currentUser.id]);

    const activeStay = agreements.find((agreement) => agreement.status === 'signed');
    const nextDue = dues[0];
    const ownerName = activeStay?.owner_name || 'Landlord not assigned';
    const recentPayments = payments.slice(0, 4);
    const isLoading = agreementsLoading || paymentsLoading;

    const stats = [
        {
            title: 'Current Residence',
            value: activeStay?.property_title || 'No active residence',
            desc: activeStay?.property_address || 'Sign an agreement to activate a stay',
            color: 'var(--color-primary)',
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        },
        {
            title: 'Next Rent Due',
            value: nextDue ? formatMoney(nextDue.monthlyRent) : 'No outstanding dues',
            desc: nextDue ? formatMonth(nextDue.paymentMonth) : 'Your account is up to date',
            color: '#e53e3e',
            actionText: nextDue ? 'Pay Now' : 'Payments',
            actionKey: 'tenant-payments',
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        },
        {
            title: 'Messages',
            value: `${conversations.length} Conversation${conversations.length === 1 ? '' : 's'}`,
            desc: conversations.length ? 'Open your inbox to continue chatting' : 'No conversations yet',
            color: '#2b6cb0',
            actionText: 'Open Inbox',
            actionKey: 'tenant-messages',
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        },
        {
            title: 'Agreements',
            value: `${agreements.length} Agreement${agreements.length === 1 ? '' : 's'}`,
            desc: activeStay ? 'One active signed lease' : 'No active signed lease',
            color: '#38a169',
            actionText: 'View Agreements',
            actionKey: 'agreements',
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        }
    ];

    return (
        <div className="tenant-dashboard-layout">
            <Navbar onNavigate={onNavigate} activeTab="dashboard" />
            <main className="tenant-main-content">
                <div className="tenant-welcome-header">
                    <div>
                        <h1 className="welcome-heading">Welcome back, {displayName}!</h1>
                        <p className="welcome-subtext">Here is your personal lease, message, and payment overview.</p>
                    </div>
                    <button onClick={() => onNavigate('browse')} className="btn-back-browse">Back to Browse Properties</button>
                </div>

                {isLoading && <p>Loading your dashboard...</p>}

                <div className="tenant-stats-grid">
                    {stats.map((stat) => (
                        <div key={stat.title} className="tenant-stat-card">
                            <div className="stat-card-header">
                                <div className="stat-icon-container" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
                                {stat.actionText && <button onClick={() => onNavigate(stat.actionKey)} className="stat-action-btn" style={{ color: stat.color }}>{stat.actionText} →</button>}
                            </div>
                            <h3 className="stat-value">{stat.value}</h3>
                            <p className="stat-title">{stat.title}</p>
                            <p className="stat-desc">{stat.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="tenant-sections-wrapper">
                    <div className="tenant-section-left">
                        <div className="tenant-card main-lease-card">
                            <div className="card-header-flex">
                                <h2>Your Active Stay</h2>
                                {activeStay && <span className="status-pill active-pill">Active Lease</span>}
                            </div>
                            {activeStay ? (
                                <div className="lease-showcase">
                                    <div className="lease-image-placeholder">
                                        {activeStay.property_image && <img src={activeStay.property_image} alt={activeStay.property_title} />}
                                    </div>
                                    <div className="lease-details-info">
                                        <h3>{activeStay.property_title}</h3>
                                        <p className="address">{activeStay.property_address}</p>
                                        <div className="lease-meta-specs">
                                            <div className="spec-item"><span className="spec-label">Monthly Rent</span><span className="spec-val">{formatMoney(activeStay.monthly_rent)} / month</span></div>
                                            <div className="spec-item"><span className="spec-label">Lease Duration</span><span className="spec-val">{formatDate(activeStay.agreement_start_date)} - {formatDate(activeStay.agreement_end_date)}</span></div>
                                            <div className="spec-item"><span className="spec-label">Landlord</span><span className="spec-val">{ownerName}</span></div>
                                        </div>
                                        <div className="lease-actions-footer">
                                            <button onClick={() => onNavigate('tenant-stay')} className="lease-btn primary-btn">View Current Stay</button>
                                            <button onClick={() => onNavigate('tenant-messages')} className="lease-btn outline-btn">Chat with {ownerName}</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                    <h3>No active stay found</h3>
                                    <p className="stat-desc">This account does not have a signed rental agreement.</p>
                                    <button onClick={() => onNavigate('browse')} className="lease-btn primary-btn">Browse Properties</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="tenant-section-right">
                        <div className="tenant-card shortcuts-card">
                            <h2>Quick Actions</h2>
                            <div className="shortcuts-grid">
                                <button onClick={() => onNavigate('tenant-payments')} className="shortcut-btn"><span>Payments</span></button>
                                <button onClick={() => onNavigate('tenant-requests')} className="shortcut-btn"><span>Requests</span></button>
                                <button onClick={() => onNavigate('tenant-messages')} className="shortcut-btn"><span>Messages</span></button>
                                <button onClick={() => onNavigate('aisearch')} className="shortcut-btn"><span>Find Homes</span></button>
                            </div>
                        </div>

                        <div className="tenant-card timeline-card">
                            <h2>Recent Payments</h2>
                            {recentPayments.length === 0 ? (
                                <p className="stat-desc">No payment activity for this account.</p>
                            ) : (
                                <div className="activity-timeline">
                                    {recentPayments.map((payment, index) => (
                                        <div key={payment.id} className="timeline-item">
                                            <div className="timeline-indicator"><div className={`timeline-dot ${payment.status === 'paid' ? 'payment-success' : 'payment'}`} />{index !== recentPayments.length - 1 && <div className="timeline-line" />}</div>
                                            <div className="timeline-content">
                                                <div className="timeline-meta"><span className="timeline-title">{payment.property_title}</span><span className="timeline-date">{formatDate(payment.created_at)}</span></div>
                                                <p className="timeline-text">{formatMoney(payment.amount)} for {formatMonth(payment.payment_month)} — {payment.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TenantDashboard;
