import React from 'react';
import './PropertyCard.css';

const PropertyCard = ({ property, onNavigate }) => {
    return (
        <div className="property-card" onClick={() => onNavigate && onNavigate('details', property.id)} style={{ cursor: 'pointer' }}>
            <div className="card-image-wrapper">
                <img src={property.imageUrl} alt={property.title} className="card-image" />
                <div className="card-badges">
                    {property.badges && property.badges.map((badge, idx) => (
                        <span 
                            key={idx} 
                            className="badge" 
                            style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                            {badge.text}
                        </span>
                    ))}
                </div>
                <button className="btn-favorite" aria-label="Add to favorites">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>
            
            <div className="card-content">
                <div className="card-header">
                    <h3 className="card-title">{property.title}</h3>
                    <div className="card-price">
                        <span className="price-amount">{property.price}</span>
                        <span className="price-period">/mo</span>
                    </div>
                </div>
                
                <p className="card-address">{property.address}</p>
                <p className="card-description">{property.description}</p>
                
                <div className="card-divider"></div>
                
                <div className="card-footer">
                    {property.isStudio ? (
                        <div className="card-stat">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8l-6-6z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/></svg>
                            <span>Studio</span>
                        </div>
                    ) : (
                        <div className="card-stat">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                            <span>{property.beds} Beds</span>
                        </div>
                    )}
                    
                    <div className="card-stat">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                        <span>{property.baths} Baths</span>
                    </div>
                    
                    <div className="card-stat">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 4 12 12 12 13 6 3 6"/><path d="M21 21v-8a2 2 0 0 0-2-2h-3"/><path d="M8 21v-4"/><path d="M16 21v-4"/></svg>
                        <span>{property.sqft} sqft</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyCard;
