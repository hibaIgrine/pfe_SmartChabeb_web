import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Home from "./pages/auth/Home";
import Layout from "./components/layout/Layout";
import CentresPage from "./pages/admin/centres/CentresPage";
import ResponsableCentrePage from "./pages/centres/ResponsableCentrePage";
import Dashboard from "./pages/admin/Dashboard";
import MembresPage from "./pages/admin/MembresPage";
import ReservationRevenuePage from "./pages/admin/reservations/ReservationRevenuePage";
import CentreReservationRevenuePage from "./pages/reservations/CentreReservationRevenuePage";
import AuthPage from "./pages/auth/AuthPage";
import SignupPage from "./pages/auth/SignupPage";
import GoogleCompleteProfile from "./pages/auth/GoogleCompleteProfile";
import NotFound from "./pages/auth/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import ClubsPage from "./pages/clubs/ClubsPage";
import AdherentClubDetailsPage from "./pages/clubs/AdherentClubDetailsPage";
import MyAllRequestsPage from "./pages/clubs/MyAllRequestsPage";
import ClubStaffPage from "./pages/clubs/ClubStaffPage";
import ManagedClubDetailsPage from "./pages/clubs/ManagedClubDetailsPage";
import ClubRequestsPage from "./pages/clubs/ClubRequestsPage";
import ClubCreationRequestsPage from "./pages/clubs/ClubCreationRequestsPage";
import ClubTasksPage from "./pages/clubs/ClubTasksPage";
import ClubRecommendationPage from "./pages/clubs/ClubRecommendationPage";
import StaffClubTasksPage from "./pages/clubs/StaffClubTasksPage";
import StaffCalendarPage from "./pages/clubs/StaffCalendarPage";
import RolesPage from "./pages/admin/roles/RolesPage";
import LocauxPage from "./pages/locaux/LocauxPage";
import LocauxPlanningPage from "./pages/locaux/LocauxPlanningPage";
import ReservationsPage from "./pages/reservations/CentreManagerReservationsPage";
import ClubReservationPage from "./pages/reservations/ClubReservationPage";
import ClubMyReservationsPage from "./pages/reservations/ClubMyReservationsPage";
import PaymentHistoryPage from "./pages/paiements/PaymentHistoryPage";
import PaymentSuccessPage from "./pages/paiements/PaymentSuccessPage";
import AdherentMyReservationsPage from "./pages/reservations/AdherentMyReservationsPage";
import AdherentCertificatesPage from "./pages/certificates/AdherentCertificatesPage";
import PresencePage from "./pages/presences/PresencePage";
import AdherentSeancesPage from "./pages/presences/AdherentSeancesPage";
import ClubFeedbacksPage from "./pages/presences/ClubFeedbacksPage";
import EventsPage from "./pages/events/EventsPage";
import AdminEventsStatsPage from "./pages/events/AdminEventsStatsPage";
import ClubEventsRequestsPage from "./pages/events/ClubEventsRequestsPage";
import CentreEventsRequestsPage from "./pages/events/CentreEventsRequestsPage";
import EventRequestsPage from "./pages/events/EventRequestsPage";
import EventParticipantsPage from "./pages/events/EventParticipantsPage";
import EventWaitingListPage from "./pages/events/EventWaitingListPage";
import EventsManagerPage from "./pages/events/EventsManagerPage";
import AdherentEventsPage from "./pages/events/AdherentEventsPage";
import EventDetailsPage from "./pages/events/EventDetailsPage";
import ProfileGamificationPage from "./pages/profile/ProfileGamificationPage";
import MyProfilePage from "./pages/profile/MyProfilePage";
import UserProfilePage from "./pages/profile/UserProfilePage";
import SocialFeedPage from "./pages/social-media/SocialFeedPage";
import MessageriePage from "./pages/messagerie/MessageriePage";
import Chat from "./pages/chatbot/chat";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES, getLandingPathForRole } from "./constants/routes";
import {
  AUTH_SESSION_INVALIDATED_EVENT,
  AUTH_USER_UPDATED_EVENT,
  getStoredRole,
} from "./utils/authSession";

