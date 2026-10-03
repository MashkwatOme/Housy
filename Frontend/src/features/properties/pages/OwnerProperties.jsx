import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import OwnerPropertyGrid from '../components/OwnerPropertyGrid';
import { useProperties } from '../hooks/useProperties';
import toast from 'react-hot-toast';

const OwnerProperties = ({ onNavigate }) => {
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

    return (
        <div className="owner-properties-page-layout" style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
            <Navbar onNavigate={onNavigate} activeTab="properties" />
            
            <main className="owner-main-content-wrapper" style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '40px', boxSizing: 'border-box' }}>
                <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div className="content-header-text">
                        <h1 className="owner-title" style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '6px' }}>My Properties</h1>
                        <p className="owner-subtitle" style={{ fontSize: '15px', color: 'var(--color-text-muted)', margin: '0' }}>Manage, edit, or delete your property listings.</p>
                    </div>
                    <button className="btn-add-property" onClick={() => onNavigate('addproperty')} style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}>Add Property</button>
                </div>
                
                <section className="my-properties-section" style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
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
            </main>
        </div>
    );
};

export default OwnerProperties;
