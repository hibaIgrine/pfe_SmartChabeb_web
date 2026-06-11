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
    return ROUTES.club.home;
  }

  return ROUTES.club.home;
}

export function getCurrentRoleLandingPath() {
  return getLandingPathForRole(getStoredRole());
}