const ADMIN_ONLY = ["ADMIN"];
const ADMIN_OR_CLUB = ["ADMIN", "RESPONSABLE_CLUB"];
const ADMIN_OR_CLUB_OR_CENTRE = ["ADMIN", "RESPONSABLE_CLUB", "RESPONSABLE_CENTRE"];
const ADMIN_OR_ANY_MEMBER = [
  "ADMIN",
  "RESPONSABLE_CENTRE",
  "RESPONSABLE_CLUB",
  "ADHERENT",
];
const ADMIN_OR_ADHERENT = ["ADMIN", "ADHERENT"];
const CENTRE_ONLY = ["RESPONSABLE_CENTRE"];
const CLUB_ONLY = ["RESPONSABLE_CLUB"];
const ADHERENT_ONLY = ["ADHERENT"];
const ADHERENT_OR_CENTRE = ["ADHERENT", "RESPONSABLE_CENTRE"];

function withAccess(allowedRoles: string[], element: React.ReactNode) {
  return <ProtectedRoute allowedRoles={allowedRoles}>{element}</ProtectedRoute>;
}

function LegacyLandingRedirect() {
  return <Navigate to={getLandingPathForRole(getStoredRole())} replace />;
}

function LegacyCentreRedirect() {
  const role = getStoredRole();

  if (role === "ADMIN") {
    return <Navigate to={ROUTES.admin.centres} replace />;
  }

  return <Navigate to={ROUTES.centre.home} replace />;
}

function LegacyMembresRedirect() {
  const role = getStoredRole();

  if (role === "RESPONSABLE_CENTRE") {
    return <Navigate to={ROUTES.centre.membres} replace />;
  }

  return <Navigate to={ROUTES.admin.membres} replace />;
}

function SessionRedirectListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionInvalidated = () => {
      navigate("/auth", { replace: true });
    };

    window.addEventListener(
      AUTH_SESSION_INVALIDATED_EVENT,
      handleSessionInvalidated as EventListener,
    );

    return () => {
      window.removeEventListener(
        AUTH_SESSION_INVALIDATED_EVENT,
        handleSessionInvalidated as EventListener,
      );
    };
  }, [navigate]);

  return null;
}

