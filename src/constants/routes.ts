/**
 * routes.ts — Table de correspondance centralisée de toutes les URLs de l'application.
 *
 * RÔLE :
 *   Évite les URLs "magiques" dispersées dans le code. Toute navigation doit utiliser
 *   ces constantes pour faciliter les refactorisations et détecter les routes cassées.
 *
 * ORGANISATION PAR RÔLE :
 *   public   — Pages accessibles sans authentification (accueil, login, signup, Google OAuth)
 *   admin    — Espace ADMIN (dashboard, centres, membres, rôles, événements, revenus)
 *   centre   — Espace RESPONSABLE_CENTRE (locaux, réservations, événements, membres)
 *   club     — Espace RESPONSABLE_CLUB + partiel ADHERENT (clubs, tâches, réservations…)
 *   adherent — Espace ADHERENT (réservations, certificats, présences, événements, séances)
 *   shared   — Pages communes à tous les rôles (profil, feed, messagerie, chatbot, paiements)
 *
 * FONCTIONS EXPORTÉES :
 *   getLandingPathForRole(role) — Retourne la page d'accueil par défaut selon le rôle
 *                                 (ADMIN → /admin/dashboard, CENTRE → /centre/mon-centre,
 *                                  CLUB → /mon-club, ADHERENT → /clubs)
 *   getCurrentRoleLandingPath() — Même chose mais depuis le localStorage (user connecté)
 *
 * NOTE :
 *   Les routes contenant `:id` ou `:clubId` sont des patterns React Router v7.
 *   Utiliser la fonction `generatePath()` de React Router pour les construire avec une valeur réelle.
 */
import { getStoredRole } from "../utils/authSession";

export const ROUTES = {
  public: {
    home: "/",
    auth: "/auth",
    signup: "/auth/signup",
    completeGoogleProfile: "/auth/complete-google",
  },
  admin: {
    dashboard: "/admin/dashboard",
    centres: "/admin/centres",
    membres: "/admin/membres",
    reservationRevenues: "/admin/reservation-revenues",
    roles: "/admin/roles",
    eventsManagement: "/admin/events-management",
    eventsStats: "/admin/events-stats",
    eventDetail: "/admin/events/:id/detail",
  },
  centre: {
    home: "/centre/mon-centre",
    membres: "/centre/membres",
    locaux: "/centre/locaux",
    locauxPlanning: "/centre/locaux-planning",
    reservations: "/centre/reservations",
    reservationRevenues: "/centre/reservation-revenues",
    eventsManagement: "/centre/events-management",
    eventsStats: "/centre/events-stats",
    eventDetail: "/centre/events/:id/detail",
    centreEventsRequests: "/centre/centre-events-requests",
    eventRequests: "/centre/events-requests",
    eventParticipants: "/centre/events-participants",
    eventWaitingList: "/centre/events-waiting-list",
    eventsManager: "/centre/events-manager",
  },
  club: {
    home: "/clubs",
    myClubLanding: "/mon-club",
    staff: "/clubs/:clubId/staff",
    requests: "/clubs/:clubId/requests",
    details: "/clubs/:clubId",
    managedDetails: "/my-clubs/:clubId",
    tasks: "/my-clubs/:clubId/tasks",
    feedbacks: "/my-clubs/:clubId/feedbacks",
    staffTasks: "/my-clubs/:clubId/staff-tasks",
    staffCalendar: "/staff-calendar",
    recommendations: "/club-recommendations",
    creationRequests: "/club-creation-requests",
    clubReservations: "/club-reservations",
    clubMyReservations: "/club-my-reservations",
    clubEventsRequests: "/club-events-requests",
    eventsManager: "/club-events-manager",
    eventsManagement: "/club-events-management",
    eventDetail: "/club/events/:id/detail",
  },
  adherent: {
    myClubRequests: "/my-club-requests",
    myReservations: "/adherent-my-reservations",
    certificates: "/certificats",
    presences: "/presences",
    events: "/events",
    eventDetails: "/events/:id",
    seances: "/mes-seances",
  },
  shared: {
    paymentHistory: "/payment-history",
    paymentSuccess: "/payment-success",
    profile: "/mon-profil",
    userProfile: "/utilisateurs/:id",
    gamification: "/profile",
    feed: "/fil-actualite",
    messaging: "/messagerie",
    chatbot: "/chatbot",
  },
} as const;

export function getLandingPathForRole(role?: string | null) {
  const normalizedRole = role === "ADHERANT" ? "ADHERENT" : role;

  if (normalizedRole === "ADMIN") {
    return ROUTES.admin.dashboard;
  }

  if (normalizedRole === "RESPONSABLE_CENTRE") {
    return ROUTES.centre.home;
  }

  if (normalizedRole === "RESPONSABLE_CLUB") {
    return ROUTES.club.myClubLanding;
  }

  return ROUTES.club.home;
}

export function getCurrentRoleLandingPath() {
  return getLandingPathForRole(getStoredRole());
}
