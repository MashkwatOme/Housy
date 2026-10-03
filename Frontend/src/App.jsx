import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './App.css'
import { useAuth } from './features/auth/hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import { AppRoutes } from './App.routes';

function App() {
  const { isLoggedIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation helper — supports onNavigate('details', propertyId)
  const handleNavigate = (page, id = null) => {
    switch (page) {
      case 'browse':
        navigate('/browse');
        break;
      case 'landing':
        navigate('/');
        break;
      case 'login':
        navigate('/login');
        break;
      case 'signup':
        navigate('/signup');
        break;
      case 'details':
        navigate(`/properties/${id}`);
        break;
      case 'admindashboard':
        navigate('/admin');
        break;
      case 'ownerdashboard':
        navigate('/owner');
        break;
      case 'owner-properties':
        navigate('/owner/properties');
        break;
      case 'addproperty':
        navigate('/owner/add-property');
        break;
      case 'editproperty':
        navigate(`/owner/edit-property/${id}`);
        break;
      case 'aisearch':
        navigate('/search');
        break;
      case 'tenant-dashboard':
        navigate('/tenant');
        break;
      case 'tenant-stay':
        navigate('/tenant/stay');
        break;
      case 'tenant-messages':
        navigate('/messages');
        break;
      case 'tenant-payments':
        navigate('/tenant/payments');
        break;
      case 'tenant-requests':
        navigate('/tenant/requests');
        break;
      case 'owner-requests':
        navigate('/owner/requests');
        break;
      case 'owner-payments':
        navigate('/owner/payments');
        break;
      case 'owner-maintenance':
        navigate('/owner/maintenance');
        break;
      case 'profile':
        navigate('/profile');
        break;

      case 'agreements':
        navigate('/agreements');
        break;
      case 'agreement-details':
        navigate(`/agreements/${id}`);
        break;
      default:
        navigate('/browse');
    }
  };

  useEffect(() => {
    if (loading) return;

    const currentPath = location.pathname;

    if (isLoggedIn) {
      if (user?.role === 'admin' && (currentPath === '/' || currentPath === '/browse')) {
        navigate('/admin', { replace: true });
      }
      if (user?.role === 'owner' && (currentPath === '/' || currentPath === '/browse' || currentPath === '/login' || currentPath === '/signup')) {
        navigate('/owner', { replace: true });
      }
    } else {
      // Not logged in
      const publicPaths = ['/', '/browse', '/signup', '/login', '/search'];
      const isPublicPath = publicPaths.includes(currentPath) || currentPath.startsWith('/properties/');
      if (!isPublicPath) {
        navigate('/login', { replace: true });
      }
    }
  }, [isLoggedIn, user, loading, location.pathname, navigate]);

  if (loading) return null;

  return (
    <>
      <Toaster position="top-center" />
      <AppRoutes onNavigate={handleNavigate} isLoggedIn={isLoggedIn} user={user} />
    </>
  )
}

export default App
