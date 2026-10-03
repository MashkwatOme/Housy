import React from 'react';
import { useNavigate } from 'react-router-dom';

const pages = [
  { title: 'Browse', path: '/browse', role: 'Public' },
  { title: 'Login', path: '/login', role: 'Public' },
  { title: 'Sign Up', path: '/signup', role: 'Public' },
  { title: 'Search', path: '/search', role: 'Public' },
  { title: 'Admin Dashboard', path: '/admin', role: 'Admin' },
  { title: 'Owner Dashboard', path: '/owner', role: 'Owner' },
  { title: 'Owner Properties', path: '/owner/properties', role: 'Owner' },
  { title: 'Add Property', path: '/owner/add-property', role: 'Owner' },
  { title: 'Tenant Dashboard', path: '/tenant', role: 'Tenant' },
  { title: 'Current Stay', path: '/tenant/stay', role: 'Tenant' },
  { title: 'Messages', path: '/messages', role: 'Tenant' },
  { title: 'Tenant Payments', path: '/tenant/payments', role: 'Tenant' },
  { title: 'Tenant Requests', path: '/tenant/requests', role: 'Tenant' },
  { title: 'Owner Requests', path: '/owner/requests', role: 'Owner' },
  { title: 'Owner Payments', path: '/owner/payments', role: 'Owner' },
  { title: 'Agreements', path: '/agreements', role: 'Signed in' },
];

const PageDirectory = ({ onNavigate }) => {
  const navigate = useNavigate();

  const goTo = (path) => {
    if (onNavigate) {
      if (path === '/browse') onNavigate('browse');
      else if (path === '/login') onNavigate('login');
      else if (path === '/signup') onNavigate('signup');
      else if (path === '/search') onNavigate('aisearch');
      else if (path === '/admin') onNavigate('admindashboard');
      else if (path === '/owner') onNavigate('ownerdashboard');
      else if (path === '/owner/properties') onNavigate('owner-properties');
      else if (path === '/owner/add-property') onNavigate('addproperty');
      else if (path === '/tenant') onNavigate('tenant-dashboard');
      else if (path === '/tenant/stay') onNavigate('tenant-stay');
      else if (path === '/messages') onNavigate('tenant-messages');
      else if (path === '/tenant/payments') onNavigate('tenant-payments');
      else if (path === '/tenant/requests') onNavigate('tenant-requests');
      else if (path === '/owner/requests') onNavigate('owner-requests');
      else if (path === '/owner/payments') onNavigate('owner-payments');
      else if (path === '/agreements') onNavigate('agreements');
      else navigate(path);
      return;
    }

    navigate(path);
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px',
      background: 'radial-gradient(circle at top left, rgba(79, 70, 229, 0.10), transparent 30%), radial-gradient(circle at top right, rgba(124, 58, 237, 0.08), transparent 28%), linear-gradient(180deg, #FBFAFF 0%, #F8F7FF 100%)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(255,255,255,0.9)',
        border: '1px solid rgba(79, 70, 229, 0.12)',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(31, 41, 55, 0.08)',
        padding: '32px'
      }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Housy
          </div>
          <h1 style={{ fontSize: '32px', color: 'var(--color-text-main)', marginTop: '8px' }}>Page Directory</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', maxWidth: '720px' }}>
            Open any page from one place and check how the iris theme looks across the app.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}>
          {pages.map((page) => (
            <button
              key={page.path}
              onClick={() => goTo(page.path)}
              style={{
                textAlign: 'left',
                padding: '18px',
                borderRadius: '18px',
                border: '1px solid rgba(79, 70, 229, 0.12)',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F7F4FF 100%)',
                boxShadow: '0 10px 24px rgba(79, 70, 229, 0.06)',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '13px', color: 'var(--color-secondary)', fontWeight: 700 }}>{page.role}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '6px' }}>
                {page.title}
              </div>
              <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                {page.path}
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: '24px', padding: '16px 18px', borderRadius: '14px', background: '#F8FAFF', border: '1px dashed rgba(79, 70, 229, 0.18)', color: 'var(--color-text-muted)' }}>
          Property details and agreement details need a real ID, so open them from a property/agreement page.
        </div>
      </div>
    </div>
  );
};

export default PageDirectory;
