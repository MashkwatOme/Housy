import React, { useCallback } from 'react';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';

const availableAmenities = [
    { id: 'f069a05f-53b2-11f1-9c29-047c163998aa', name: 'Wi-Fi', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg> },
    { id: 'f069ae81-53b2-11f1-9c29-047c163998aa', name: 'Parking', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg> },
    { id: 'f069b007-53b2-11f1-9c29-047c163998aa', name: 'Air Conditioning', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 16l-2 4"></path><path d="M16 16l2 4"></path><path d="M12 16v4"></path><path d="M2 8h20"></path><path d="M2 16h20"></path><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"></path></svg> },
    { id: 'f069b271-53b2-11f1-9c29-047c163998aa', name: 'Furnished', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"></path><path d="M4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><line x1="2" y1="11" x2="22" y2="11"></line></svg> },
    { id: 'f069afc7-53b2-11f1-9c29-047c163998aa', name: 'Gym', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 10v4"></path><path d="M18 10v4"></path><path d="M2.5 12h19"></path><path d="M2 8v8"></path><path d="M22 8v8"></path></svg> },
    { id: 'f069b09b-53b2-11f1-9c29-047c163998aa', name: 'Laundry', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="12" cy="13" r="5"></circle><line x1="12" y1="6" x2="12.01" y2="6"></line></svg> },
    { id: 'f069afa9-53b2-11f1-9c29-047c163998aa', name: 'Security', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> },
    { id: 'f069af05-53b2-11f1-9c29-047c163998aa', name: 'Lift', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="2" ry="2"></rect><path d="M12 7v10"></path><polyline points="9 10 12 7 15 10"></polyline><polyline points="9 14 12 17 15 14"></polyline></svg> },
    { id: 'f069af83-53b2-11f1-9c29-047c163998aa', name: 'Generator', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg> },
    { id: 'f069afe5-53b2-11f1-9c29-047c163998aa', name: 'Balcony', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8"></path><rect x="2" y="14" width="20" height="6" rx="1"></rect><line x1="6" y1="14" x2="6" y2="20"></line><line x1="10" y1="14" x2="10" y2="20"></line><line x1="14" y1="14" x2="14" y2="20"></line><line x1="18" y1="14" x2="18" y2="20"></line></svg> }
];

const Step3AmenitiesLocation = ({ data, updateData, onNext, onPrev }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    const handleMapClick = useCallback((e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const addressComponents = results[0].address_components;
                const formattedAddress = results[0].formatted_address;
                
                let division = '';
                let district = '';
                let localArea = '';
                
                addressComponents.forEach(comp => {
                    const types = comp.types;
                    if (types.includes('administrative_area_level_1')) {
                        division = comp.long_name;
                    }
                    if (types.includes('administrative_area_level_2')) {
                        district = comp.long_name;
                    }
                    // Capture most granular locality info
                    if (types.includes('sublocality_level_1') || types.includes('neighborhood') || types.includes('locality')) {
                        if (!localArea) localArea = comp.long_name;
                    }
                });

                updateData({
                    latitude: lat,
                    longitude: lng,
                    address: formattedAddress,
                    division,
                    district,
                    local_area: localArea || district
                });
            }
        });
    }, [updateData]);

    const toggleAmenity = (id) => {
        const current = data.amenities || [];
        updateData({ amenities: current.includes(id) ? current.filter(a => a !== id) : [...current, id] });
    };

    return (
        <div>
            <div className="wide-two-col-layout">
                {/* Left: Amenities + Rules */}
                <div className="wide-content-card" style={{ flex: 1 }}>
                    <h3 className="wide-card-title">Property Amenities</h3>
                    <p className="wide-card-desc">Select all amenities available at this property to help potential tenants find their perfect match.</p>

                    <div className="amenities-grid">
                        {availableAmenities.map(amenity => (
                            <button
                                key={amenity.id}
                                className={`choice-btn amenity-choice ${data.amenities?.includes(amenity.id) ? 'selected' : ''}`}
                                onClick={() => toggleAmenity(amenity.id)}
                            >
                                {amenity.icon}
                                <span>{amenity.name}</span>
                            </button>
                        ))}
                    </div>

                    <h3 className="wide-card-title" style={{ marginTop: '28px' }}>Additional Rules</h3>
                    <div className="rule-row">
                        <input type="checkbox" id="rule1" />
                        <label htmlFor="rule1">No Smoking allowed inside the property</label>
                    </div>
                    <div className="rule-row">
                        <input type="checkbox" id="rule2" />
                        <label htmlFor="rule2">No loud events or parties after 10 PM</label>
                    </div>
                </div>

                {/* Right: Location */}
                <div className="wide-content-card" style={{ flex: 1 }}>
                    <h3 className="wide-card-title">Property Location</h3>
                    
                    <div className="spec-input-row spec-input-row-narrow" style={{ marginBottom: '16px' }}>
                        <div className="spec-field-group">
                            <label className="spec-label">Division</label>
                            <div className="spec-input-wrap">
                                <span className="spec-icon-left">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                                </span>
                                <input
                                    type="text"
                                    className="spec-input"
                                    placeholder="e.g. Dhaka"
                                    value={data.division || ''}
                                    onChange={e => updateData({ division: e.target.value })}
                                />
                            </div>
                        </div>
                        
                        <div className="spec-field-group">
                            <label className="spec-label">District</label>
                            <div className="spec-input-wrap">
                                <span className="spec-icon-left">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                                </span>
                                <input
                                    type="text"
                                    className="spec-input"
                                    placeholder="e.g. Dhaka"
                                    value={data.district || ''}
                                    onChange={e => updateData({ district: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="spec-input-row" style={{ marginBottom: '16px' }}>
                        <div className="spec-field-group">
                            <label className="spec-label">Local Area</label>
                            <div className="spec-input-wrap">
                                <span className="spec-icon-left">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"></circle><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path></svg>
                                </span>
                                <input
                                    type="text"
                                    className="spec-input"
                                    placeholder="e.g. Gulshan"
                                    value={data.local_area || ''}
                                    onChange={e => updateData({ local_area: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="spec-input-row" style={{ marginBottom: '24px' }}>
                        <div className="spec-field-group">
                            <label className="spec-label">Detailed Address</label>
                            <div className="spec-input-wrap">
                                <span className="spec-icon-left">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                </span>
                                <input
                                    type="text"
                                    className="spec-input"
                                    placeholder="e.g. House 12, Road 4, Sector 7"
                                    value={data.address || ''}
                                    onChange={e => updateData({ address: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {isLoaded ? (
                        <div className="map-mock" style={{ background: 'none' }}>
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={data.latitude ? { lat: Number(data.latitude), lng: Number(data.longitude) } : { lat: 23.8103, lng: 90.4125 }} // Default Dhaka
                                zoom={12}
                                onClick={handleMapClick}
                                options={{ streetViewControl: false, mapTypeControl: false }}
                            >
                                {data.latitude && data.longitude && (
                                    <Marker position={{ lat: Number(data.latitude), lng: Number(data.longitude) }} />
                                )}
                            </GoogleMap>
                            {data.address && (
                                <div className="map-badge" style={{ zIndex: 10 }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0056b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
                                    Location Selected
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="map-mock">
                            <div style={{ padding: '20px' }}>Loading Map...</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="wide-step-footer">
                <button className="btn-wide-outline" onClick={onPrev}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back
                </button>
                <div className="footer-right-group">
                    <button className="btn-wide-ghost">Save as Draft</button>
                    <button className="btn-wide-solid" onClick={onNext} disabled={!data.address}>
                        Next Step <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Step3AmenitiesLocation;
