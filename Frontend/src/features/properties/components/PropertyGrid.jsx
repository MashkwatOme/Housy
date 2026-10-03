import React, { useState, useEffect } from 'react';
import PropertyCard from './PropertyCard';
import './PropertyGrid.css';

const PropertyGrid = ({ onNavigate, properties = [], loading = false, filters = {}, onSearchSort }) => {
    const [searchVal, setSearchVal] = useState(filters.search || '');

    useEffect(() => {
        setSearchVal(filters.search || '');
    }, [filters.search]);

    const handleSearchClick = () => {
        if (onSearchSort) {
            onSearchSort({ search: searchVal });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearchClick();
        }
    };

    const handleSortChange = (e) => {
        if (onSearchSort) {
            onSearchSort({ sortBy: e.target.value });
        }
    };

    return (
        <main className="property-grid-area">
            <div className="search-sort-bar">
                <div className="search-container">
                    <div className="search-input-wrapper">
                        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input 
                            type="text" 
                            placeholder="Search properties..." 
                            className="main-search-input" 
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <button className="btn-search" onClick={handleSearchClick}>Search</button>
                    <button className="btn-ai" onClick={() => onNavigate('aisearch')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        Search with AI
                    </button>
                </div>
                
                <div className="sort-container">
                    <span className="sort-label">Sort by:</span>
                    <select className="sort-select" value={filters.sortBy || 'Newest First'} onChange={handleSortChange}>
                        <option value="Newest First">Newest First</option>
                        <option value="Price (Low to High)">Price (Low to High)</option>
                        <option value="Price (High to Low)">Price (High to Low)</option>
                    </select>
                </div>
            </div>

            <div className="properties-container">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', width: '100%', color: '#64748b' }}>Loading properties...</div>
                ) : properties.length > 0 ? (
                    properties.map(prop => {
                        // Transform DB property to fit PropertyCard mock props mapping
                        const formattedProp = {
                            id: prop.id,
                            title: prop.title,
                            price: `৳${prop.monthly_rent?.toLocaleString()}`,
                            address: prop.address || prop.district,
                            description: prop.description,
                            beds: prop.total_bedrooms,
                            baths: prop.total_bathrooms,
                            sqft: prop.property_size_sqft || null,
                            imageUrl: prop.cover_image || 'https://via.placeholder.com/800x500?text=No+Image',
                            badges: []
                        };
                        return <PropertyCard key={prop.id} property={formattedProp} onNavigate={onNavigate} />
                    })
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', width: '100%', color: '#64748b' }}>No active properties found.</div>
                )}
            </div>
        </main>
    );
};

export default PropertyGrid;
