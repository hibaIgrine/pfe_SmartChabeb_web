import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import AccessDeniedPage from "./AccessDeniedPage";
import { getStoredUser, normalizeRole } from "../../utils/authSession";
import Layout from "../layout/Layout";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation();
  const user = getStoredUser();
  const role = normalizeRole(user?.role);

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(role || "")
  ) {
    return (
      <Layout>
        <AccessDeniedPage />
      </Layout>
    );
  }

  return <>{children}</>;
}
