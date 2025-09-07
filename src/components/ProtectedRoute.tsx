import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'client' | 'agent';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, role, loading, error } = useUser();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="relative min-h-screen bg-cosmic-dark text-white">
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-2/3 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="relative min-h-screen bg-cosmic-dark text-white">
        <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
          <Alert className="max-w-md bg-red-900/20 border-red-500/50 text-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirect based on role if role doesn't match requirement
  if (requiredRole && role !== requiredRole) {
    switch (role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'client':
        return <Navigate to="/portal" replace />;
      case 'agent':
        return <Navigate to="/lab" replace />;
      default:
        return <Navigate to="/auth" replace />;
    }
  }

  // Role-based routing for root path
  if (location.pathname === '/' && role) {
    switch (role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'client':
        return <Navigate to="/portal" replace />;
      case 'agent':
        return <Navigate to="/lab" replace />;
      default:
        return <Navigate to="/auth" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
