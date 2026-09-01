import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { UserRole } from '../lib/types';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  children?: ReactNode;
}

export const RoleRoute = ({ allowedRoles, children }: RoleRouteProps) => {
  const { user, ready } = useAuth();

  if (!ready) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed = user.role === 'ADMIN' || allowedRoles.includes(user.role);

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
