import React, { useEffect, useState } from 'react';
import './OwnerPayments.css';
import Navbar from '../../properties/components/Navbar';
import toast from 'react-hot-toast';
import { usePayments } from '../hooks/usePayments';

const formatMonthLabel = (month) => {
    if (month === 'security_deposit') return 'Security Deposit';
    return month;
};


const OwnerPayments = ({ onNavigate }) => {
    const {
        payments,
        properties,
        stats,
        loading,
        error,
        fetchOwnerPayments,
        fetchPaymentDetails,
        recordCashPayment,
        markNotificationsRead
    } = usePayments();

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedPaymentDetails, setSelectedPaymentDetails] = useState(null);
    const [activeView, setActiveView] = useState('properties'); // 'properties' or 'history'
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchOwnerPayments();
        markNotificationsRead().catch(() => {
            // Best-effort; the badge simply won't clear if this fails.
        });
    }, [fetchOwnerPayments, markNotificationsRead]);

    const handleViewDetails = async (paymentId) => {
        try {
            toast.loading('Loading transaction details...');
            const details = await fetchPaymentDetails(paymentId);
            toast.dismiss();
            setSelectedPaymentDetails(details);
            setShowDetailsModal(true);
        } catch (err) {
            toast.dismiss();
            toast.error(err.message || 'Failed to load details.');
        }
    };

    const handleRecordCash = async (agreementId, paymentMonth, amount) => {
        const confirmMsg = `Record cash payment of ৳${parseFloat(amount).toLocaleString()} for the month ${paymentMonth}?`;
        if (!window.confirm(confirmMsg)) return;

        setActionLoading(true);
        toast.loading('Recording offline cash payment...');
        try {
            await recordCashPayment(agreementId, paymentMonth);
            toast.dismiss();
            toast.success('Cash payment recorded successfully!');
            await fetchOwnerPayments();
        } catch (err) {
            toast.dismiss();
            toast.error(err.message || 'Failed to record cash payment.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="owner-payments-layout">
            <Navbar onNavigate={onNavigate} activeTab="owner-payments" />
            
            <main className="owner-payments-main">
                <div className="payments-header">
                    <div>
                        <h1 className="payments-heading">Rent Payments Dashboard</h1>
                        <p className="payments-subheading">Track incoming tenant rent, monitor payment status, and view your revenue summaries.</p>
                    </div>
                    <div>
                        <button onClick={() => onNavigate('owner-dashboard')} className="btn-back-dashboard">
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="error-banner">
                        <p>Error: {error}</p>
                    </div>
                )}

                {/* Dashboard Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card total-rev">
                        <div className="stat-icon">৳</div>
                        <div className="stat-content">
                            <span className="stat-label">Total Revenue</span>
                            <h2 className="stat-value">৳{stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                            <p className="stat-desc">Lifetime accumulated earnings</p>
                        </div>
                    </div>

                    <div className="stat-card monthly-rev">
                        <div className="stat-icon">📅</div>
                        <div className="stat-content">
                            <span className="stat-label">This Month's Revenue</span>
                            <h2 className="stat-value">৳{stats.monthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                            <p className="stat-desc">Current billing month earnings</p>
                        </div>
                    </div>

                    <div className="stat-card pending-payments">
                        <div className="stat-icon warning">⏳</div>
                        <div className="stat-content">
                            <span className="stat-label">Pending Payments</span>
                            <h2 className="stat-value">{stats.pendingCount}</h2>
                            <p className="stat-desc">Awaiting gateway authorization</p>
                        </div>
                    </div>

                    <div className="stat-card failed-payments">
                        <div className="stat-icon danger">❌</div>
                        <div className="stat-content">
                            <span className="stat-label">Failed Payments</span>
                            <h2 className="stat-value">{stats.failedCount}</h2>
                            <p className="stat-desc">Unsuccessful checkout attempts</p>
                        </div>
                    </div>
                </div>

                {/* Navigation View Switcher tabs */}
                <div className="view-switcher-tabs" style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                    <button 
                        onClick={() => setActiveView('properties')} 
                        className={`view-tab-btn ${activeView === 'properties' ? 'active' : ''}`}
                        style={{
                            padding: '10px 16px',
                            fontWeight: '600',
                            fontSize: '14px',
                            border: 'none',
                            background: activeView === 'properties' ? 'var(--color-primary)' : 'transparent',
                            color: activeView === 'properties' ? 'white' : 'var(--color-text-muted)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        📁 View by Property Card
                    </button>
                    <button 
                        onClick={() => setActiveView('history')} 
                        className={`view-tab-btn ${activeView === 'history' ? 'active' : ''}`}
                        style={{
                            padding: '10px 16px',
                            fontWeight: '600',
                            fontSize: '14px',
                            border: 'none',
                            background: activeView === 'history' ? 'var(--color-primary)' : 'transparent',
                            color: activeView === 'history' ? 'white' : 'var(--color-text-muted)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        📋 All Transactions List
                    </button>
                </div>

                {/* Main Content Area */}
                {activeView === 'properties' ? (
                    <div className="properties-card-view-section">
                        {loading && <p>Loading properties databases...</p>}
                        {!loading && properties.length === 0 && (
                            <p style={{ color: 'var(--color-text-light)', fontStyle: 'italic' }}>No properties found in your portfolio.</p>
                        )}
                        {!loading && properties.length > 0 && (
                            <div className="properties-payment-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '30px' }}>
                                {properties.map((property) => (
                                    <div key={property.id} className="owner-property-pay-card" style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                                        {/* Header Row */}
                                        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '16px', backgroundColor: '#fafbfc' }}>
                                            {property.image_url ? (
                                                <img src={property.image_url} alt={property.title} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '80px', height: '80px', borderRadius: '8px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🏢</div>
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--color-text-main)' }}>{property.title}</h3>
                                                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 6px 0' }}>📍 {property.address}</p>
                                                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-primary)' }}>৳{parseFloat(property.monthly_rent).toLocaleString()} / month</span>
                                            </div>
                                        </div>

                                        {/* Tenant Info / Status */}
                                        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {property.agreement ? (
                                                <>
                                                    {/* Active Tenant Box */}
                                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', backgroundColor: '#f8fafc' }}>
                                                        <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-light)', display: 'block', marginBottom: '6px' }}>Active Tenant Details</span>
                                                        <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '700' }}>👤 {property.agreement.tenant_name}</p>
                                                        <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>✉️ {property.agreement.tenant_email}</p>
                                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>📞 {property.agreement.tenant_phone}</p>
                                                    </div>

                                                    {/* Outstanding Dues list */}
                                                    <div>
                                                        <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--color-text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span>Outstanding Rent Dues</span>
                                                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', backgroundColor: property.agreement.dues.length > 0 ? '#fff5f5' : '#f0fff4', color: property.agreement.dues.length > 0 ? '#e53e3e' : '#38a169' }}>
                                                                {property.agreement.dues.length} pending
                                                            </span>
                                                        </h4>
                                                        {property.agreement.dues.length === 0 ? (
                                                            <p style={{ fontSize: '13px', color: '#38a169', fontStyle: 'italic', margin: 0 }}>All accounts clear! No outstanding rent.</p>
                                                        ) : (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                {property.agreement.dues.map((due, idx) => (
                                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid #fee2e2', borderRadius: '8px', backgroundColor: '#fff5f5' }}>
                                                                        <div>
                                                                            <span style={{ fontWeight: '700', fontSize: '13px', color: '#c53030' }}>{formatMonthLabel(due.paymentMonth)}</span>
                                                                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: '10px' }}>৳{parseFloat(due.amount).toLocaleString()}</span>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => handleRecordCash(property.agreement.id, due.paymentMonth, due.amount)}
                                                                            disabled={actionLoading}
                                                                            style={{
                                                                                backgroundColor: '#38a169',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                padding: '6px 12px',
                                                                                borderRadius: '6px',
                                                                                fontSize: '11px',
                                                                                fontWeight: '600',
                                                                                cursor: 'pointer',
                                                                                transition: 'background-color 0.2s'
                                                                            }}
                                                                        >
                                                                            💵 Record Cash Payment
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Recent Payments logs */}
                                                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                                                        <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--color-text-main)' }}>Payment History</h4>
                                                        {property.agreement.history.length === 0 ? (
                                                            <p style={{ fontSize: '13px', color: 'var(--color-text-light)', fontStyle: 'italic', margin: 0 }}>No payments recorded yet.</p>
                                                        ) : (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto', paddingRight: '4px' }}>
                                                                {property.agreement.history.map((h) => (
                                                                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)', borderBottom: '1px dashed #e2e8f0', paddingBottom: '4px' }}>
                                                                        <span>🗓️ <strong>{formatMonthLabel(h.payment_month)}:</strong> ৳{parseFloat(h.amount).toLocaleString()}</span>
                                                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                                            <span style={{ textTransform: 'uppercase', fontSize: '9px', fontWeight: '700', color: 'white', backgroundColor: h.payment_gateway === 'cash' ? '#38a169' : '#3182ce', padding: '1px 5px', borderRadius: '4px' }}>
                                                                                {h.payment_gateway}
                                                                            </span>
                                                                            <span className={`status-pill status-${h.status}`} style={{ fontSize: '9px', padding: '2px 6px' }}>{h.status}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', textAlign: 'center', border: '2px dashed var(--color-border)', borderRadius: '12px' }}>
                                                    <span style={{ fontSize: '32px', marginBottom: '8px' }}>📭</span>
                                                    <h4 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--color-text-main)' }}>Vacant Property</h4>
                                                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>This property has no active signed lease agreement.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Table List View (Audit Log) */
                    <div className="payments-table-card">
                        <h2>Incoming Transactions</h2>
                        {loading && <p>Loading transaction database...</p>}
                        {!loading && payments.length === 0 && (
                            <p style={{ color: 'var(--color-text-light)', fontStyle: 'italic' }}>No incoming payments recorded yet.</p>
                        )}
                        {!loading && payments.length > 0 && (
                            <div className="table-responsive-wrapper">
                                <table className="payments-table">
                                    <thead>
                                        <tr>
                                            <th>Tenant Name</th>
                                            <th>Property Listing</th>
                                            <th>Month</th>
                                            <th>Rent Amount</th>
                                            <th>Gateway</th>
                                            <th>Status</th>
                                            <th>Date Paid</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((pay) => (
                                            <tr key={pay.id}>
                                                <td className="font-bold">{pay.tenant_name}</td>
                                                <td>{pay.property_title}</td>
                                                <td>{formatMonthLabel(pay.payment_month)}</td>
                                                <td className="font-medium">৳{parseFloat(pay.amount).toLocaleString()}</td>
                                                <td style={{ textTransform: 'capitalize' }}>
                                                    <span style={{
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: '700',
                                                        color: 'white',
                                                        backgroundColor: pay.payment_gateway === 'cash' ? '#38a169' : pay.payment_gateway === 'bkash' ? '#e2125d' : '#635bff'
                                                    }}>
                                                        {pay.payment_gateway}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-pill status-${pay.status}`}>
                                                        {pay.status}
                                                    </span>
                                                </td>
                                                <td>{pay.paid_at ? new Date(pay.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</td>
                                                <td>
                                                    <button onClick={() => handleViewDetails(pay.id)} className="btn-table-action">
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Details Modal */}
            {showDetailsModal && selectedPaymentDetails && (
                <div className="checkout-modal-overlay">
                    <div className="checkout-modal-card" style={{ maxWidth: '650px' }}>
                        <div className="modal-header">
                            <h3>Incoming Transaction Details</h3>
                            <button onClick={() => setShowDetailsModal(false)} className="btn-close-modal">×</button>
                        </div>

                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 600 }}>Amount Received</span>
                                    <h2 style={{ fontSize: '24px', margin: '4px 0', color: 'var(--color-text-main)' }}>৳{parseFloat(selectedPaymentDetails.amount).toLocaleString()}</h2>
                                </div>
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 600 }}>Payment Status</span>
                                    <div style={{ marginTop: '6px' }}>
                                        <span className={`status-pill status-${selectedPaymentDetails.status}`}>
                                            {selectedPaymentDetails.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Property & Rent Info</h4>
                                    <p><strong>Property:</strong> {selectedPaymentDetails.property_title}</p>
                                    <p><strong>Address:</strong> {selectedPaymentDetails.property_address}</p>
                                    <p><strong>Billing Month:</strong> {formatMonthLabel(selectedPaymentDetails.payment_month)}</p>
                                    <p><strong>Gateway:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedPaymentDetails.payment_gateway}</span></p>
                                    <p><strong>Date Paid:</strong> {selectedPaymentDetails.paid_at ? new Date(selectedPaymentDetails.paid_at).toLocaleString() : '-'}</p>
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Tenant Details</h4>
                                    <p><strong>Name:</strong> {selectedPaymentDetails.tenant_name}</p>
                                    <p><strong>Email:</strong> {selectedPaymentDetails.tenant_email}</p>
                                    <p><strong>Phone:</strong> {selectedPaymentDetails.tenant_phone}</p>
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', fontSize: '12px', wordBreak: 'break-all' }}>
                                <p style={{ margin: '0 0 4px 0' }}><strong>Payment Record ID:</strong> {selectedPaymentDetails.id}</p>
                                <p style={{ margin: '0 0 4px 0' }}><strong>Agreement Reference:</strong> {selectedPaymentDetails.agreement_id}</p>
                                <p style={{ margin: 0 }}>
                                    <strong>Gateway Ref TrxID:</strong> {selectedPaymentDetails.transaction_id || selectedPaymentDetails.stripe_session_id || selectedPaymentDetails.bkash_payment_id || 'N/A'}
                                </p>
                            </div>

                            <button onClick={() => setShowDetailsModal(false)} className="btn-modal-checkout" style={{ marginTop: '10px' }}>
                                Close Transaction Logs
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerPayments;
