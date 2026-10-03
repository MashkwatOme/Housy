import React from 'react';
import './PropertyTable.css';

const PropertyTable = ({ properties = [], onView, onEdit, onDelete }) => {
    return (
        <div className="table-container">
            <table className="property-table">
                <thead>
                    <tr>
                        <th>PROPERTY</th>
                        <th>STATUS</th>
                        <th>RENT</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    {properties.length > 0 ? properties.map(property => (
                        <tr key={property.id}>
                            <td>
                                <div className="property-info-cell">
                                    {property.cover_image ? (
                                        <img 
                                            src={property.cover_image} 
                                            alt={property.title} 
                                            className="property-thumb" 
                                        />
                                    ) : (
                                        <div className="property-thumb-placeholder">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                        </div>
                                    )}
                                    <div className="property-text">
                                        <div className="property-name">{property.title}</div>
                                        <div className="property-loc">{property.address || property.area || property.district}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span className={`status-pill ${property.visibility_status === 'active' ? 'occupied' : 'vacant'}`}>
                                    {property.visibility_status === 'active' ? 'Active' : 'Hidden'}
                                </span>
                            </td>
                            <td>
                                <div className="property-rent">
                                    <span className="rent-amount">৳{property.monthly_rent?.toLocaleString()}</span>
                                    <span className="rent-period">/mo</span>
                                </div>
                            </td>
                            <td>
                                <div className="action-buttons">
                                    <button className="btn-action view" title="View Property" onClick={() => onView && onView(property.id)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    </button>
                                    <button className="btn-action edit" title="Edit Property" onClick={() => onEdit && onEdit(property.id)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    <button className="btn-action delete" title="Delete Property" onClick={() => onDelete && onDelete(property.id)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="4" className="empty-row">No properties found. List your first property today!</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PropertyTable;
