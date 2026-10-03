import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import ScheduleVisitModal from '../../schedule/components/ScheduleVisitModal';
import './PropertyDetails.css';
import { useProperties } from '../hooks/useProperties';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import { useChat } from '../../chat/hooks/useChat';
import { useStayRequests } from '../../stayRequest/hook/useStayRequests';
import toast from 'react-hot-toast';
import VideoWalkthrough from '../components/VideoWalkthrough';
import InteractiveWalkthrough from '../components/InteractiveWalkthrough';

const AMENITY_ICONS = {
    wifi:             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
    parking:          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>,
    air_conditioning: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 16l-2 4"/><path d="M16 16l2 4"/><path d="M12 16v4"/><path d="M2 8h20"/><path d="M2 16h20"/><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>,
    furnished:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><path d="M4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><line x1="2" y1="11" x2="22" y2="11"/></svg>,
    gym:              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 10v4"/><path d="M18 10v4"/><path d="M2.5 12h19"/><path d="M2 8v8"/><path d="M22 8v8"/></svg>,
    laundry:          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="12" cy="13" r="5"/><line x1="12" y1="6" x2="12.01" y2="6"/></svg>,
    security:         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    lift:             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2" ry="2"/><path d="M12 7v10"/><polyline points="9 10 12 7 15 10"/><polyline points="9 14 12 17 15 14"/></svg>,
    generator:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    balcony:          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8"/><rect x="2" y="14" width="20" height="6" rx="1"/><line x1="6" y1="14" x2="6" y2="20"/><line x1="10" y1="14" x2="10" y2="20"/><line x1="14" y1="14" x2="14" y2="20"/><line x1="18" y1="14" x2="18" y2="20"/></svg>,
};

