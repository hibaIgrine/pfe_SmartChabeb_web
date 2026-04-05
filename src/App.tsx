import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/auth/Home";
import Layout from "./components/layout/Layout";
import CentresPage from "./pages/admin/centres/CentresPage";
import ResponsableCentrePage from "./pages/centres/ResponsableCentrePage";
import Dashboard from "./pages/admin/Dashboard";
import MembresPage from "./pages/admin/MembresPage";
import AdherentAccessPage from "./pages/auth/AdherentAccessPage";
import AuthPage from "./pages/auth/AuthPage";
import NotFound from "./pages/auth/NotFound";
import CoachMembers from "./pages/coach/CoachMembers";
import CreateProgram from "./pages/coach/CreateProgram";
import MemberDetails from "./pages/coach/MembreDetails";
import ClubsPage from "./pages/clubs/ClubsPage";
import ClubStaffPage from "./pages/clubs/ClubStaffPage";
import ClubRequestsPage from "./pages/clubs/ClubRequestsPage";
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

function App() {
  const getCentrePage = () => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    return user?.role === "RESPONSABLE_CENTRE" ? (
      <ResponsableCentrePage />
    ) : (
      <CentresPage />
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Page d'accueil publique */}
        <Route path="/" element={<Home />} />

        {/* Page d'authentification (Login + Register) */}
        <Route path="/auth" element={<AuthPage />} />

        <Route path="/mobile-guide" element={<AdherentAccessPage />} />

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
              <ClubsPage />
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
        {/* Redirection si l'URL est fausse */}
        {/* 🏆 LA ROUTE MAGIQUE (Toujours en dernier) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
