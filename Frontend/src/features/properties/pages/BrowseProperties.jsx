import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import PropertyFilters from '../components/PropertyFilters';
import PropertyGrid from '../components/PropertyGrid';
import { useProperties } from '../hooks/useProperties';
import './BrowseProperties.css';

const BrowseProperties = ({ onNavigate, isLoggedIn, user }) => {
    const { properties, loading, fetchAllProperties, amenities, fetchAmenities } = useProperties();
    const [filters, setFilters] = useState({
        search: '',
        minPrice: '',
        maxPrice: '',
        propertyTypes: [],
        bedrooms: 'Any',
        bathrooms: 'Any',
        amenities: [],
        availableFrom: '',
        sortBy: 'Newest First'
    });

    const handleApplyFilters = useCallback((newFilters) => {
        setFilters(prev => {
            const updated = { ...prev, ...newFilters };
            fetchAllProperties(updated);
            return updated;
        });
    }, [fetchAllProperties]);

    const handleSearchSort = useCallback((searchOrSortParams) => {
        setFilters(prev => {
            const updated = { ...prev, ...searchOrSortParams };
            fetchAllProperties(updated);
            return updated;
        });
    }, [fetchAllProperties]);

    useEffect(() => {
        fetchAllProperties(filters);
        fetchAmenities();
    }, [fetchAllProperties, fetchAmenities]);

    return (
        <div className="browse-properties-page">
            <Navbar onNavigate={onNavigate} isLoggedIn={isLoggedIn} user={user} activeTab="properties" />
            <div className="browse-content-wrapper">
                <PropertyFilters initialFilters={filters} onApply={handleApplyFilters} dbAmenities={amenities} />
                <PropertyGrid 
                    onNavigate={onNavigate} 
                    properties={properties} 
                    loading={loading} 
                    filters={filters}
                    onSearchSort={handleSearchSort}
                />
            </div>
            
            <footer className="page-footer">
                <div className="footer-content">
                    <div className="footer-left">
                        <span className="footer-brand font-semibold">Housy</span>
                        <p className="copyright">© 2026 Housy. All rights reserved.</p>
                    </div>
                    <div className="footer-links">
                        <a href="#contact">Contact Us</a>
                        <a href="#privacy">Privacy Policy</a>
                        <a href="#terms">Terms of Service</a>
                        <a href="#help">Help Center</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default BrowseProperties;
