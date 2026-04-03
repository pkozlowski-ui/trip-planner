import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loading } from '@carbon/react';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute - redirects authenticated users away from public pages (like Login)
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loading description="Loading..." withOverlay={false} />
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard or the page they were trying to access
  if (user) {
    // Get the 'from' query parameter or default to dashboard
    const from = new URLSearchParams(location.search).get('from') || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

