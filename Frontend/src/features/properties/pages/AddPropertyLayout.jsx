import React from 'react';
import './AddPropertyWizard.css';
import { useAuth } from '../../auth/hooks/useAuth';

const AddPropertyLayout = ({ children }) => {
    const { user } = useAuth();
    
    return (
        <div className="wizard-layout-container">
            <header className="wizard-header">
                <div className="wizard-logo">Housy</div>
                
                <div className="user-profile">
                    <img 
                        src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=0f172a&color=fff`} 
                        alt="Profile" 
                        className="user-avatar-small" 
                    />
                </div>
            </header>
            
            <main className="wizard-main-content">
                {children}
            </main>
        </div>
    );
};

export default AddPropertyLayout;
