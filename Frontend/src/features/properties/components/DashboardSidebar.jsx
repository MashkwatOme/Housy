import React from 'react';
import './DashboardComponents.css';

const DashboardSidebar = ({ activeTab = 'properties', onNavigate }) => {
    const menuItems = [
        { id: 'properties', label: 'Properties', icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        )},
        { id: 'bookings', label: 'Bookings', icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        )},
        { id: 'messages', label: 'Messages', icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        )},
        { id: 'payments', label: 'Payments', icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
        )}
    ];

    return (
        <div className="sidebar-container">
            <div className="logo-area">
                <span className="logo-text">Housy</span>
                <span className="logo-sub">Owner Dashboard</span>
            </div>
            
            <nav className="nav-menu">
                {menuItems.map(item => (
                    <div 
                        key={item.id} 
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => {
                            if (item.id === 'messages' && onNavigate) onNavigate('tenant-messages');
                            if (item.id === 'properties' && onNavigate) onNavigate('ownerdashboard');
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </div>
                ))}
            </nav>
        </div>
    );
};

export default DashboardSidebar;
