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
