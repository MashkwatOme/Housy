import React from 'react';
import './OwnerPropertyGrid.css';

const OwnerPropertyGrid = ({ properties = [], onView, onEdit, onDelete }) => {
    return (
        <div className="owner-property-grid">
            {properties.length > 0 ? properties.map(property => (
                <div key={property.id} className="owner-property-card">
                    <div className="owner-card-image-wrapper">
                        {property.cover_image ? (
                            <img 
                                src={property.cover_image} 
                                alt={property.title} 
                                className="owner-card-image" 
                            />
                        ) : (
                            <div className="owner-card-image-placeholder">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            </div>
                        )}
                        <span className={`owner-status-pill ${property.visibility_status === 'active' ? 'status-active' : 'status-hidden'}`}>
                            {property.visibility_status === 'active' ? 'Active' : 'Hidden'}
                        </span>
                    </div>

                    <div className="owner-card-content">
                        <div className="owner-card-header">
                            <h3 className="owner-card-title">{property.title}</h3>
                            <div className="owner-card-price">
                                <span className="owner-price-amount">৳{property.monthly_rent?.toLocaleString()}</span>
                                <span className="owner-price-period">/mo</span>
                            </div>
                        </div>

                        <p className="owner-card-address">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <span>{property.address || property.area || property.district}</span>
                        </p>

                        <div className="owner-card-stats">
                            <div className="owner-card-stat">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                <span>{property.total_bedrooms || 0} Beds</span>
                            </div>
                            <div className="owner-card-stat">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                                <span>{property.total_bathrooms || 0} Baths</span>
                            </div>
                            {property.property_size_sqft && (
                                <div className="owner-card-stat">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 4 12 12 12 13 6 3 6"/><path d="M21 21v-8a2 2 0 0 0-2-2h-3"/><path d="M8 21v-4"/><path d="M16 21v-4"/></svg>
                                    <span>{property.property_size_sqft} sqft</span>
                                </div>
                            )}
                        </div>

                        <div className="owner-card-divider"></div>

                        <div className="owner-card-actions">
                            <button className="owner-btn-action view" title="View Property" onClick={() => onView && onView(property.id)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                View
                            </button>
                            <button className="owner-btn-action edit" title="Edit Property" onClick={() => onEdit && onEdit(property.id)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                Edit
                            </button>
                            <button className="owner-btn-action delete" title="Delete Property" onClick={() => onDelete && onDelete(property.id)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="owner-grid-empty">
                    No properties found. List your first property today!
                </div>
            )}
        </div>
    );
};

export default OwnerPropertyGrid;
