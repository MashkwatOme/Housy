import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import BrowseProperties from './features/properties/pages/BrowseProperties';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import PropertyDetails from './features/properties/pages/PropertyDetails';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import AdminVerifications from './features/admin/pages/AdminVerifications';
import OwnerDashboard from './features/properties/pages/OwnerDashboard';
import OwnerProperties from './features/properties/pages/OwnerProperties';
import AddPropertyWizard from './features/properties/pages/AddPropertyWizard';
import SearchPage from './features/search/pages/SearchPage';
import TenantDashboard from './features/tenant/pages/TenantDashboard';
import TenantCurrentStay from './features/tenant/pages/TenantCurrentStay';
import TenantMessages from './features/chat/pages/TenantMessages';
import TenantPayments from './features/tenant/pages/TenantPayments';
import TenantRequests from './features/stayRequest/pages/TenantRequests';
import OwnerRequests from './features/stayRequest/pages/OwnerRequests';
import AgreementsList from './features/agreement/pages/AgreementsList';
import AgreementDetails from './features/agreement/pages/AgreementDetails';
import OwnerPayments from './features/payments/pages/OwnerPayments';
import OwnerMaintenance from './features/maintenance/pages/OwnerMaintenance';
import LandingPage from './features/landing/pages/LandingPage';
import ProfilePage from './features/profile/pages/ProfilePage';


// Helper component to extract params for property details page
const PropertyDetailsWrapper = ({ onNavigate, isLoggedIn, user }) => {
  const { id } = useParams();
  return <PropertyDetails onNavigate={onNavigate} isLoggedIn={isLoggedIn} user={user} propertyId={id} />;
};

// Helper component to extract params for agreement details page
const AgreementDetailsWrapper = ({ onNavigate }) => {
  const { id } = useParams();
  return <AgreementDetails onNavigate={onNavigate} agreementId={id} />;
};

// Helper component to extract params for edit property wizard
const EditPropertyWrapper = ({ onNavigate }) => {
  const { id } = useParams();
  return <AddPropertyWizard onNavigate={onNavigate} propertyId={id} isEdit={true} />;
};

export const AppRoutes = ({ onNavigate, isLoggedIn, user }) => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage onNavigate={onNavigate} />} />
      <Route path="/browse" element={<BrowseProperties onNavigate={onNavigate} isLoggedIn={isLoggedIn} user={user} />} />
      <Route path="/login" element={<Login onNavigate={onNavigate} />} />
      <Route path="/signup" element={<Register onNavigate={onNavigate} />} />
      <Route path="/properties/:id" element={<PropertyDetailsWrapper onNavigate={onNavigate} isLoggedIn={isLoggedIn} user={user} />} />
      <Route path="/admin" element={<AdminDashboard onNavigate={onNavigate} />} />
      <Route path="/admin/verifications" element={<AdminVerifications onNavigate={onNavigate} />} />
      <Route path="/owner" element={<OwnerDashboard onNavigate={onNavigate} />} />
      <Route path="/owner/properties" element={<OwnerProperties onNavigate={onNavigate} />} />
      <Route path="/owner/add-property" element={<AddPropertyWizard onNavigate={onNavigate} />} />
      <Route path="/owner/edit-property/:id" element={<EditPropertyWrapper onNavigate={onNavigate} />} />
      <Route path="/search" element={<SearchPage onNavigate={onNavigate} isLoggedIn={isLoggedIn} user={user} />} />
      <Route path="/tenant" element={<TenantDashboard onNavigate={onNavigate} user={user} />} />
      <Route path="/tenant/stay" element={<TenantCurrentStay onNavigate={onNavigate} />} />
      <Route path="/messages" element={<TenantMessages onNavigate={onNavigate} />} />
      <Route path="/tenant/payments" element={<TenantPayments onNavigate={onNavigate} />} />
      <Route path="/tenant/requests" element={<TenantRequests onNavigate={onNavigate} />} />
      <Route path="/owner/requests" element={<OwnerRequests onNavigate={onNavigate} />} />
      <Route path="/owner/payments" element={<OwnerPayments onNavigate={onNavigate} />} />
      <Route path="/owner/maintenance" element={<OwnerMaintenance onNavigate={onNavigate} />} />
      <Route path="/agreements" element={<AgreementsList onNavigate={onNavigate} />} />
      <Route path="/profile" element={<ProfilePage onNavigate={onNavigate} />} />

      <Route path="/agreements/:id" element={<AgreementDetailsWrapper onNavigate={onNavigate} />} />
      <Route path="*" element={<Navigate to="/browse" replace />} />
    </Routes>
  );
};
