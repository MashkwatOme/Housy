import React from 'react';
import './AdminLayout.css';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';

const AdminLayout = ({ children, onNavigate }) => {
    const { logout, user } = useAuth();

    const handleLogout = async () => {
        await logout();
        if (onNavigate) onNavigate('login');
    };

    return (
        <div className="admin-layout-container">
            <header className="admin-header">
                <div className="admin-header-left">
                    <div className="admin-brand-horizontal">
                        <h2>Housy</h2>
                        <span className="admin-badge">Admin</span>
                    </div>
                    <nav className="admin-top-nav">
                        <NavLink to="/admin" end className="nav-link">Dashboard</NavLink>
                        <NavLink to="/admin/verifications" className="nav-link">Pending verifications</NavLink>
                    </nav>
                </div>

                <div className="admin-header-right">
                    <div className="header-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    </div>
                    <div className="header-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    </div>
                    <div className="admin-profile-top" onClick={handleLogout} title="Logout">
                        <span className="profile-initials">A</span>
                        <div className="profile-details-mini">
                            <span className="profile-name">Admin</span>
                            <span className="profile-role">Logout</span>
                        </div>
                    </div>
                </div>
            </header>
            <main className="admin-main-horizontal">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