const calculateRemainingTime = (endDateStr) => {
    if (!endDateStr) return 'No end date';
    const end = new Date(endDateStr);
    const now = new Date();
    // Normalize dates to remove time part for accurate days comparison
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffTime = end - now;
    if (diffTime <= 0) return 'Agreement Expired';
    
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

const PropertyDetails = ({ onNavigate, isLoggedIn, user, propertyId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [property, setProperty] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageZoom, setImageZoom] = useState(1);
    const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
    const [isPanningImage, setIsPanningImage] = useState(false);
    const imageDragStart = useRef(null);
    const { getPropertyById } = useProperties();
    const { startConversation } = useChat();
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    // Stay request state and hook
    const [isStayModalOpen, setIsStayModalOpen] = useState(false);
    const [fullName, setFullName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [moveInDate, setMoveInDate] = useState('');
    const [message, setMessage] = useState("Hello! I'm visiting and would love to stay at your property...");
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { createRequest } = useStayRequests();

    useEffect(() => {
        if (user) {
            setFullName(user.name || '');
            setEmail(user.email || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    useEffect(() => {
        if (!propertyId) { setLoadingDetail(false); return; }
        getPropertyById(propertyId)
            .then(data => setProperty(data.property || data))
            .catch(console.error)
            .finally(() => setLoadingDetail(false));
    }, [propertyId]);

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                setSelectedImage(null);
            }
        };

        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    useEffect(() => {
        setImageZoom(1);
        setImagePan({ x: 0, y: 0 });
        setIsPanningImage(false);
    }, [selectedImage]);

    const openImageLightbox = (imageUrl) => {
        setSelectedImage(imageUrl);
    };

    const handleImageWheel = (event) => {
        event.preventDefault();
        setImageZoom((currentZoom) => {
            const nextZoom = currentZoom + (event.deltaY < 0 ? 0.2 : -0.2);
            return Math.min(4, Math.max(1, Number(nextZoom.toFixed(2))));
        });
    };

    const handleImagePointerDown = (event) => {
        if (imageZoom <= 1) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        imageDragStart.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            panX: imagePan.x,
            panY: imagePan.y
        };
        setIsPanningImage(true);
    };

    const handleImagePointerMove = (event) => {
        if (!imageDragStart.current) return;
        const drag = imageDragStart.current;
        setImagePan({
            x: drag.panX + event.clientX - drag.x,
            y: drag.panY + event.clientY - drag.y
        });
    };

    const stopImagePanning = (event) => {
        if (imageDragStart.current?.pointerId === event.pointerId) {
            imageDragStart.current = null;
            setIsPanningImage(false);
        }
    };

    const handleChatNow = async () => {
        if (!isLoggedIn) {
            onNavigate('login');
            return;
        }
        if (!property || !property.owner_id) return;
        try {
            await startConversation(property.id, property.owner_id);
            onNavigate('tenant-messages');
        } catch (err) {
            console.error('Failed to start conversation:', err);
        }
    };

    const handleStayRequestClick = () => {
        if (!isLoggedIn) {
            onNavigate('login');
            return;
        }
        setIsStayModalOpen(true);
    };

    const handleScheduleVisitClick = () => {
        if (!isLoggedIn) {
            onNavigate('login');
            return;
        }
        setIsModalOpen(true);
    };

    const handleStayRequestSubmit = async (e) => {
        e.preventDefault();
        if (!property || !property.id || !property.owner_id) return;

        setSubmitting(true);
        try {
            await createRequest({
                propertyId: property.id,
                ownerId: property.owner_id,
                message,
                moveInDate
            });
            toast.success('Stay request submitted successfully!', {
                duration: 4000,
                icon: '🚀'
            });
            setIsStayModalOpen(false);
            setMoveInDate('');
            setMessage('');
            setTimeout(() => {
                onNavigate('tenant-requests');
            }, 1000);
        } catch (err) {
            toast.error(err.message || 'Failed to submit stay request.');
        } finally {
            setSubmitting(false);
        }
    };

    const heroImage = property?.images?.[0]?.image_url
        || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

    return (
        <div className="property-details-page">
            {selectedImage && (
                <div className="image-lightbox" onClick={() => setSelectedImage(null)} role="dialog" aria-modal="true">
                    <button
                        type="button"
                        className="image-lightbox-close"
                        onClick={(event) => {
                            event.stopPropagation();
                            setSelectedImage(null);
                        }}
                        aria-label="Close image view"
                    >
                        ×
                    </button>
                    <img
                        src={selectedImage}
                        alt="Property preview"
                        className={`image-lightbox-content ${isPanningImage ? 'is-panning' : ''}`}
                        style={{ transform: `translate(${imagePan.x}px, ${imagePan.y}px) scale(${imageZoom})` }}
                        onWheel={handleImageWheel}
                        onPointerDown={handleImagePointerDown}
                        onPointerMove={handleImagePointerMove}
                        onPointerUp={stopImagePanning}
                        onPointerCancel={stopImagePanning}
                        onClick={(event) => event.stopPropagation()}
                    />
                </div>
            )}

            <Navbar onNavigate={onNavigate} isLoggedIn={isLoggedIn} user={user} activeTab="properties" />
            
            <div className="details-container">
                <div className="breadcrumbs">
                    <span className="breadcrumb-link" onClick={() => onNavigate('browse')}>Browse Properties</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    <span className="breadcrumb-current">{property?.title || 'Property Details'}</span>
                </div>

                {loadingDetail ? (
                    <div style={{ padding: '80px', textAlign: 'center', color: '#64748b', fontSize: '16px' }}>Loading property...</div>
                ) : (
                <div className="details-grid">
                    {/* LEFT COLUMN */}
                    <div className="details-main">
                        <div className="hero-section">
                            <img
                                src={heroImage}
                                alt={property?.title}
                                className="hero-image clickable-image"
                                onClick={() => openImageLightbox(heroImage)}
                            />
                            <div className="hero-overlay">
                                <h1>{property?.title || 'Property Details'}</h1>
                                <p className="hero-address">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    {property?.address}
                                </p>
                                <div className="hero-stats">
                                    <div className="hero-stat-card">
                                        <div className="stat-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                        </div>
                                        <div className="stat-text">
                                            <span className="stat-label">BEDROOMS</span>
                                            <span className="stat-value">{property?.total_bedrooms ?? '—'} Beds</span>
                                        </div>
                                    </div>
                                    <div className="hero-stat-card">
                                        <div className="stat-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                                        </div>
                                        <div className="stat-text">
                                            <span className="stat-label">BATHROOMS</span>
                                            <span className="stat-value">{property?.total_bathrooms ?? '—'} Baths</span>
                                        </div>
                                    </div>
                                    {property?.property_size_sqft && (
                                        <div className="hero-stat-card">
                                            <div className="stat-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 4 12 12 12 13 6 3 6"/><path d="M21 21v-8a2 2 0 0 0-2-2h-3"/><path d="M8 21v-4"/><path d="M16 21v-4"/></svg>
                                            </div>
                                            <div className="stat-text">
                                                <span className="stat-label">AREA</span>
                                                <span className="stat-value">{property.property_size_sqft} sqft</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <InteractiveWalkthrough
                            images={property?.images || []}
                            propertyTitle={property?.title || 'Property'}
                        />

                        <VideoWalkthrough
                            walkthrough={property?.walkthrough}
                            propertyTitle={property?.title || 'Property'}
                        />

                        {property?.tenant_details && (
                            <div className="content-section occupancy-details-section" style={{ border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                    Active Tenant & Agreement Details
                                </h2>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' }}>
                                    {/* Tenant Info */}
                                    <div style={{ backgroundColor: 'var(--color-background-offwhite)', padding: '20px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            Tenant Contact Info
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', fontWeight: '600' }}>FULL NAME</span>
                                                <span style={{ fontSize: '15px', color: 'var(--color-text-main)', fontWeight: '600' }}>{property.tenant_details.name}</span>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', fontWeight: '600' }}>EMAIL ADDRESS</span>
                                                <span style={{ fontSize: '14px', color: 'var(--color-text-main)', fontWeight: '500' }}>{property.tenant_details.email}</span>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', fontWeight: '600' }}>PHONE NUMBER</span>
                                                <span style={{ fontSize: '14px', color: 'var(--color-text-main)', fontWeight: '500' }}>{property.tenant_details.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Agreement Info */}
                                    <div style={{ backgroundColor: 'var(--color-background-offwhite)', padding: '20px', borderRadius: '10px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <div>
                                            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-main)' }}>
                                                Agreement Details
                                            </h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                                                <div>
                                                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', fontWeight: '600' }}>REMAINING TIME</span>
                                                    <span style={{ fontSize: '18px', color: '#dc2626', fontWeight: '700' }}>
                                                        {calculateRemainingTime(property.agreement_end_date)}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '20px' }}>
                                                    <div>
                                                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', fontWeight: '600' }}>START DATE</span>
                                                        <span style={{ fontSize: '13px', color: 'var(--color-text-main)', fontWeight: '500' }}>
                                                            {new Date(property.agreement_start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', fontWeight: '600' }}>END DATE</span>
                                                        <span style={{ fontSize: '13px', color: 'var(--color-text-main)', fontWeight: '500' }}>
                                                            {new Date(property.agreement_end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {property.agreement_id && (
                                            <button 
                                                onClick={() => onNavigate('agreement-details', property.agreement_id)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    backgroundColor: 'var(--color-primary)',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    transition: 'opacity 0.2s',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                                                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                                View Agreement Document
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Tenant NID Previews */}
                                <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="4"/><line x1="8" y1="2" x2="8" y2="4"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                        Tenant NID (National ID Card)
                                    </h3>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>NID FRONT IMAGE</span>
                                            {property.tenant_details.nid_front_url ? (
                                                <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', height: '180px', backgroundColor: 'var(--color-background-offwhite)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <a href={property.tenant_details.nid_front_url} target="_blank" rel="noopener noreferrer" style={{ width: '100%', height: '100%', display: 'block' }}>
                                                        <img 
                                                            src={property.tenant_details.nid_front_url} 
                                                            alt="NID Front" 
                                                            style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.2s' }}
                                                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                        />
                                                    </a>
                                                </div>
                                            ) : (
                                                <div style={{ border: '1px dashed var(--color-border)', borderRadius: '8px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-light)', fontSize: '13px' }}>
                                                    No front image uploaded
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>NID BACK IMAGE</span>
                                            {property.tenant_details.nid_back_url ? (
                                                <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', height: '180px', backgroundColor: 'var(--color-background-offwhite)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <a href={property.tenant_details.nid_back_url} target="_blank" rel="noopener noreferrer" style={{ width: '100%', height: '100%', display: 'block' }}>
                                                        <img 
                                                            src={property.tenant_details.nid_back_url} 
                                                            alt="NID Back" 
                                                            style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.2s' }}
                                                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                        />
                                                    </a>
                                                </div>
                                            ) : (
                                                <div style={{ border: '1px dashed var(--color-border)', borderRadius: '8px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-light)', fontSize: '13px' }}>
                                                    No back image uploaded
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="content-section">
                            <h2>Description</h2>
                            <p>{property?.description || 'No description provided.'}</p>
                        </div>

                        {property?.amenities?.length > 0 && (
                            <div className="content-section">
                                <h2>Amenities</h2>
                                <div className="amenities-grid">
                                    {property.amenities.map(a => (
                                        <div className="amenity-item" key={a.id}>
                                            {AMENITY_ICONS[a.name.toLowerCase()] || <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>}
                                            {a.name.charAt(0).toUpperCase() + a.name.slice(1).replace(/_/g, ' ')}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="content-section">
                            <h2>Location</h2>
                            <p style={{ color: '#64748b', marginBottom: '8px' }}>{[property?.area, property?.district, property?.division].filter(Boolean).join(', ')}</p>
                            <div className="map-placeholder" style={{ height: '320px', borderRadius: '12px', overflow: 'hidden' }}>
                                {isLoaded && property?.latitude && property?.longitude ? (
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                        center={{ lat: Number(property.latitude), lng: Number(property.longitude) }}
                                        zoom={15}
                                        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
                                    >
                                        <Marker position={{ lat: Number(property.latitude), lng: Number(property.longitude) }} />
                                    </GoogleMap>
                                ) : (
                                    <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Map View" className="map-image" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="details-sidebar">
                        <div className="sticky-sidebar">
                            <div className="pricing-card">
                                <div className="occupancy-badge-container" style={{ marginBottom: '16px' }}>
                                    {property?.is_occupied ? (
                                        <span className="badge-occupied" style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            backgroundColor: '#fee2e2',
                                            color: '#991b1b',
                                            border: '1px solid #fca5a5'
                                        }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                                            Property is Occupied
                                        </span>
                                    ) : (
                                        <span className="badge-vacant" style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            backgroundColor: '#d1fae5',
                                            color: '#065f46',
                                            border: '1px solid #6ee7b7'
                                        }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                                            Property is Vacant
                                        </span>
                                    )}
                                </div>
                                <span className="monthly-label">MONTHLY RENT</span>
                                <div className="price-display">
                                    <span className="price">৳{property?.monthly_rent?.toLocaleString() || '—'}</span>
                                    <span className="period">/mo</span>
                                </div>
                                {property?.available_from && (
                                    <div className="available-date-display" style={{ marginTop: '-12px', marginBottom: '20px', fontSize: '13px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                        <span>Available from: <strong>{new Date(property.available_from).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
                                    </div>
                                )}
                                {property?.owner_name && (
                                    <div className="owner-info-details" style={{ margin: '12px 0 16px 0', padding: '12px', borderRadius: '8px', border: '1px dashed var(--color-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className="owner-avatar-circle" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                            {property.owner_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--color-text-light)', fontWeight: '500' }}>PROPERTY OWNER</div>
                                            <div style={{ fontSize: '14px', color: 'var(--color-text-main)', fontWeight: '700' }}>{property.owner_name}</div>
                                        </div>
                                    </div>
                                )}
                                {(!isLoggedIn || (user?.role !== 'owner' && user?.id !== property?.owner_id)) && (
                                    <button 
                                        className="btn-primary-full" 
                                        onClick={handleScheduleVisitClick}
                                        disabled={property?.is_occupied}
                                        style={property?.is_occupied ? { backgroundColor: '#cbd5e1', cursor: 'not-allowed', color: '#64748b' } : {}}
                                    >
                                        Schedule Visit
                                    </button>
                                )}
                                
                                {(!isLoggedIn || (user?.role !== 'owner' && user?.id !== property?.owner_id)) && (
                                    <button 
                                        className="btn-primary-full btn-stay-request" 
                                        onClick={handleStayRequestClick}
                                        disabled={property?.is_occupied}
                                        style={{ 
                                            backgroundColor: property?.is_occupied ? '#cbd5e1' : '#10b981', 
                                            border: 'none', 
                                            color: property?.is_occupied ? '#64748b' : '#ffffff', 
                                            cursor: property?.is_occupied ? 'not-allowed' : 'pointer',
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '8px' 
                                        }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                            <polyline points="9 22 9 12 15 12 15 22"/>
                                        </svg>
                                        Request to Lease
                                    </button>
                                )}

                                {(!isLoggedIn || (user?.role !== 'owner' && user?.id !== property?.owner_id)) && (
                                    <button className="btn-outline-full" onClick={handleChatNow}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                        Chat Now
                                    </button>
                                )}
                                {(!isLoggedIn || (user?.role !== 'owner' && user?.id !== property?.owner_id)) && (
                                    <p className="response-time">Typical response time: under 2 hours</p>
                                )}
                            </div>

                            <div className="info-banner">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                <p>Demand is high for this area. 4 other people have <strong>viewed this</strong> property in the last 24 hours.</p>
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>

            <footer className="page-footer">
                <div className="footer-content">
                    <div className="footer-left">
                        <span className="footer-brand font-semibold">Housy</span>
                        <p className="copyright">© 2026 Housy. All Rights Reserved.</p>
                    </div>
                    <div className="footer-links">
                        <a href="#privacy">Privacy Policy</a>
                        <a href="#terms">Terms of Service</a>
                        <a href="#support">Support</a>
                    </div>
                </div>
            </footer>
            
            <ScheduleVisitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} property={property} />
            
            {/* Stay Request Modal */}
            {isStayModalOpen && (
                <div className="stay-modal-overlay" onClick={() => setIsStayModalOpen(false)}>
                    <div className="stay-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="stay-modal-header">
                            <h3>Confirm Your Stay</h3>
                            <button className="stay-modal-close" onClick={() => setIsStayModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleStayRequestSubmit}>
                            <div className="stay-modal-columns">
                                {/* LEFT COLUMN */}
                                <div className="stay-modal-col-left">
                                    <h4 className="column-label">Stay Summary</h4>
                                    <div className="stay-property-summary-card">
                                        <img
                                            src={heroImage}
                                            alt={property?.title}
                                            className="summary-thumb clickable-image"
                                            onClick={() => openImageLightbox(heroImage)}
                                        />
                                        <div className="summary-details">
                                            <h5 className="summary-title">{property?.title}</h5>
                                            <p className="summary-address">{property?.address || '124 Financial District, North Tower'}</p>
                                            <div className="summary-rating">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#EAB308" stroke="#EAB308" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginLeft: '4px' }}>4.8 (24 reviews)</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="price-breakdown-section">
                                        <h5 className="section-subtitle">Price Breakdown</h5>
                                        <div className="price-row">
                                            <span className="price-label-text">Monthly Rent</span>
                                            <span className="price-value-text">৳{property?.monthly_rent?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}</span>
                                        </div>
                                        <div className="price-row">
                                            <span className="price-label-text">Security Deposit</span>
                                            <span className="price-value-text">৳{(Number(property?.expected_security_deposit) || (Number(property?.monthly_rent) * 0.5))?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}</span>
                                        </div>
                                        <div className="price-divider"></div>
                                        <div className="price-row total">
                                            <span className="total-label-text">Total (BDT)</span>
                                            <span className="total-value-text">৳{(Number(property?.monthly_rent) + (Number(property?.expected_security_deposit) || (Number(property?.monthly_rent) * 0.5)))?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="protection-card">
                                        <div className="protection-header">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                            <span className="protection-title">Housy Protection</span>
                                        </div>
                                        <p className="protection-text">Your payment is held securely and only released to the owner 24 hours after you check-in.</p>
                                    </div>
                                </div>
                                
                                {/* RIGHT COLUMN */}
                                <div className="stay-modal-col-right">
                                    <h4 className="column-label">Personal Details</h4>
                                    
                                    <div className="form-row-2">
                                        <div className="form-group">
                                            <label htmlFor="fullName">Full Name</label>
                                            <input 
                                                type="text" 
                                                id="fullName" 
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="email">Email Address</label>
                                            <input 
                                                type="email" 
                                                id="email" 
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="form-row-2">
                                        <div className="form-group">
                                            <label htmlFor="phone">Phone Number</label>
                                            <input 
                                                type="text" 
                                                id="phone" 
                                                placeholder="+1 (555) 012-3456"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="moveInDate">Move in Date</label>
                                            <input 
                                                type="date" 
                                                id="moveInDate" 
                                                value={moveInDate}
                                                onChange={e => setMoveInDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="message">Message to Owner</label>
                                        <span className="form-label-hint">Introduce yourself and share the purpose of your trip for a faster approval.</span>
                                        <textarea 
                                            id="message" 
                                            rows="4" 
                                            placeholder="Hello! I'm visited you property  and would love to stay at your property..."
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="checkbox-agreement">
                                        <input 
                                            type="checkbox" 
                                            id="agreeCheckbox" 
                                            checked={agreed}
                                            onChange={e => setAgreed(e.target.checked)}
                                            required
                                        />
                                        <label htmlFor="agreeCheckbox">
                                            I agree to the <a href="#rules" onClick={e => e.preventDefault()}>House Rules</a> and Housy's <a href="#terms" onClick={e => e.preventDefault()}>Terms of Service</a>.
                                        </label>
                                    </div>
                                    
                                    <button type="submit" className="btn-send-stay-request" disabled={submitting || !agreed}>
                                        {submitting ? 'Sending Request...' : 'Send Stay Request ▷'}
                                    </button>
                                    
                                    <p className="request-disclaimer">
                                        You won't be charged yet. The owner has 24 hours to accept your request before it expires.
                                    </p>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyDetails;
