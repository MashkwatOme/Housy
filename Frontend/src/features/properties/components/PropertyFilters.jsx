import React, { useState, useEffect } from 'react';
import './PropertyFilters.css';

const PropertyFilters = ({ initialFilters = {}, onApply, dbAmenities = [] }) => {
    const formatAmenityName = (name) => {
        if (name.toLowerCase() === 'wifi') return 'Wi-Fi';
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };
    const [minPrice, setMinPrice] = useState(initialFilters.minPrice && initialFilters.minPrice !== '' ? Number(initialFilters.minPrice) : 1200);
    const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice && initialFilters.maxPrice !== '' ? Number(initialFilters.maxPrice) : 50000);
    const [propertyTypes, setPropertyTypes] = useState(initialFilters.propertyTypes ?? []);
    const [bedrooms, setBedrooms] = useState(initialFilters.bedrooms ?? 'Any');
    const [bathrooms, setBathrooms] = useState(initialFilters.bathrooms ?? 'Any');
    const [amenities, setAmenities] = useState(initialFilters.amenities ?? []);
    const [availableFrom, setAvailableFrom] = useState(initialFilters.availableFrom ?? '');

    // Sync state if initialFilters props change
    useEffect(() => {
        setMinPrice(initialFilters.minPrice && initialFilters.minPrice !== '' ? Number(initialFilters.minPrice) : 1200);
        setMaxPrice(initialFilters.maxPrice && initialFilters.maxPrice !== '' ? Number(initialFilters.maxPrice) : 50000);
        if (initialFilters.propertyTypes !== undefined) setPropertyTypes(initialFilters.propertyTypes);
        if (initialFilters.bedrooms !== undefined) setBedrooms(initialFilters.bedrooms);
        if (initialFilters.bathrooms !== undefined) setBathrooms(initialFilters.bathrooms);
        if (initialFilters.amenities !== undefined) setAmenities(initialFilters.amenities);
        if (initialFilters.availableFrom !== undefined) setAvailableFrom(initialFilters.availableFrom);
    }, [initialFilters]);

    const handlePropertyTypeChange = (type) => {
        setPropertyTypes(prev => 
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleAmenityChange = (amenity) => {
        setAmenities(prev => 
            prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
        );
    };

    const handleApply = () => {
        if (onApply) {
            onApply({
                minPrice: minPrice <= 1200 ? '' : minPrice,
                maxPrice: maxPrice >= 50000 ? '' : maxPrice,
                propertyTypes,
                bedrooms,
                bathrooms,
                amenities,
                availableFrom
            });
        }
    };

    return (
        <aside className="property-filters">
            <div className="filters-header">
                <div className="filters-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="21" x2="4" y2="14"></line>
                        <line x1="4" y1="10" x2="4" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12" y2="3"></line>
                        <line x1="20" y1="21" x2="20" y2="16"></line>
                        <line x1="20" y1="12" x2="20" y2="3"></line>
                        <line x1="1" y1="14" x2="7" y2="14"></line>
                        <line x1="9" y1="8" x2="15" y2="8"></line>
                        <line x1="17" y1="16" x2="23" y2="16"></line>
                    </svg>
                    <h2>Filters</h2>
                </div>
                <p className="filters-subtitle">Narrow your search</p>
            </div>

            <div className="filter-group">
                <h3 className="filter-group-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Price Range
                </h3>
                <div className="range-slider-mock" style={{ position: 'relative', height: '24px', display: 'flex', alignItems: 'center' }}>
                    <input 
                        type="range" 
                        min="1200" 
                        max="50000" 
                        step="1000"
                        value={minPrice} 
                        onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 1000))} 
                        className="slider-input min-slider"
                        style={{ position: 'absolute', width: '100%', pointerEvents: 'none', appearance: 'none', background: 'none', zIndex: 3 }}
                    />
                    <input 
                        type="range" 
                        min="1200" 
                        max="50000" 
                        step="1000"
                        value={maxPrice} 
                        onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 1000))} 
                        className="slider-input max-slider"
                        style={{ position: 'absolute', width: '100%', pointerEvents: 'none', appearance: 'none', background: 'none', zIndex: 4 }}
                    />
                    <div className="slider-track" style={{ width: '100%', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', position: 'relative' }}>
                        <div 
                            className="slider-fill" 
                            style={{ 
                                position: 'absolute', 
                                height: '100%', 
                                backgroundColor: '#1e3a8a', 
                                borderRadius: '2px',
                                left: `${((minPrice - 1200) / 48800) * 100}%`,
                                width: `${((maxPrice - minPrice) / 48800) * 100}%`
                            }}
                        ></div>
                    </div>
                </div>
                <div className="range-values">
                    <span>৳{minPrice.toLocaleString()}</span>
                    <span>৳{maxPrice >= 50000 ? '50,000+' : maxPrice.toLocaleString()}</span>
                </div>
            </div>

            <div className="filter-group">
                <h3 className="filter-group-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    Property Type
                </h3>
                <label className="checkbox-label">
                    <input 
                        type="checkbox" 
                        checked={propertyTypes.includes('apartment')} 
                        onChange={() => handlePropertyTypeChange('apartment')}
                    />
                    <span className="checkbox-custom"></span>
                    Apartment
                </label>
                <label className="checkbox-label">
                    <input 
                        type="checkbox" 
                        checked={propertyTypes.includes('house')} 
                        onChange={() => handlePropertyTypeChange('house')}
                    />
                    <span className="checkbox-custom"></span>
                    House
                </label>
                <label className="checkbox-label">
                    <input 
                        type="checkbox" 
                        checked={propertyTypes.includes('hostel')} 
                        onChange={() => handlePropertyTypeChange('hostel')}
                    />
                    <span className="checkbox-custom"></span>
                    Hostel
                </label>
                <label className="checkbox-label">
                    <input 
                        type="checkbox" 
                        checked={propertyTypes.includes('commercial')} 
                        onChange={() => handlePropertyTypeChange('commercial')}
                    />
                    <span className="checkbox-custom"></span>
                    Commercial
                </label>
            </div>

            <div className="filter-group">
                <h3 className="filter-group-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="14" width="18" height="8" rx="2" ry="2"></rect><path d="M5 14v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7"></path><path d="M12 21v-7"></path></svg>
                    Bedrooms
                </h3>
                <div className="segmented-control">
                    {['Any', '1', '2', '3', '3+'].map(val => (
                        <button 
                            key={val} 
                            className={`segment ${bedrooms === val ? 'active' : ''}`}
                            onClick={() => setBedrooms(val)}
                        >
                            {val}
                        </button>
                    ))}
                </div>
            </div>

            <div className="filter-group">
                <h3 className="filter-group-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                    Bathrooms
                </h3>
                <div className="segmented-control">
                    {['Any', '1', '2', '3', '3+'].map(val => (
                        <button 
                            key={val} 
                            className={`segment ${bathrooms === val ? 'active' : ''}`}
                            onClick={() => setBathrooms(val)}
                        >
                            {val}
                        </button>
                    ))}
                </div>
            </div>

            <div className="filter-group">
                <h3 className="filter-group-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    Amenities
                </h3>
                {dbAmenities && dbAmenities.length > 0 ? (
                    dbAmenities.map(amenity => (
                        <label className="checkbox-label" key={amenity.id}>
                            <input 
                                type="checkbox" 
                                checked={amenities.includes(amenity.name)} 
                                onChange={() => handleAmenityChange(amenity.name)}
                            />
                            <span className="checkbox-custom"></span>
                            {formatAmenityName(amenity.name)}
                        </label>
                    ))
                ) : (
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '4px 0' }}>Loading amenities...</div>
                )}
            </div>

            <div className="filter-group">
                <h3 className="filter-group-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Availability
                </h3>
                <input 
                    type="date" 
                    className="date-input" 
                    value={availableFrom} 
                    onChange={(e) => setAvailableFrom(e.target.value)}
                />
            </div>

            <button className="apply-btn" onClick={handleApply}>Apply Filters</button>
        </aside>
    );
};

export default PropertyFilters;
