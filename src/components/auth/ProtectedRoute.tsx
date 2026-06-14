/**
 * ProtectedRoute.tsx — Garde de route basée sur l'authentification et le rôle.
 *
 * RÔLE :
 *   Composant wrapper utilisé dans App.tsx via withAccess() pour sécuriser les routes.
 *   Deux niveaux de protection :
 *     1. AUTHENTIFICATION : si aucun user en localStorage → redirige vers /auth
 *        (mémorise la route d'origine dans state.from pour rediriger après login)
 *     2. AUTORISATION RBAC : si le rôle du user n'est pas dans allowedRoles[]
 *        → affiche AccessDeniedPage dans le Layout (pas de redirection, juste un écran d'erreur)
 *
 * PROPS :
 *   children      — Le contenu de la page à afficher si autorisé
 *   allowedRoles  — Tableau de rôles autorisés (ex: ['ADMIN', 'RESPONSABLE_CLUB'])
 *                   Si vide ou undefined → seule l'authentification est vérifiée
 *
 * NOTE RBAC :
 *   Utilise normalizeRole() pour corriger 'ADHERANT' → 'ADHERENT' avant la comparaison.
 */
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
