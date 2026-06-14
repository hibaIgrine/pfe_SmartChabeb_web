/**
 * main.tsx — Point d'entrée de l'application React (Vite).
 *
 * RÔLE :
 *   Initialise l'arbre React et le monte dans le div#root du fichier index.html.
 *
 * COMPOSANTS RACINE :
 *   StrictMode         — Active les vérifications React supplémentaires en développement
 *                        (double-rendu, détection d'API dépréciées, effets de bord non purs).
 *   GoogleOAuthProvider — Fournit le contexte OAuth2 Google à toute l'application.
 *                         clientId = VITE_GOOGLE_CLIENT_ID (variable d'environnement Vite).
 *   App                — Composant racine contenant le routeur et toutes les pages.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
