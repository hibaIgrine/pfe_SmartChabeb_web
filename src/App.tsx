import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CentresPage from "./pages/CentresPage"; // Importe ta page de gestion
import Layout from "./components/Layout"; // Importe ton Layout

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Routes privées (Admin) enveloppées dans le Layout */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <h1 className="text-2xl font-bold">
                Bienvenue sur le tableau de bord SmartChabeb
              </h1>
              <p className="mt-4">
                Sélectionnez une option dans le menu à gauche.
              </p>
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

        {/* Redirection par défaut */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
