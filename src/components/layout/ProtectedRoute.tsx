import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { ShieldX } from 'lucide-react';

interface ProtectedRouteProps {
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-sky-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm font-semibold text-slate-600">Verifying security session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) => user?.roles.includes(role));
    if (!hasRequiredRole) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <ShieldX className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-slate-500 max-w-md mt-2">
            You do not have the required role permissions ({requiredRoles.join(', ')}) to view this resource.
          </p>
        </div>
      );
    }
  }

  return <Outlet />;
};
