import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthSession } from "../auth/auth-session";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const session = useAuthSession();

  if (!session.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && session.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
