import React from 'react';
import './DashboardComponents.css';

const StatCard = ({ label, value, icon, tag, footer }) => {
    return (
        <div className="stat-card">
            <div className="stat-header">
                <div className="stat-icon-wrapper">{icon}</div>
                {tag && <span className="stat-tag">{tag}</span>}
            </div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
            {footer && <div className="stat-footer">{footer}</div>}
        </div>
    );
};

export default StatCard;
