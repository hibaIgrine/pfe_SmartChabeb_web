import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CentresPage from "./pages/CentresPage"; // Importe ta page de gestion
import Layout from "./components/Layout"; // Importe ton Layout
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Page d'accueil publique */}
        <Route path="/" element={<Home />} />

        {/* Page d'authentification (Login + Register) */}
        <Route path="/auth" element={<AuthPage />} />

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

        {/* Redirection si l'URL est fausse */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;