import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/auth/Home";
import Layout from "./components/layout/Layout";
import CentresPage from "./pages/admin/centres/CentresPage";
import ResponsableCentrePage from "./pages/centres/ResponsableCentrePage";
import Dashboard from "./pages/admin/Dashboard";
import MembresPage from "./pages/admin/MembresPage";
import AuthPage from "./pages/auth/AuthPage";
import SignupPage from "./pages/auth/SignupPage";
import GoogleCompleteProfile from "./pages/auth/GoogleCompleteProfile";
import NotFound from "./pages/auth/NotFound";
import CoachMembers from "./pages/coach/CoachMembers";
import CreateProgram from "./pages/coach/CreateProgram";
import MemberDetails from "./pages/coach/MembreDetails";
import ClubsPage from "./pages/clubs/ClubsPage";
import AdherentClubsPage from "./pages/clubs/AdherentClubsPage";
import AdherentClubDetailsPage from "./pages/clubs/AdherentClubDetailsPage";
import ClubStaffPage from "./pages/clubs/ClubStaffPage";
import ClubRequestsPage from "./pages/clubs/ClubRequestsPage";
import ClubCreationRequestsPage from "./pages/clubs/ClubCreationRequestsPage";
import RolesPage from "./pages/admin/roles/RolesPage";
import LocauxPage from "./pages/locaux/LocauxPage";
import LocauxPlanningPage from "./pages/locaux/LocauxPlanningPage";
import ReservationsPage from "./pages/reservations/ReservationPage";
import ClubReservationPage from "./pages/reservations/ClubReservationPage";
import ClubMyReservationsPage from "./pages/reservations/ClubMyReservationsPage";
import PresencePage from "./pages/presences/PresencePage";
import EventsPage from "./pages/events/EventsPage";
import EventRequestsPage from "./pages/events/EventRequestsPage";
import EventParticipantsPage from "./pages/events/EventParticipantsPage";
import EventWaitingListPage from "./pages/events/EventWaitingListPage";
import ProfileGamificationPage from "./pages/profile/ProfileGamificationPage";
import MyProfilePage from "./pages/profile/MyProfilePage";
import UserProfilePage from "./pages/profile/UserProfilePage";
import SocialFeedPage from "./pages/social-media/SocialFeedPage";
import MessageriePage from "./pages/messagerie/MessageriePage";

function App() {
  const getCentrePage = () => {
    const userStr = localStorage.getItem("user");
    let user = null;

    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch {
      localStorage.removeItem("user");
    }

    return user?.role === "RESPONSABLE_CENTRE" ? (
      <ResponsableCentrePage />
    ) : (
      <CentresPage />
    );
  };

  const getClubsPage = () => {
    const userStr = localStorage.getItem("user");
    let user = null;

    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch {
      localStorage.removeItem("user");
    }

    return user?.role === "ADHERENT" || user?.role === "ADHERANT" ? (
      <AdherentClubsPage />
    ) : (
      <ClubsPage />
    );
  };

  const getClubDetailsPage = () => {
    const userStr = localStorage.getItem("user");
    let user = null;

    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch {
      localStorage.removeItem("user");
    }

    return user?.role === "ADHERENT" || user?.role === "ADHERANT" ? (
      <AdherentClubDetailsPage />
    ) : (
      <NotFound />
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Page d'accueil publique */}
        <Route path="/" element={<Home />} />

        {/* Page d'authentification (Login + Register) */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route
          path="/auth/complete-google"
          element={<GoogleCompleteProfile />}
        />

        {/* Espace Privé Admin/Coach */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route path="/centres" element={<Layout>{getCentrePage()}</Layout>} />
        <Route
          path="/membres"
          element={
            <Layout>
              <MembresPage />
            </Layout>
          }
        />
        <Route
          path="/coach-members"
          element={
            <Layout>
              <CoachMembers />
            </Layout>
          }
        />
        {/* NOUVELLE ROUTE : Création de programme */}
        <Route
          path="/create-program/:idMember"
          element={
            <Layout>
              <CreateProgram />
            </Layout>
          }
        />
        <Route
          path="/member-details/:id"
          element={
            <Layout>
              <MemberDetails />
            </Layout>
          }
        />
        <Route
          path="/clubs"
          element={
            <Layout>
              {getClubsPage()}
            </Layout>
          }
        />
        <Route
          path="/clubs/:clubId/requests"
          element={
            <Layout>
              <ClubRequestsPage />
            </Layout>
          }
        />
        <Route
          path="/clubs/:clubId"
          element={<Layout>{getClubDetailsPage()}</Layout>}
        />
        <Route
          path="/club-creation-requests"
          element={
            <Layout>
              <ClubCreationRequestsPage />
            </Layout>
          }
        />
        <Route
          path="/clubs/:clubId/staff"
          element={
            <Layout>
              <ClubStaffPage />
            </Layout>
          }
        />
        <Route
          path="/roles"
          element={
            <Layout>
              <RolesPage />
            </Layout>
          }
        />
        <Route
          path="/locaux"
          element={
            <Layout>
              <LocauxPage />
            </Layout>
          }
        />
        <Route
          path="/locaux-planning"
          element={
            <Layout>
              <LocauxPlanningPage />
            </Layout>
          }
        />
        <Route
          path="/reservations"
          element={
            <Layout>
              <ReservationsPage />
            </Layout>
          }
        />
        <Route
          path="/club-reservations"
          element={
            <Layout>
              <ClubReservationPage />
            </Layout>
          }
        />
        <Route
          path="/club-my-reservations"
          element={
            <Layout>
              <ClubMyReservationsPage />
            </Layout>
          }
        />
        <Route
          path="/presences"
          element={
            <Layout>
              <PresencePage />
            </Layout>
          }
        />
        <Route
          path="/events"
          element={
            <Layout>
              <EventsPage />
            </Layout>
          }
        />
        <Route
          path="/events-requests"
          element={
            <Layout>
              <EventRequestsPage />
            </Layout>
          }
        />
        <Route
          path="/events-participants"
          element={
            <Layout>
              <EventParticipantsPage />
            </Layout>
          }
        />
        <Route
          path="/events-waiting-list"
          element={
            <Layout>
              <EventWaitingListPage />
            </Layout>
          }
        />
        <Route
          path="/mon-profil"
          element={
            <Layout>
              <MyProfilePage />
            </Layout>
          }
        />
        <Route
          path="/utilisateurs/:id"
          element={
            <Layout>
              <UserProfilePage />
            </Layout>
          }
        />
        <Route
          path="/profile"
          element={
            <Layout>
              <ProfileGamificationPage />
            </Layout>
          }
        />
        <Route
          path="/fil-actualite"
          element={
            <Layout>
              <SocialFeedPage />
            </Layout>
          }
        />
        <Route
          path="/messagerie"
          element={
            <Layout>
              <MessageriePage />
            </Layout>
          }
        />
        {/* Redirection si l'URL est fausse */}
        {/* 🏆 LA ROUTE MAGIQUE (Toujours en dernier) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
