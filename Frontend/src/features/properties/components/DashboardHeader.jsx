import React from 'react';
import './DashboardComponents.css';

const DashboardHeader = ({ user }) => {
    return (
        <header className="header-container">
            <div className="header-actions">
                <button className="icon-btn notification-dot">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                </button>
                <button className="icon-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </button>

                <div className="user-profile">
                    <img 
                        src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=0f172a&color=fff`} 
                        alt="Profile" 
                        className="user-avatar" 
                    />
                    <div className="user-info">
                        <span className="user-name">{user?.name || 'Alex Mercer'}</span>
                        <span className="user-role">Pro Owner</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
