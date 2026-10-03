import React from 'react';

const Step2Specifications = ({ data, updateData, onNext, onPrev }) => {
    const handleIncrement = (field) => updateData({ [field]: (data[field] || 0) + 1 });
    const handleDecrement = (field) => { if (data[field] > 0) updateData({ [field]: data[field] - 1 }); };
    const isValid = data.area && data.monthly_rent;

    return (
        <div className="wide-content-card">
            {/* Bedrooms & Bathrooms */}
            <div className="spec-input-row">
                <div className="spec-stepper-group">
                    <label className="spec-label">Number of Bedrooms</label>
                    <div className="spec-stepper">
                        <button className="stepper-side-btn" onClick={() => handleDecrement('total_bedrooms')}>−</button>
                        <span className="stepper-num">{data.total_bedrooms}</span>
                        <button className="stepper-side-btn" onClick={() => handleIncrement('total_bedrooms')}>+</button>
                    </div>
                </div>

                <div className="spec-stepper-group">
                    <label className="spec-label">Number of Bathrooms</label>
                    <div className="spec-stepper">
                        <button className="stepper-side-btn" onClick={() => handleDecrement('total_bathrooms')}>−</button>
                        <span className="stepper-num">{data.total_bathrooms}</span>
                        <button className="stepper-side-btn" onClick={() => handleIncrement('total_bathrooms')}>+</button>
                    </div>
                </div>
            </div>

            {/* Area & Units */}
            <div className="spec-input-row spec-input-row-narrow">
                <div className="spec-field-group">
                    <label className="spec-label">Total Area (Sq Ft)</label>
                    <div className="spec-input-wrap">
                        <span className="spec-icon-left">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                        </span>
                        <input type="number" className="spec-input" placeholder="e.g. 1200" value={data.area} onChange={e => updateData({ area: e.target.value })} />
                        <span className="spec-label-right">SQ FT</span>
                    </div>
                </div>

                <div className="spec-field-group">
                    <label className="spec-label">Number of Units</label>
                    <div className="spec-input-wrap">
                        <span className="spec-icon-left">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect></svg>
                        </span>
                        <input type="number" className="spec-input" placeholder="e.g. 1" value={data.total_units} onChange={e => updateData({ total_units: e.target.value })} />
                        <span className="spec-label-right">UNITS</span>
                    </div>
                </div>
            </div>

            {/* Financial Details divider */}
            <div className="financial-divider">
                <span>FINANCIAL DETAILS</span>
            </div>

            {/* Rent & Deposit */}
            <div className="spec-input-row spec-input-row-narrow">
                <div className="spec-field-group">
                    <label className="spec-label">Monthly Rent</label>
                    <div className="spec-input-wrap">
                        <span className="spec-icon-left spec-icon-text">৳</span>
                        <input type="number" className="spec-input" placeholder="0.00" value={data.monthly_rent} onChange={e => updateData({ monthly_rent: e.target.value })} />
                    </div>
                </div>

                <div className="spec-field-group">
                    <label className="spec-label">Security Deposit</label>
                    <div className="spec-input-wrap">
                        <span className="spec-icon-left spec-icon-text">৳</span>
                        <input type="number" className="spec-input" placeholder="0.00" value={data.expected_security_deposit} onChange={e => updateData({ expected_security_deposit: e.target.value })} />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="wide-step-footer">
                <button className="btn-wide-outline" onClick={onPrev}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back
                </button>
                <button className="btn-wide-solid" onClick={onNext} disabled={!isValid}>
                    Next Step
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                </button>
            </div>
        </div>
    );
};

export default Step2Specifications;
