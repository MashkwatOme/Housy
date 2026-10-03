import React from 'react';

const Step1BasicInfo = ({ data, updateData, onNext, onCancel }) => {
    return (
        <div className="step-container">
            
            <div className="wizard-form-group">
                <label className="wizard-label">Property Title</label>
                <input 
                    type="text" 
                    className="wizard-input" 
                    placeholder="e.g. Sunset Heights Apartment 4B" 
                    value={data.title}
                    onChange={(e) => updateData({ title: e.target.value })}
                />
            </div>
            
            <div className="wizard-form-group">
                <label className="wizard-label">Listing Type</label>
                <div className="wizard-choices">
                    <button 
                        className={`choice-btn ${data.listing_type === 'full_property' ? 'selected' : ''}`}
                        onClick={() => updateData({ listing_type: 'full_property' })}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        Full Property
                    </button>
                    <button 
                        className={`choice-btn ${data.listing_type === 'shared_living' ? 'selected' : ''}`}
                        onClick={() => updateData({ listing_type: 'shared_living' })}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Shared
                    </button>
                </div>
            </div>
            
            <div className="wizard-form-group">
                <label className="wizard-label">Property Type</label>
                <div className="wizard-choices">
                    <button 
                        className={`choice-btn ${data.property_type === 'apartment' ? 'selected' : ''}`}
                        onClick={() => updateData({ property_type: 'apartment' })}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="2" height="2"></rect><rect x="13" y="9" width="2" height="2"></rect><rect x="9" y="13" width="2" height="2"></rect><rect x="13" y="13" width="2" height="2"></rect></svg>
                        Apartment
                    </button>
                    <button 
                        className={`choice-btn ${data.property_type === 'house' ? 'selected' : ''}`}
                        onClick={() => updateData({ property_type: 'house' })}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                        House
                    </button>
                    <button 
                        className={`choice-btn ${data.property_type === 'commercial' ? 'selected' : ''}`}
                        onClick={() => updateData({ property_type: 'commercial' })}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path></svg>
                        Commercial
                    </button>
                </div>
            </div>
            
            <div className="wizard-form-group">
                <label className="wizard-label">Available From</label>
                <input 
                    type="date" 
                    className="wizard-input" 
                    value={data.available_from || ''}
                    onChange={(e) => updateData({ available_from: e.target.value })}
                />
            </div>
            
            <div className="wizard-form-group">
                <label className="wizard-label">Description</label>
                <textarea 
                    className="wizard-textarea" 
                    placeholder="Describe the property's key features, amenities, and surroundings..."
                    value={data.description}
                    onChange={(e) => updateData({ description: e.target.value })}
                ></textarea>
            </div>
            
            <div className="wizard-footer">
                <button className="btn-wizard-outline" onClick={onCancel}>Cancel</button>
                <button className="btn-wizard-solid" onClick={onNext} disabled={!data.title}>
                    Continue
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                </button>
            </div>
            
        </div>
    );
};

export default Step1BasicInfo;
