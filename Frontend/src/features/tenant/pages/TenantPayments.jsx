import React, { useEffect, useState } from 'react';
import './TenantPayments.css';
import Navbar from '../../properties/components/Navbar';
import toast from 'react-hot-toast';
import { usePayments } from '../../payments/hooks/usePayments';

const formatMonthLabel = (month) => {
    if (month === 'security_deposit') return 'Security Deposit';
    return month;
};


const TenantPayments = ({ onNavigate }) => {
    const {
        payments,
        dues,
        loading,
        error,
        fetchMyPayments,
        createCheckoutSession,
        createBkashPayment,
        executeBkashPayment,
        fetchPaymentDetails
    } = usePayments();

    const [selectedDue, setSelectedDue] = useState(null);
    const [showPayModal, setShowPayModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedPaymentDetails, setSelectedPaymentDetails] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('stripe'); // 'stripe' or 'bkash'
    const [actionLoading, setActionLoading] = useState(false);
    const [executingBkash, setExecutingBkash] = useState(false);
    const [stripeSuccessState, setStripeSuccessState] = useState(false);

    // Initial Load & Query Parameter Handling
    useEffect(() => {
        const handleCallbacks = async () => {
            const params = new URLSearchParams(window.location.search);
            const paymentId = params.get('payment_id');
            const sessionId = params.get('session_id');
            const bKashStatus = params.get('status');

            if (paymentId && sessionId) {
                // Stripe Success Return
                setStripeSuccessState(true);
                toast.success('Stripe payment session completed!');
                // Clear URL params
                window.history.replaceState({}, document.title, window.location.pathname);
                await fetchMyPayments();
                setTimeout(() => setStripeSuccessState(false), 4000);
            } else if (paymentId && bKashStatus) {
                if (bKashStatus === 'success') {
                    setExecutingBkash(true);
                    toast.loading('Confirming bKash payment, please wait...');
                    try {
                        await executeBkashPayment(paymentId);
                        toast.dismiss();
                        toast.success('bKash payment completed successfully!');
                    } catch (err) {
                        toast.dismiss();
                        toast.error(err.message || 'bKash payment execution failed.');
                    } finally {
                        setExecutingBkash(false);
                        window.history.replaceState({}, document.title, window.location.pathname);
                        await fetchMyPayments();
                    }
                } else {
                    toast.error('bKash payment cancelled or failed.');
                    window.history.replaceState({}, document.title, window.location.pathname);
                    await fetchMyPayments();
                }
            } else {
                await fetchMyPayments();
            }
        };

        handleCallbacks();
    }, [fetchMyPayments, executeBkashPayment]);

    // Handle initiating checkout
    const handlePayInitiate = (dueItem) => {
        setSelectedDue(dueItem);
        setShowPayModal(true);
    };

    const handleCheckoutSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDue) return;

        setActionLoading(true);
        try {
            if (paymentMethod === 'stripe') {
                toast.loading('Redirecting to Stripe checkout...');
                const res = await createCheckoutSession(selectedDue.agreementId, selectedDue.paymentMonth);
                if (res.url) {
                    window.location.href = res.url;
                } else {
                    throw new Error("No redirection URL returned from server.");
                }
            } else {
                toast.loading('Redirecting to bKash gateway...');
                const res = await createBkashPayment(selectedDue.agreementId, selectedDue.paymentMonth);
                if (res.bkashURL) {
                    window.location.href = res.bkashURL;
                } else {
                    throw new Error("No bKash payment URL returned from server.");
                }
            }
        } catch (err) {
            toast.dismiss();
            toast.error(err.message || 'Payment initiation failed.');
        } finally {
            setActionLoading(false);
        }
    };

    // Open transaction details modal
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

    // Total outstanding amount
    const totalOutstanding = dues.reduce((sum, item) => sum + parseFloat(item.monthlyRent), 0);

    return (
        <div className="tenant-payments-layout">
            <Navbar onNavigate={onNavigate} activeTab="payments" />
            
            <main className="tenant-payments-main">
                <div className="payments-header">
                    <div>
                        <h1 className="payments-heading">Rent Payments & Billing</h1>
                        <p className="payments-subheading">View billing histories, complete outstanding rent payments, and check payment logs.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => onNavigate('browse')} className="btn-back-browse-payments">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            Browse Properties
                        </button>
                        <button onClick={() => onNavigate('tenant-dashboard')} className="btn-back-dashboard">
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>

                {/* Status pane when processing callback */}
                {(executingBkash || stripeSuccessState) && (
                    <div className="billing-banner-flex" style={{ justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
                        <div className="checkout-status-pane" style={{ padding: 0 }}>
                            {executingBkash ? (
                                <>
                                    <div className="payment-spinner"></div>
                                    <h4>Finalizing bKash Transaction...</h4>
                                    <p>Verifying secure OTP authorization. Please do not close or refresh this page.</p>
                                </>
                            ) : (
                                <>
                                    <div className="success-scale-checkmark" style={{ margin: '0 auto' }}>
                                        <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                            <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                                            <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                                        </svg>
                                    </div>
                                    <h4 className="success-heading">Payment Verified!</h4>
                                    <p className="success-text">Your Stripe Checkout session succeeded. The database status is updated.</p>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="billing-banner-flex" style={{ backgroundColor: '#fff5f5', borderColor: '#feb2b2' }}>
                        <p style={{ color: '#c53030', fontWeight: '500' }}>Error: {error}</p>
                    </div>
                )}

                <div className="billing-banner-flex">
                    <div className="billing-stat-box">
                        <span className="label">Current Outstanding</span>
                        <h2 className={`balance-val ${totalOutstanding > 0 ? 'alert-color' : 'success-color'}`}>
                            ৳{totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                        <p className="desc">
                            {totalOutstanding > 0 
                                ? `Rent pending for ${dues.length} month(s)` 
                                : 'All rent payments are up to date!'}
                        </p>
                    </div>
                    
                    {totalOutstanding > 0 && (
                        <div className="billing-actions">
                            <p className="billing-note">Secure payment is supported via Stripe (Credit/Debit Card) or bKash Sandbox.</p>
                            <button onClick={() => handlePayInitiate(dues[0])} className="btn-pay-outstanding">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                Pay Outstanding Rent
                            </button>
                        </div>
                    )}
                </div>

                {/* Outstanding Dues list */}
                {dues.length > 0 && (
                    <div className="invoices-section-card" style={{ marginBottom: '36px' }}>
                        <h2>Outstanding Dues</h2>
                        <div className="table-responsive-wrapper">
                            <table className="invoices-table">
                                <thead>
                                    <tr>
                                        <th>Property</th>
                                        <th>Billing Month</th>
                                        <th>Amount</th>
                                        <th>Owner Details</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dues.map((due, idx) => (
                                        <tr key={idx}>
                                            <td className="font-bold">{due.propertyTitle}</td>
                                            <td>{formatMonthLabel(due.paymentMonth)}</td>
                                            <td className="font-medium">৳{parseFloat(due.monthlyRent).toLocaleString()}</td>
                                            <td>{due.ownerName}</td>
                                            <td>
                                                <span className="status-pill status-pending">Unpaid</span>
                                            </td>
                                            <td>
                                                <button onClick={() => handlePayInitiate(due)} className="btn-invoice-action highlight-btn">
                                                    Pay Now
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Payments history table */}
                <div className="invoices-section-card">
                    <h2>Transaction History</h2>
                    {loading && <p>Loading billing history...</p>}
                    {!loading && payments.length === 0 && (
                        <p style={{ color: 'var(--color-text-light)', fontStyle: 'italic' }}>No transactions recorded yet.</p>
                    )}
                    {!loading && payments.length > 0 && (
                        <div className="table-responsive-wrapper">
                            <table className="invoices-table">
                                <thead>
                                    <tr>
                                        <th>Transaction ID</th>
                                        <th>Property</th>
                                        <th>Billing Month</th>
                                        <th>Amount</th>
                                        <th>Gateway</th>
                                        <th>Status</th>
                                        <th>Paid Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((pay) => (
                                        <tr key={pay.id}>
                                            <td className="font-bold" style={{ fontSize: '12px' }}>
                                                {pay.transaction_id || pay.id.substring(0, 8) + '...'}
                                            </td>
                                            <td>{pay.property_title}</td>
                                            <td>{formatMonthLabel(pay.payment_month)}</td>
                                            <td className="font-medium">৳{parseFloat(pay.amount).toLocaleString()}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{pay.payment_gateway}</td>
                                            <td>
                                                <span className={`status-pill status-${pay.status}`}>
                                                    {pay.status}
                                                </span>
                                            </td>
                                            <td>{pay.paid_at ? new Date(pay.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</td>
                                            <td>
                                                <button onClick={() => handleViewDetails(pay.id)} className="btn-invoice-action">
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
            </main>

            {/* Pay Modal */}
            {showPayModal && selectedDue && (
                <div className="checkout-modal-overlay">
                    <div className="checkout-modal-card">
                        <div className="modal-header">
                            <h3>Select Payment Method</h3>
                            <button onClick={() => setShowPayModal(false)} className="btn-close-modal">×</button>
                        </div>

                        <div className="invoice-preview-bar">
                            <div>
                                <p className="invoice-desc">{selectedDue.propertyTitle}</p>
                                <p className="invoice-total">Month: {formatMonthLabel(selectedDue.paymentMonth)}</p>
                            </div>
                            <div className="final-total">৳{parseFloat(selectedDue.monthlyRent).toLocaleString()}</div>
                        </div>

                        <div className="payment-method-selector">
                            <button 
                                type="button"
                                className={`tab-btn ${paymentMethod === 'stripe' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('stripe')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                Pay with Stripe
                            </button>
                            <button 
                                type="button"
                                className={`tab-btn ${paymentMethod === 'bkash' ? 'active' : ''}`}
                                onClick={() => setPaymentMethod('bkash')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                Pay with bKash
                            </button>
                        </div>

                        <form onSubmit={handleCheckoutSubmit} className="checkout-form">
                            {paymentMethod === 'stripe' ? (
                                <>
                                    <div className="card-fields-container" style={{ padding: '10px 0', textAlign: 'center' }}>
                                        <p className="wallet-disclaimer" style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                                            You will be redirected to the secure Stripe Sandbox checkout page. Use any Stripe test card to complete payment.
                                        </p>
                                    </div>
                                    <button type="submit" className="btn-modal-checkout" disabled={actionLoading}>
                                        {actionLoading ? 'Redirecting...' : 'Pay with Stripe'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="bkash-fields-container" style={{ padding: '10px 0' }}>
                                        <p className="wallet-disclaimer" style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '15px' }}>
                                            You will be redirected to the official bKash Tokenized Sandbox UI.
                                        </p>
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="bkash-logo-banner" 
                                        style={{ width: '100%', border: 'none', cursor: 'pointer', display: 'block', padding: '14px', fontSize: '14px', fontWeight: '600' }}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Redirecting...' : 'Pay with bKash'}
                                    </button>
                                </>
                            )}
                            
                            <div className="checkout-trust-flex">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                <span>Secured by Gateway SSL Sandbox Integration</span>
                            </div>
                        </form>


                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedPaymentDetails && (
                <div className="checkout-modal-overlay">
                    <div className="checkout-modal-card" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>Transaction Details</h3>
                            <button onClick={() => setShowDetailsModal(false)} className="btn-close-modal">×</button>
                        </div>

                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 600 }}>Amount Paid</span>
                                    <h2 style={{ fontSize: '24px', margin: '4px 0', color: 'var(--color-text-main)' }}>৳{parseFloat(selectedPaymentDetails.amount).toLocaleString()}</h2>
                                </div>
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 600 }}>Status</span>
                                    <div style={{ marginTop: '6px' }}>
                                        <span className={`status-pill status-${selectedPaymentDetails.status}`}>
                                            {selectedPaymentDetails.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '14px' }}>
                                <div>
                                    <p><strong>Property:</strong> {selectedPaymentDetails.property_title}</p>
                                    <p><strong>Address:</strong> {selectedPaymentDetails.property_address}</p>
                                    <p><strong>Billing Month:</strong> {formatMonthLabel(selectedPaymentDetails.payment_month)}</p>
                                    <p><strong>Paid Via:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedPaymentDetails.payment_gateway}</span></p>
                                </div>
                                <div>
                                    <p><strong>Owner Name:</strong> {selectedPaymentDetails.owner_name}</p>
                                    <p><strong>Owner Email:</strong> {selectedPaymentDetails.owner_email}</p>
                                    <p><strong>Owner Phone:</strong> {selectedPaymentDetails.owner_phone}</p>
                                    <p><strong>Date Paid:</strong> {selectedPaymentDetails.paid_at ? new Date(selectedPaymentDetails.paid_at).toLocaleString() : '-'}</p>
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', wordBreak: 'break-all' }}>
                                <p style={{ margin: '0 0 4px 0' }}><strong>Payment Record ID:</strong> {selectedPaymentDetails.id}</p>
                                <p style={{ margin: '0 0 4px 0' }}><strong>Agreement ID:</strong> {selectedPaymentDetails.agreement_id}</p>
                                <p style={{ margin: 0 }}>
                                    <strong>Gateway Reference:</strong> {selectedPaymentDetails.transaction_id || selectedPaymentDetails.stripe_session_id || selectedPaymentDetails.bkash_payment_id || 'N/A'}
                                </p>
                            </div>

                            <button onClick={() => setShowDetailsModal(false)} className="btn-modal-checkout" style={{ marginTop: '10px' }}>
                                Close Transaction Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantPayments;
