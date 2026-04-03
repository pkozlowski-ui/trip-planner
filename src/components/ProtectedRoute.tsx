import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loading } from '@carbon/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - protects routes that require authentication
 * Redirects unauthenticated users to login page with return URL
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loading description="Loading..." withOverlay={false} />
      </div>
    );
  }

  if (!user) {
    // Save the current location to redirect back after login
    const returnUrl = location.pathname + location.search;
    return <Navigate to={`/login?from=${encodeURIComponent(returnUrl)}`} replace />;
  }

  return <>{children}</>;
}


