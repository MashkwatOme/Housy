import React from 'react';
import './AuthLayout.css';

const AuthLayout = ({ children }) => {
    return (
        <div className="auth-layout">
            <div className="auth-hero">
                <div className="auth-hero-content">
                    <div className="auth-hero-text">
                        <h1>Redefining Rental Management.</h1>
                        <p>Experience a refined workspace that feels both expansive and precise. Join a community built for high-stakes real-estate strategy.</p>
                    </div>
                    <div className="auth-hero-stats">
                        <div className="stat">
                            <span className="stat-value">12k+</span>
                            <span className="stat-label">ACTIVE PROPERTIES</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">98%</span>
                            <span className="stat-label">SUCCESS RATE</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="auth-content">
                <div className="auth-content-inner">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
