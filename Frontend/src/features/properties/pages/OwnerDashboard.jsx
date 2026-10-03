import React, { useEffect } from 'react';
import './OwnerDashboard.css';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import OwnerPropertyGrid from '../components/OwnerPropertyGrid';
import IncomingRequests from '../components/IncomingRequests';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../../auth/hooks/useAuth';
import toast from 'react-hot-toast';

const OwnerDashboard = ({ onNavigate }) => {
    const { user } = useAuth();
    const { properties, loading, fetchOwnerProperties, deleteProperty } = useProperties();

    useEffect(() => {
        fetchOwnerProperties();
    }, [fetchOwnerProperties]);

    const handleViewProperty = (id) => {
        onNavigate('details', id);
    };

    const handleEditProperty = (id) => {
        onNavigate('editproperty', id);
    };

    const handleDeleteProperty = async (id) => {
        if (window.confirm("Are you sure you want to delete this property? This will remove all related stay requests, schedules, and agreements.")) {
            try {
                await deleteProperty(id);
                toast.success("Property deleted successfully.");
                fetchOwnerProperties();
            } catch (err) {
                toast.error(err.message || "Failed to delete property.");
            }
        }
    };

    const stats = [
        {
            label: 'ACTIVE LISTINGS',
            value: properties.filter(p => p.visibility_status === 'active').length || 0,
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            ),
            tag: 'Public',
            footer: 'Open for applications'
        },
        {
            label: 'RENTED / HIDDEN',
            value: properties.filter(p => p.visibility_status === 'hidden').length || 0,
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            ),
            tag: 'Leased',
            footer: 'Hidden after approval'
        },
        {
            label: 'TOTAL PORTFOLIO',
            value: properties.length || 0,
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            ),
            tag: 'Assets',
            footer: 'All listings managed'
        }
    ];

    return (
        <div className="owner-dashboard-layout" style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
            <Navbar onNavigate={onNavigate} activeTab="dashboard" />
            
            <main className="owner-main-content-wrapper" style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '40px', boxSizing: 'border-box' }}>
                <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div className="content-header-text">
                        <h1 className="owner-title" style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '6px' }}>Overview</h1>
                        <p className="owner-subtitle" style={{ fontSize: '15px', color: 'var(--color-text-muted)', margin: '0' }}>Track your rental performance and property status.</p>
                    </div>
                    <button className="btn-add-property" onClick={() => onNavigate('addproperty')} style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}>Add Property</button>
                </div>
                
                {/* Main Sections Grid */}
                <div className="owner-sections-grid" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px' }}>
                    
                    {/* Left: Stats & My Properties */}
                    <div>
                        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '36px' }}>
                            {stats.map((stat, index) => (
                                <StatCard key={index} {...stat} />
                            ))}
                        </div>
                        
                        <section className="my-properties-section" style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 className="section-title" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-main)', margin: '0' }}>My Properties</h2>
                                <span className="view-all-link" onClick={() => onNavigate('owner-properties')} style={{ color: 'var(--color-accent, #3b82f6)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View All</span>
                            </div>
                            {loading ? (
                                <div className="loading-state" style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>Loading your properties...</div>
                            ) : (
                                <OwnerPropertyGrid 
                                    properties={properties} 
                                    onView={handleViewProperty}
                                    onEdit={handleEditProperty}
                                    onDelete={handleDeleteProperty}
                                />
                            )}
                        </section>
                    </div>

                    {/* Right: Incoming Requests */}
                    <aside className="owner-requests-sidebar-card" style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', alignSelf: 'start' }}>
                        <IncomingRequests onNavigate={onNavigate} />
                    </aside>

                </div>
            </main>
        </div>
    );
};

export default OwnerDashboard;
