/**
 * recommendations.ts — Appels API pour le système de recommandation ML.
 *
 * RÔLE :
 *   Interface frontend complète avec le pipeline ML :
 *   Frontend → NestJS /sessions + /recommendations → Flask /predict → scikit-learn.
 *
 * INTERFACE SessionPayload (les 30 features ML) :
 *   Correspond exactement aux champs attendus par le CreateSessionDto NestJS.
 *   Voir backend/src/sessions/dto/create-session.dto.ts pour la description détaillée
 *   de chaque feature et son rôle dans le modèle ML.
 *
 * FLUX D'UTILISATION (ClubRecommendationPage) :
 *   1. createSession(payload)            → Crée la session en BDD, retourne { id, ... }
 *   2. getRecommendation(sessionId)      → NestJS appelle Flask, retourne les top-k activités
 *                                           { recommandations: [{activite, probabilite}], modele_utilise }
 *   3. getSessionRecommendations(id)     → Historique des prédictions pour une session
 *   4. chooseActivity(recoId, activite)  → Le coach valide son choix → feedback loop ML
 *
 * FONCTIONS EXPORTÉES :
 *   createSession(data)               — POST /sessions (crée une séance ML)
 *   getSessions()                     — GET /sessions (liste toutes les sessions)
 *   getRecommendation(sessionId)      — POST /recommendations/session/:id (demande ML)
 *   getSessionRecommendations(id)     — GET /recommendations/session/:id (historique)
 *   chooseActivity(recoId, activite)  — PATCH /recommendations/:id/choose (choix coach)
 */
import axios from "./axios";

export interface SessionPayload {
  club_id: string;
  tranche_age: string;
  niveau: string;
  num_seance: number;
  phase_annee: string;
  saison: string;
  mois: number;
  jour_semaine: string;
  format_seance: string;
  lieu: string;
  duree_minutes: number;
  activite_j_minus_2?: string;
  activite_precedente?: string;
  activite_actuelle: string;
  difficulte: string;
  niveau_fatigue: string;
  humeur_groupe: string;
  score_engagement: number;
  nb_membres_total: number;
  nb_presents: number;
  taux_presence: number;
  note_technique: number;
  note_comportement: number;
  evaluation_coach: string;
  progression_observee: string;
  meteo: string;
  activite_exterieure?: string;
  repetition_activite?: number;
  sequence_logique?: number;
}

// 1. Créer la séance
export const createSession = (data: SessionPayload) =>
  axios.post("/sessions", data).then((r) => r.data);

export const getSessions = () => axios.get("/sessions").then((r) => r.data);

// 2. Obtenir recommandation pour une séance
export const getRecommendation = (sessionId: number) =>
  axios.post(`/recommendations/session/${sessionId}`).then((r) => r.data);

// 3. Historique des recommandations d'une séance
export const getSessionRecommendations = (sessionId: number) =>
  axios.get(`/recommendations/session/${sessionId}`).then((r) => r.data);

// 4. Enregistrer le choix du responsable
export const chooseActivity = (recoId: number, activite: string) =>
  axios
    .patch(`/recommendations/${recoId}/choose`, { activite })
    .then((r) => r.data);