function App() {
  const [, setSessionRevision] = useState(0);

  useEffect(() => {
    const bumpRevision = () => {
      setSessionRevision((value) => value + 1);
    };

    window.addEventListener("storage", bumpRevision);
    window.addEventListener(AUTH_USER_UPDATED_EVENT, bumpRevision);
    window.addEventListener(AUTH_SESSION_INVALIDATED_EVENT, bumpRevision);

    return () => {
      window.removeEventListener("storage", bumpRevision);
      window.removeEventListener(AUTH_USER_UPDATED_EVENT, bumpRevision);
      window.removeEventListener(AUTH_SESSION_INVALIDATED_EVENT, bumpRevision);
    };
  }, []);

  return (
    <BrowserRouter>
      <SessionRedirectListener />
      <Routes>
        {/* Page d'accueil publique */}
        <Route path={ROUTES.public.home} element={<Home />} />

        {/* Page d'authentification (Login + Register) */}
        <Route path={ROUTES.public.auth} element={<AuthPage />} />
        <Route path={ROUTES.public.signup} element={<SignupPage />} />
        <Route
          path={ROUTES.public.completeGoogleProfile}
          element={<GoogleCompleteProfile />}
        />

        {/* Espace Privé Admin/Coach */}
        <Route
          path={ROUTES.admin.dashboard}
          element={withAccess(
            ADMIN_ONLY,
            <Layout>
              <Dashboard />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.admin.reservationRevenues}
          element={withAccess(
            ADMIN_ONLY,
            <Layout>
              <ReservationRevenuePage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.centre.reservationRevenues}
          element={withAccess(
            CENTRE_ONLY,
            <Layout>
              <CentreReservationRevenuePage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.admin.centres}
          element={withAccess(
            ADMIN_ONLY,
            <Layout>
              <CentresPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.centre.home}
          element={withAccess(
            CENTRE_ONLY,
            <Layout>
              <ResponsableCentrePage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.admin.membres}
          element={withAccess(
            ADMIN_ONLY,
            <Layout>
              <MembresPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.centre.membres}
          element={withAccess(
            CENTRE_ONLY,
            <Layout>
              <MembresPage />
            </Layout>,
          )}
        />

        {/* NOUVELLE ROUTE : Création de programme */}

        <Route
          path={ROUTES.club.home}
          element={withAccess(
            ["ADMIN", "RESPONSABLE_CENTRE", "RESPONSABLE_CLUB", "ADHERENT"],
            <Layout>
              <ClubsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.club.requests}
          element={withAccess(
            ADMIN_OR_CLUB_OR_CENTRE,
            <Layout>
              <ClubRequestsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.club.details}
          element={withAccess(
            ["ADMIN", "ADHERENT"],
            <Layout>
              <AdherentClubDetailsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.adherent.myClubRequests}
          element={withAccess(
            ADHERENT_ONLY,
            <Layout>
              <MyAllRequestsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.club.creationRequests}
          element={withAccess(
            ADHERENT_OR_CENTRE,
            <Layout>
              <ClubCreationRequestsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.club.staff}
          element={withAccess(
            ADMIN_OR_CLUB_OR_CENTRE,
            <Layout>
              <ClubStaffPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.club.managedDetails}
          element={withAccess(
            ADMIN_OR_CLUB,
            <Layout>
              <ManagedClubDetailsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.club.tasks}
          element={withAccess(
            ADMIN_OR_CLUB,
            <Layout>
              <ClubTasksPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.club.feedbacks}
          element={withAccess(
            ADMIN_OR_CLUB,
            <Layout>
              <ClubFeedbacksPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.club.staffTasks}
          element={withAccess(
            ADMIN_OR_CLUB,
            <Layout>
              <StaffClubTasksPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.club.staffCalendar}
          element={withAccess(
            CLUB_ONLY,
            <Layout>
              <StaffCalendarPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.club.recommendations}
          element={withAccess(
            ADHERENT_ONLY,
            <Layout>
              <ClubRecommendationPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.admin.roles}
          element={withAccess(
            ADMIN_ONLY,
            <Layout>
              <RolesPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.centre.locaux}
          element={withAccess(
            CENTRE_ONLY,
            <Layout>
              <LocauxPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.centre.locauxPlanning}
          element={withAccess(
            CENTRE_ONLY,
            <Layout>
              <LocauxPlanningPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.centre.reservations}
          element={withAccess(
            CENTRE_ONLY,
            <Layout>
              <ReservationsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.club.clubReservations}
          element={withAccess(
            CLUB_ONLY,
            <Layout>
              <ClubReservationPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.club.clubMyReservations}
          element={withAccess(
            CLUB_ONLY,
            <Layout>
              <ClubMyReservationsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.shared.paymentHistory}
          element={withAccess(
            ADMIN_OR_ADHERENT,
            <Layout>
              <PaymentHistoryPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.shared.paymentSuccess}
          element={<PaymentSuccessPage />}
        />
        <Route
          path={ROUTES.adherent.myReservations}
          element={withAccess(
            ADMIN_OR_ADHERENT,
            <Layout>
              <AdherentMyReservationsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.adherent.certificates}
          element={withAccess(
            ADMIN_OR_ADHERENT,
            <Layout>
              <AdherentCertificatesPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.adherent.presences}
          element={withAccess(
            ADMIN_OR_ADHERENT,
            <Layout>
              <PresencePage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.adherent.events}
          element={withAccess(
            ADMIN_OR_ADHERENT,
            <Layout>
              <AdherentEventsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.adherent.eventDetails}
          element={withAccess(
            ADMIN_OR_ADHERENT,
            <Layout>
              <EventDetailsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.adherent.seances}
          element={withAccess(
            ADMIN_OR_ADHERENT,
            <Layout>
              <AdherentSeancesPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.centre.eventsManagement}
          element={withAccess(
            CENTRE_ONLY,
            <Layout>
              <EventsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.admin.eventsManagement}
          element={withAccess(
            ADMIN_ONLY,
            <Layout>
              <EventsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.admin.eventsStats}
          element={withAccess(
            ADMIN_ONLY,
            <Layout>
              <AdminEventsStatsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.club.clubEventsRequests}
          element={withAccess(
            CLUB_ONLY,
            <Layout>
              <ClubEventsRequestsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.centre.centreEventsRequests}
          element={withAccess(
            CENTRE_ONLY,
            <Layout>
              <CentreEventsRequestsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.centre.eventRequests}
          element={withAccess(
            CENTRE_ONLY,
            <Layout>
              <EventRequestsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.centre.eventParticipants}
          element={withAccess(
            CENTRE_ONLY,
            <Layout>
              <EventParticipantsPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.centre.eventWaitingList}
          element={withAccess(
            CENTRE_ONLY,
            <Layout>
              <EventWaitingListPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.centre.eventsManager}
          element={withAccess(
            CENTRE_ONLY,
            <Layout>
              <EventsManagerPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.shared.profile}
          element={withAccess(
            ADMIN_OR_ANY_MEMBER,
            <Layout>
              <MyProfilePage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.shared.userProfile}
          element={withAccess(
            ADMIN_OR_ANY_MEMBER,
            <Layout>
              <UserProfilePage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.shared.gamification}
          element={withAccess(
            ADMIN_OR_ANY_MEMBER,
            <Layout>
              <ProfileGamificationPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.shared.feed}
          element={withAccess(
            ADMIN_OR_ANY_MEMBER,
            <Layout>
              <SocialFeedPage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.shared.messaging}
          element={withAccess(
            ADMIN_OR_ANY_MEMBER,
            <Layout>
              <MessageriePage />
            </Layout>,
          )}
        />
        <Route
          path={ROUTES.shared.chatbot}
          element={withAccess(
            ADMIN_OR_ANY_MEMBER,
            <Layout>
              <Chat />
            </Layout>,
          )}
        />
        <Route path="/membres" element={<LegacyMembresRedirect />} />
        <Route path="/dashboard" element={<LegacyLandingRedirect />} />
        <Route
          path="/reservation-revenues"
          element={<Navigate to={ROUTES.admin.reservationRevenues} replace />}
        />
        <Route path="/centres" element={<LegacyCentreRedirect />} />
        <Route
          path="/locaux"
          element={<Navigate to={ROUTES.centre.locaux} replace />}
        />
        <Route
          path="/locaux-planning"
          element={<Navigate to={ROUTES.centre.locauxPlanning} replace />}
        />
        <Route
          path="/reservations"
          element={<Navigate to={ROUTES.centre.reservations} replace />}
        />
        <Route
          path="/events-management"
          element={<Navigate to={ROUTES.centre.eventsManagement} replace />}
        />
        <Route
          path="/centre-events-requests"
          element={<Navigate to={ROUTES.centre.centreEventsRequests} replace />}
        />
        <Route
          path="/events-requests"
          element={<Navigate to={ROUTES.centre.eventRequests} replace />}
        />
        <Route
          path="/events-participants"
          element={<Navigate to={ROUTES.centre.eventParticipants} replace />}
        />
        <Route
          path="/events-waiting-list"
          element={<Navigate to={ROUTES.centre.eventWaitingList} replace />}
        />
        <Route
          path="/events-manager"
          element={<Navigate to={ROUTES.centre.eventsManager} replace />}
        />
        <Route
          path="/payment-success"
          element={<Navigate to={ROUTES.shared.paymentSuccess} replace />}
        />
        {/* Redirection si l'URL est fausse */}
        {/* 🏆 LA ROUTE MAGIQUE (Toujours en dernier) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
