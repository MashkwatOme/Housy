import React, { useEffect, useState, useRef } from 'react';
import './AgreementDetails.css';
import Navbar from '../../properties/components/Navbar';
import { useAgreement } from '../hooks/useAgreement';
import { useAuth } from '../../auth/hooks/useAuth';
import toast from 'react-hot-toast';
import SignatureCanvas from 'react-signature-canvas';
import { uploadSignatureToCloudinary } from '../services/cloudinary.utils';

const AgreementDetails = ({ onNavigate, agreementId }) => {
    const { user } = useAuth();
    const { currentAgreement, loading, error, fetchAgreementById, updateAgreement, sendForSignature, signAgreement, downloadAgreementPdf } = useAgreement();

    // Local form states
    const [customRules, setCustomRules] = useState([]);
    const [newRule, setNewRule] = useState('');
    const [negotiationNotes, setNegotiationNotes] = useState('');
    const [agreementStartDate, setAgreementStartDate] = useState('');
    const [agreementEndDate, setAgreementEndDate] = useState('');

    // Signature UI states
    const [activeSigTab, setActiveSigTab] = useState('draw'); // 'draw' or 'type'
    const [typedName, setTypedName] = useState('');
    const [isSigning, setIsSigning] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const sigPadRef = useRef(null);

    // Dynamic duration calculator
    const calculateDuration = (startStr, endStr) => {
        if (!startStr || !endStr) return '0 Months';
        const start = new Date(startStr);
        const end = new Date(endStr);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return '0 Months';
        
        let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        if (end.getDate() < start.getDate() - 15) {
            months -= 0.5;
        } else if (end.getDate() > start.getDate() + 15) {
            months += 0.5;
        }
        
        if (months < 1) {
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return `${diffDays} Days`;
        }
        
        return `${Math.max(1, Math.round(months))} Months`;
    };

    useEffect(() => {
        if (agreementId) {
            fetchAgreementById(agreementId).then(data => {
                if (data) {
                    let rules = [];
                    if (data.custom_rules) {
                        try {
                            rules = typeof data.custom_rules === 'string' 
                                ? JSON.parse(data.custom_rules) 
                                : data.custom_rules;
                        } catch (e) {
                            rules = [];
                        }
                    }
                    setCustomRules(Array.isArray(rules) ? rules : []);
                    setNegotiationNotes(data.negotiation_notes || data.negotiationNotes || '');
                    
                    if (data.agreement_start_date) {
                        setAgreementStartDate(data.agreement_start_date.split('T')[0]);
                    }
                    if (data.agreement_end_date) {
                        setAgreementEndDate(data.agreement_end_date.split('T')[0]);
                    } else if (data.agreement_start_date) {
                        const start = new Date(data.agreement_start_date);
                        start.setFullYear(start.getFullYear() + 1);
                        setAgreementEndDate(start.toISOString().split('T')[0]);
                    }
                }
            });
        }
    }, [agreementId, fetchAgreementById]);

    // Handle adding custom rule
    const handleAddRule = (e) => {
        e.preventDefault();
        if (!newRule.trim()) return;
        setCustomRules([...customRules, newRule.trim()]);
        setNewRule('');
        toast.success('Custom clause added locally. Remember to save draft!', { duration: 2500 });
    };

    // Handle removing custom rule
    const handleRemoveRule = (index) => {
        const updated = customRules.filter((_, idx) => idx !== index);
        setCustomRules(updated);
        toast.error('Clause removed locally.', { duration: 2500 });
    };

    // Save draft handler
    const handleSaveDraft = async () => {
        try {
            await updateAgreement(agreementId, {
                customRules,
                agreementStartDate,
                agreementEndDate,
                negotiationNotes
            });
            toast.success(isOwner ? 'Agreement draft saved successfully!' : 'Agreement feedback saved successfully!', {
                icon: '💾'
            });
        } catch (err) {
            toast.error(err.message || 'Failed to save draft.');
        }
    };

    // Send for signature handler
    const handleSendForSignature = async () => {
        try {
            // First save any local edits to rules/dates
            await updateAgreement(agreementId, {
                customRules,
                agreementStartDate,
                agreementEndDate,
                negotiationNotes
            });
            // Then finalize and send for signature using the dedicated endpoint
            await sendForSignature(agreementId);
            toast.success('Agreement finalized and sent for signature!', {
                icon: '✉️'
            });
        } catch (err) {
            toast.error(err.message || 'Failed to send for signature.');
        }
    };

    // Download the final signed agreement PDF
    const handleDownloadPdf = async () => {
        setIsDownloadingPdf(true);
        try {
            const blob = await downloadAgreementPdf(agreementId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `agreement-${agreementId}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Agreement PDF downloaded!', { icon: '📄' });
        } catch (err) {
            toast.error(err.message || 'Failed to download agreement PDF.');
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    // Format currency
    const formatCurrency = (val) => {
        return `৳${Number(val || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    };

    // Convert typed signature name into base64 image using an offline canvas
    const convertTypedToImage = (name) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = 500;
            canvas.height = 180;
            const ctx = canvas.getContext('2d');
            
            // Clean white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Elegant signature baseline
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(50, 130);
            ctx.lineTo(450, 130);
            ctx.stroke();

            // Stylized cursive font signature
            ctx.font = 'italic 48px "Caveat", "Great Vibes", "Brush Script MT", cursive';
            ctx.fillStyle = '#0f172a'; // Deep slate blue ink
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(name, canvas.width / 2, canvas.height / 2 - 10);
            
            resolve(canvas.toDataURL('image/png'));
        });
    };

    // Capture, upload, and submit signature
    const handleSignAgreement = async () => {
        console.log("handleSignAgreement clicked!");
        let dataUrl = '';
        try {
            if (activeSigTab === 'draw') {
                console.log("Active tab: draw");
                if (!sigPadRef.current) {
                    console.error("sigPadRef.current is null!");
                    return toast.error("Signature pad is not initialized.");
                }
                if (sigPadRef.current.isEmpty()) {
                    console.log("Signature pad is empty");
                    return toast.error("Please draw your signature first.");
                }
                dataUrl = sigPadRef.current.getCanvas().toDataURL('image/png');
                console.log("Signature drawn captured, length:", dataUrl.length);
            } else {
                console.log("Active tab: type, name:", typedName);
                if (!typedName.trim()) {
                    return toast.error("Please type your name first.");
                }
                dataUrl = await convertTypedToImage(typedName.trim());
                console.log("Signature typed captured, length:", dataUrl.length);
            }
        } catch (err) {
            console.error("Error capturing signature canvas:", err);
            return toast.error("Failed to capture signature image: " + err.message);
        }

        setIsSigning(true);
        const uploadToastId = toast.loading("Uploading signature to Cloudinary...");
        
        try {
            // Upload to Cloudinary
            console.log("Uploading to Cloudinary...");
            const signatureUrl = await uploadSignatureToCloudinary(dataUrl);
            console.log("Uploaded successfully, URL:", signatureUrl);
            
            // Submit to backend
            toast.loading("Applying signature and finalizing...", { id: uploadToastId });
            console.log("Submitting signature to backend for agreementId:", agreementId);
            await signAgreement(agreementId, signatureUrl);
            console.log("Backend sign agreement completed!");
            
            toast.success(isOwner ? "Agreement finalized and signed!" : "Agreement signed successfully!", { id: uploadToastId });
            
            // Clear fields
            if (sigPadRef.current) sigPadRef.current.clear();
            setTypedName('');
        } catch (err) {
            console.error("Error in signature uploading/saving process:", err);
            toast.error(err.message || "Failed to sign agreement.", { id: uploadToastId });
        } finally {
            setIsSigning(false);
        }
    };

    // Helper for placeholder images
    const getPropertyImage = (title) => {
        const t = (title || '').toLowerCase();
        if (t.includes('skyline') || t.includes('penthouse')) {
            return "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80";
        }
        if (t.includes('greenwood') || t.includes('loft') || t.includes('garden')) {
            return "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80";
        }
        return "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80";
    };

    // Dynamic timeline status calculator
    const getTimeline = () => {
        const status = currentAgreement?.status || 'draft';
        return [
            {
                title: 'Stay Request Approved',
                desc: 'Agreement draft generated from property terms.',
                active: true,
                checked: true
            },
            {
                title: 'Draft Negotiating & Review',
                desc: status === 'draft' ? 'Lessor & Lessee reviewing terms.' : 'Draft finalised by Owner.',
                active: true,
                checked: status !== 'draft'
            },
            {
                title: 'Tenant Signature',
                desc: status === 'pending_signature' 
                    ? 'Awaiting Tenant signature.' 
                    : (status === 'tenant_signed' || status === 'signed') 
                        ? 'Signed by Tenant.' 
                        : 'Awaiting draft locks.',
                active: status !== 'draft',
                checked: status === 'tenant_signed' || status === 'signed'
            },
            {
                title: 'Owner Signature',
                desc: status === 'signed' 
                    ? 'Signed by Owner. Agreement secured.' 
                    : status === 'tenant_signed' 
                        ? 'Awaiting Owner signature.' 
                        : 'Awaiting Tenant signature.',
                active: status === 'tenant_signed' || status === 'signed',
                checked: status === 'signed'
            }
        ];
    };

    // Banner dynamic classes
    const getBannerClass = () => {
        const status = currentAgreement?.status || 'draft';
        if (status === 'draft') return 'draft';
        if (status === 'signed') return 'completed';
        if (status === 'tenant_signed') return 'tenant-signed';
        return 'pending';
    };

    // Banner dynamic messages
    const getBannerMessage = () => {
        const status = currentAgreement?.status || 'draft';
        if (status === 'draft') {
            return isOwner 
                ? 'DRAFT — This agreement is currently editable by you. Customize terms and click "Send For Signature" to lock.' 
                : 'DRAFT — Review terms and discuss with the owner. You can save feedback inside the text box below.';
        }
        if (status === 'pending_signature') {
            return isOwner
                ? 'PENDING TENANT SIGNATURE — Locked and sent for signing. Tenant must sign first.'
                : 'ACTION REQUIRED — The agreement is locked. Please review terms and sign the agreement below.';
        }
        if (status === 'tenant_signed') {
            return isOwner
                ? 'ACTION REQUIRED — Tenant has signed. Review and finalize this agreement by signing below.'
                : 'AWAITING OWNER SIGNATURE — You have signed successfully! Awaiting owner signature to finalize.';
        }
        if (status === 'signed') {
            return 'COMPLETED — This rent agreement has been signed by both parties and is fully executed.';
        }
        return 'FINALIZED — This agreement is locked and editing is disabled.';
    };

    if (loading && !currentAgreement) {
        return (
            <div className="details-loading-overlay">
                <div className="details-spinner"></div>
                <p>Loading lease details...</p>
            </div>
        );
    }

    if (error || !currentAgreement) {
        return (
            <div className="error-details-view">
                <Navbar onNavigate={onNavigate} activeTab="agreements" />
                <div className="error-details-box">
                    <h3>Error Loading Agreement</h3>
                    <p>{error || 'The requested agreement draft was not found.'}</p>
                    <button className="btn-back-details" onClick={() => onNavigate('agreements')}>
                        Back to List
                    </button>
                </div>
            </div>
        );
    }

    const isOwner = user?.role === 'owner';
    const isEditable = currentAgreement?.status === 'draft';
    const docId = `AG-${currentAgreement.id.substring(0, 8).toUpperCase()}-RNT`;
    const draftVer = `Draft v${currentAgreement.draft_version || '2.1'}`;

    return (
        <div className="agreement-details-layout">
            <Navbar onNavigate={onNavigate} activeTab="agreements" />

            {/* Editable draft banner */}
            <div className={`draft-editable-top-banner ${getBannerClass()}`}>
                <span className="banner-icon">
                    {currentAgreement?.status === 'signed' ? '✅' : currentAgreement?.status === 'draft' ? 'ℹ' : '🔒'}
                </span>
                <span>
                    {getBannerMessage()}
                </span>
            </div>

            <main className="agreement-details-main">
                {/* Header row */}
                <div className="details-main-header">
                    <div className="header-meta-box">
                        <div className="title-row-flex">
                            <span className="meta-badge-tag">RENT AGREEMENT</span>
                            <span className="version-tag">{draftVer}</span>
                        </div>
                        <h1 className="agreement-title-id">{docId}</h1>
                        <p className="created-timeline-info">
                            Created on {new Date(currentAgreement.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })} • Last updated {new Date(currentAgreement.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    {isEditable && (
                        <div className="header-actions-group">
                            <button className="btn-header-action outline" onClick={handleSaveDraft}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21H5a2 2 0 0 1-2 2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                                {isOwner ? 'Save Draft' : 'Save Feedback'}
                            </button>
                            {isOwner && (
                                <button className="btn-header-action primary" onClick={handleSendForSignature}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                    Send For Signature
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="details-grid-columns">
                    {/* Left Pane - Main content */}
                    <div className="details-left-pane">
                        {/* 1. Property Showcase Card */}
                        <div className="details-card-box showcase-property">
                            <div className="showcase-thumb-img">
                                <img src={getPropertyImage(currentAgreement.property_title)} alt="Property" />
                            </div>
                            <div className="showcase-content-details">
                                <h2 className="showcase-title">{currentAgreement.property_title || 'Skyline View Penthouse'}</h2>
                                <p className="showcase-address">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                    {currentAgreement.property_address || '742 Evergreen Terrace, New York, NY 10001'}
                                </p>
                                <div className="property-room-badges">
                                    <span className="room-badge">Beds {currentAgreement.property_bedrooms || 3}</span>
                                    <span className="room-badge">Baths {currentAgreement.property_bathrooms || 2.5}</span>
                                    <span className="room-badge">Type Luxury</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Owner & Tenant Profiles */}
                        <div className="profiles-double-grid">
                            {/* Owner */}
                            <div className="details-card-box profile-spec">
                                <span className="profile-role-header">OWNER (LESSOR)</span>
                                <div className="profile-flex-body">
                                    <div className="profile-initials-circle green">
                                        {currentAgreement.owner_name ? currentAgreement.owner_name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'JV'}
                                    </div>
                                    <div className="profile-meta-details">
                                        <h3 className="profile-name-text">{currentAgreement.owner_name || 'Jonathan Vance'}</h3>
                                        <span className="profile-sub-line">{currentAgreement.owner_email || 'vance.holdings@example.com'}</span>
                                        <span className="profile-sub-line">{currentAgreement.owner_phone || '+1 (555) 012-3456'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tenant */}
                            <div className="details-card-box profile-spec">
                                <span className="profile-role-header">TENANT (LESSEE)</span>
                                <div className="profile-flex-body">
                                    <div className="profile-initials-circle blue">
                                        {currentAgreement.tenant_name ? currentAgreement.tenant_name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'SJ'}
                                    </div>
                                    <div className="profile-meta-details">
                                        <h3 className="profile-name-text">{currentAgreement.tenant_name || 'Sarah Jenkins'}</h3>
                                        <span className="profile-sub-line">{currentAgreement.tenant_email || 's.jenkins@example.com'}</span>
                                        <span className="profile-sub-line">{currentAgreement.tenant_phone || '+1 (555) 098-7654'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Terms & Logistics */}
                        <div className="details-card-box lease-terms-logistics">
                            <h2 className="card-inner-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                Terms & Logistics
                            </h2>

                            <div className="logistics-values-grid">
                                <div className="logistic-value-item">
                                    <span className="item-lbl">START DATE</span>
                                    {(isEditable && isOwner) ? (
                                        <input 
                                            type="date" 
                                            value={agreementStartDate} 
                                            onChange={(e) => setAgreementStartDate(e.target.value)} 
                                            className="date-input-field" 
                                        />
                                    ) : (
                                        <span className="item-val font-semibold text-navy">
                                            {agreementStartDate 
                                                ? new Date(agreementStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                                                : 'Flexible'}
                                        </span>
                                    )}
                                </div>
                                <div className="logistic-value-item">
                                    <span className="item-lbl">END DATE</span>
                                    {(isEditable && isOwner) ? (
                                        <input 
                                            type="date" 
                                            value={agreementEndDate} 
                                            onChange={(e) => setAgreementEndDate(e.target.value)} 
                                            className="date-input-field" 
                                        />
                                    ) : (
                                        <span className="item-val font-semibold text-navy">
                                            {agreementEndDate 
                                                ? new Date(agreementEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                                                : 'Flexible'}
                                        </span>
                                    )}
                                </div>
                                <div className="logistic-value-item">
                                    <span className="item-lbl">MOVE-IN DATE</span>
                                    <span className="item-val font-semibold">
                                        {agreementStartDate 
                                            ? new Date(agreementStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                                            : 'Flexible'}
                                    </span>
                                </div>
                                <div className="logistic-value-item">
                                    <span className="item-lbl">DURATION</span>
                                    <span className="item-val font-bold text-navy">{calculateDuration(agreementStartDate, agreementEndDate)}</span>
                                </div>
                            </div>
                        </div>

                        {/* 4. Payment Terms */}
                        <div className="details-card-box lease-payment-terms">
                            <h2 className="card-inner-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                    <line x1="1" y1="10" x2="23" y2="10"></line>
                                </svg>
                                Payment Terms
                            </h2>

                            <div className="payment-terms-values-grid">
                                <div className="pay-term-row flex-item">
                                    <div className="spec-wrap">
                                        <span className="pay-term-lbl">MONTHLY RENT</span>
                                        <div className="pay-bold-val-row">
                                            <span className="val-currency">৳</span>
                                            <span className="val-main-num">
                                                {currentAgreement.monthly_rent ? Number(currentAgreement.monthly_rent).toLocaleString('en-IN') : '25,000'}
                                            </span>
                                            <span className="val-per-month">/ month</span>
                                        </div>
                                    </div>
                                    <div className="spec-wrap">
                                        <span className="pay-term-lbl">SECURITY DEPOSIT</span>
                                        <div className="pay-bold-val-row">
                                            <span className="val-currency">৳</span>
                                            <span className="val-main-num">
                                                {currentAgreement.security_deposit ? Number(currentAgreement.security_deposit).toLocaleString('en-IN') : '50,000'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pay-term-row flex-item">
                                    <div className="spec-wrap">
                                        <span className="pay-term-lbl">DUE DATE</span>
                                        <span className="pay-medium-val">5th of the month</span>
                                    </div>
                                    <div className="spec-wrap">
                                        <span className="pay-term-lbl">PAYMENT METHOD</span>
                                        <span className="pay-medium-val">Bank Transfer</span>
                                    </div>
                                </div>

                                <div className="pay-term-row flex-item">
                                    <div className="spec-wrap">
                                        <span className="pay-term-lbl">DEPOSIT REFUND POLICY</span>
                                        <span className="pay-medium-val text-muted">Refundable within 30 days of move-out inspection.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. Agreement Rules & Custom Rules */}
                        <div className="details-card-box lease-agreement-rules">
                            <h2 className="card-inner-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                Agreement Rules
                            </h2>

                            <div className="rules-section-wrapper">
                                <span className="rules-section-subtitle">STANDARD CLAUSES</span>
                                <div className="standard-clauses-grid">
                                    <div className="standard-clause-badge">
                                        <span className="badge-icon">🚭</span>
                                        <span>No smoking inside the premises at any time.</span>
                                    </div>
                                    <div className="standard-clause-badge">
                                        <span className="badge-icon">🐾</span>
                                        <span>Small pets allowed (additional ৳5,000 security deposit).</span>
                                    </div>
                                </div>

                                <span className="rules-section-subtitle margin-top">CUSTOM RULES</span>
                                <div className="custom-rules-container">
                                    {customRules.length === 0 ? (
                                        <p className="no-rules-text">No custom clauses added to this draft yet.</p>
                                    ) : (
                                        <ul className="custom-rules-list">
                                            {customRules.map((rule, idx) => (
                                                <li key={idx} className="custom-rule-item">
                                                    <span className="rule-bullet">•</span>
                                                    <span className="rule-text">{rule}</span>
                                                    {(isEditable && isOwner) && (
                                                        <button 
                                                            type="button" 
                                                            className="btn-delete-rule" 
                                                            onClick={() => handleRemoveRule(idx)}
                                                            title="Delete clause"
                                                        >
                                                            &times;
                                                        </button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {/* Add rule inline form */}
                                    {(isEditable && isOwner) && (
                                        <form onSubmit={handleAddRule} className="add-custom-clause-inline-form">
                                            <input 
                                                type="text" 
                                                className="clause-text-input" 
                                                placeholder="Write a custom clause (e.g. Quiet hours between 10:00 PM and 7:00 AM)..."
                                                value={newRule}
                                                onChange={(e) => setNewRule(e.target.value)}
                                            />
                                            <button type="submit" className="btn-add-clause">
                                                + Add Clause
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 6. Agreement Feedback */}
                        <div className="details-card-box lease-negotiation-feedback">
                            <h2 className="card-inner-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                Agreement feedback
                            </h2>
                            <div className="feedback-section-body">
                                {(isOwner || !isEditable) ? (
                                    <div className="negotiation-feedback-view-box">
                                        {negotiationNotes ? negotiationNotes : 'No feedback or negotiation notes provided by tenant yet.'}
                                    </div>
                                ) : (
                                    <textarea 
                                        className="negotiation-feedback-textarea" 
                                        rows="4" 
                                        placeholder="Enter notes about recent discussions or pending changes..."
                                        value={negotiationNotes}
                                        onChange={(e) => setNegotiationNotes(e.target.value)}
                                    ></textarea>
                                )}
                                <p className="notes-helper-caption">
                                    Notes are visible to both parties to facilitate transparent negotiation.
                                </p>
                            </div>
                        </div>

                        {/* 7. Final Signatures Section */}
                        {(currentAgreement.status === 'pending_signature' || 
                          currentAgreement.status === 'tenant_signed' || 
                          currentAgreement.status === 'signed') && (
                            <div className="details-card-box lease-final-signatures">
                                {currentAgreement.status === 'signed' && (
                                    <div className="signature-success-banner">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="success-banner-check">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        <span>Agreement Successfully Signed</span>
                                        <button
                                            className="btn-download-pdf"
                                            onClick={handleDownloadPdf}
                                            disabled={isDownloadingPdf}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                <polyline points="7 10 12 15 17 10"></polyline>
                                                <line x1="12" y1="15" x2="12" y2="3"></line>
                                            </svg>
                                            {isDownloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
                                        </button>
                                    </div>
                                )}

                                <h2 className="card-inner-title align-center">Final Lease Signatures</h2>
                                
                                <div className="signatures-flex-container">
                                    {/* Tenant Signature Box */}
                                    <div className={`signature-status-card ${currentAgreement.tenant_signature ? 'signed' : 'pending'}`}>
                                        <span className="sig-role-sub">LESSEE (TENANT)</span>
                                        <h3 className="sig-name-display">{currentAgreement.tenant_name || 'Tenant'}</h3>
                                        
                                        {currentAgreement.tenant_signature ? (
                                            <div className="captured-signature-wrapper">
                                                <img src={currentAgreement.tenant_signature} alt="Tenant Signature" className="captured-sig-image" />
                                                <span className="sig-status-label success">
                                                    ✓ Signed on {new Date(currentAgreement.tenant_signed_at).toLocaleDateString('en-US', { dateStyle: 'medium' })} 
                                                    at {new Date(currentAgreement.tenant_signed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="captured-signature-placeholder">
                                                <div className="sig-pending-icon">✍</div>
                                                <span className="sig-status-label warning">
                                                    {currentAgreement.status === 'pending_signature' && user?.role === 'tenant' 
                                                        ? 'Action Required: Your Signature Needed' 
                                                        : 'Awaiting Tenant Signature'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Owner Signature Box */}
                                    <div className={`signature-status-card ${currentAgreement.owner_signature ? 'signed' : 'pending'}`}>
                                        <span className="sig-role-sub">LESSOR (OWNER)</span>
                                        <h3 className="sig-name-display">{currentAgreement.owner_name || 'Owner'}</h3>
                                        
                                        {currentAgreement.owner_signature ? (
                                            <div className="captured-signature-wrapper">
                                                <img src={currentAgreement.owner_signature} alt="Owner Signature" className="captured-sig-image" />
                                                <span className="sig-status-label success">
                                                    ✓ Signed on {new Date(currentAgreement.owner_signed_at).toLocaleDateString('en-US', { dateStyle: 'medium' })} 
                                                    at {new Date(currentAgreement.owner_signed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="captured-signature-placeholder">
                                                <div className="sig-pending-icon">✍</div>
                                                <span className="sig-status-label">
                                                    {currentAgreement.status === 'tenant_signed' && user?.role === 'owner'
                                                        ? 'Action Required: Your Signature Needed'
                                                        : currentAgreement.status === 'pending_signature'
                                                            ? 'Awaiting Tenant to sign first'
                                                            : 'Awaiting Owner Signature'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Interactive Signing Section for active signer */}
                                {((user?.role === 'tenant' && currentAgreement.status === 'pending_signature') ||
                                  (user?.role === 'owner' && currentAgreement.status === 'tenant_signed')) && (
                                    <div className="interactive-signature-pad-container animate-fade-in">
                                        <div className="signature-pad-header">
                                            <span className="pad-instruction-text">
                                                Please sign below to execute this agreement. You can draw your signature or type it.
                                            </span>
                                            <div className="signature-tabs-buttons">
                                                <button 
                                                    type="button" 
                                                    className={`sig-tab-btn ${activeSigTab === 'draw' ? 'active' : ''}`}
                                                    onClick={() => setActiveSigTab('draw')}
                                                >
                                                    Draw Signature
                                                </button>
                                                <button 
                                                    type="button" 
                                                    className={`sig-tab-btn ${activeSigTab === 'type' ? 'active' : ''}`}
                                                    onClick={() => setActiveSigTab('type')}
                                                >
                                                    Type Signature
                                                </button>
                                            </div>
                                        </div>

                                        <div className="signature-tab-content">
                                            {activeSigTab === 'draw' ? (
                                                <div className="draw-signature-canvas-container">
                                                    <SignatureCanvas 
                                                        ref={sigPadRef}
                                                        penColor="#0b2540"
                                                        canvasProps={{
                                                            className: "signature-canvas-pad",
                                                            width: 600,
                                                            height: 180
                                                        }}
                                                    />
                                                    <button 
                                                        type="button" 
                                                        className="btn-sig-clear-pad"
                                                        onClick={() => sigPadRef.current?.clear()}
                                                    >
                                                        Clear Canvas
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="type-signature-input-container">
                                                    <input 
                                                        type="text"
                                                        className="typed-signature-text-input"
                                                        placeholder="Type your full name here..."
                                                        value={typedName}
                                                        onChange={(e) => setTypedName(e.target.value)}
                                                        maxLength={40}
                                                    />
                                                    <div className="typed-signature-live-preview-box">
                                                        <span className="preview-label-tag">Live Stylized Signature Preview:</span>
                                                        <div className="signature-type-preview-font">
                                                            {typedName.trim() || 'Your Signature'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="signature-submit-action-box">
                                            <button 
                                                type="button"
                                                className="btn-submit-signature"
                                                onClick={handleSignAgreement}
                                                disabled={isSigning}
                                            >
                                                {isSigning ? (
                                                    <>
                                                        <span className="btn-spinner-loader"></span>
                                                        Securing Agreement...
                                                    </>
                                                ) : (
                                                    user?.role === 'tenant' ? 'Sign Agreement' : 'Finalize Agreement'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Pane - Sidebar widgets */}
                    <div className="details-right-pane">

                        {/* Activity Timeline widget */}
                        <div className="details-card-box right-widget-card">
                            <h3 className="widget-title margin-bottom">ACTIVITY TIMELINE</h3>
                            <div className="agreement-activity-timeline">
                                {getTimeline().map((item, idx) => (
                                    <div key={idx} className={`activity-timeline-item ${item.active ? 'active' : ''} ${item.checked ? 'completed' : 'pending'}`}>
                                        <div className={`timeline-dot-indicator ${item.checked ? 'checked' : ''}`}>
                                            {item.checked ? '✓' : '•'}
                                        </div>
                                        <div className="timeline-info-details">
                                            <span className="activity-title-text">{item.title}</span>
                                            <span className="activity-timestamp text-muted">{item.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="widget-btn-action outline" onClick={() => toast.success('Timeline history is up-to-date.')}>
                                View Full History
                            </button>
                        </div>

                        {/* Agreement Details summary widget */}
                        <div className="details-card-box right-widget-card border-only">
                            <h3 className="widget-title margin-bottom">AGREEMENT DETAILS</h3>
                            <div className="summary-specs-list-col">
                                <div className="summary-spec-row-flex">
                                    <span className="spec-lbl-name">Template</span>
                                    <span className="spec-val-desc font-bold">{currentAgreement.template_name || 'Standard Residential'}</span>
                                </div>
                                <div className="summary-spec-row-flex">
                                    <span className="spec-lbl-name">ID</span>
                                    <span className="spec-val-desc inline-badge">{docId}</span>
                                </div>
                                <div className="summary-spec-row-flex">
                                    <span className="spec-lbl-name">Version</span>
                                    <span className="spec-val-desc font-medium">
                                        {currentAgreement.draft_version ? `${currentAgreement.draft_version} (Active Draft)` : '2.1 (Active Draft)'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom action bar */}
            <div className="agreement-details-bottom-fixed-bar">
                <div className="fixed-bar-left-info">
                    <span className="review-badge-indicator">Review Mode</span>
                    <span className="review-meta-text">Auto-saved 2m ago • Lessor: {currentAgreement.owner_name || 'Jonathan Vance'}</span>
                </div>
                <div className="fixed-bar-right-buttons">
                    <button className="btn-bottom-bar outline" onClick={() => onNavigate('agreements')}>
                        {isEditable ? 'Cancel' : 'Back to List'}
                    </button>
                    {isEditable && (
                        isOwner ? (
                            <button className="btn-bottom-bar primary" onClick={handleSendForSignature}>
                                Send Final Agreement
                            </button>
                        ) : (
                            <button className="btn-bottom-bar primary" onClick={handleSaveDraft}>
                                Save Feedback
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgreementDetails;
