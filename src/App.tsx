import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/auth/Home";
import Layout from "./components/layout/Layout";;
import CentresPage from "./pages/admin/CentresPage";
import Dashboard from "./pages/admin/Dashboard";
import MembresPage from "./pages/admin/MembresPage";
import AdherentAccessPage from "./pages/auth/AdherentAccessPage";
import AuthPage from "./pages/auth/AuthPage";
import NotFound from "./pages/auth/NotFound";
import CoachMembers from "./pages/coach/CoachMembers";
import CreateProgram from "./pages/coach/CreateProgram";
import MemberDetails from "./pages/coach/MembreDetails";
import ClubsPage from "./pages/clubs/ClubsPage";



function App() {
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
        <Route
          path="/centres"
          element={
            <Layout>
              <CentresPage />
            </Layout>
          }
        />
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
        {/* Redirection si l'URL est fausse */}
        {/* 🏆 LA ROUTE MAGIQUE (Toujours en dernier) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
