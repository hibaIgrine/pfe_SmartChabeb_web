/**
 * types.ts — Types TypeScript partagés entre toutes les pages du module événements.
 *
 * TYPES PRINCIPAUX :
 *   ClubLite            — Club simplifié (id, nom, id_centre)
 *   LocalLite           — Local simplifié avec capacité et centre parent
 *   EventTimelineStep   — Étape d'une timeline d'événement (titre, description, date)
 *   EventItem           — Événement en liste (données condensées pour les listes/calendriers)
 *   EventDetail         — Événement complet avec participants, feedbacks, timeline, local
 *   EventParticipant    — Participant à un événement avec statut INSCRIT/CONFIRME/LISTE_ATTENTE
 *   EventForm           — Formulaire de création/édition d'événement (tous les champs editables)
 *   AlertState          — État d'une alerte UI {type: 'success'|'error'|'info', message}
 */
export type ClubLite = {
  id: string;
  nom: string;
  id_centre?: string;
};

export type LocalLite = {
  id: string;
  nom: string;
  type?: string;
  capacite?: number | null;
  id_centre?: string;
  centre?: {
    id?: string;
    nom?: string;
    gouvernorat?: string;
  };
};

export type EventTimelineStep = {
  title: string;
  start_time: string;
  end_time: string;
  details?: string;
};

export type EventItem = {
  id: string;
  nom: string;
  description?: string | null;
  date_event: string;
  start_time: string;
  end_time: string;
  capacity?: number | null;
  timeline?: EventTimelineStep[] | null;
  is_active: boolean;
  club_id?: string | null;
  collaborating_club_ids?: string[];
  locaux_id: string;
  club?: { id: string; nom: string; categorie?: string } | null;
  local?: { id: string; nom: string; type?: string };
  _count?: { participants?: number };
  durationMinutes?: number;
};

export type EventDetail = EventItem & {
  participants?: EventParticipant[];
  createur?: { id: string; nom: string; prenom: string; role: string };
  ratingAverage?: number;
  ratingCount?: number;
  canRate?: boolean;
  myFeedback?: EventFeedback | null;
  recentFeedbacks?: EventFeedback[];
};

export type EventFeedback = {
  id: string;
  note: number;
  commentaire?: string | null;
  created_at?: string;
  updated_at?: string;
  user?: {
    id: string;
    nom: string;
    prenom: string;
  };
};

export type ParticipantStatus = "EN_ATTENTE" | "CONFIRME" | "REFUSE" | "ANNULE";

export type EventParticipant = {
  id: string;
  status: ParticipantStatus;
  checkin: boolean;
  created_at?: string;
  updated_at?: string;
  user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role?: string;
  };
};

export type EventForm = {
  nom: string;
  description: string;
  date_event: string;
  start_time: string;
  end_time: string;
  club_id: string;
  club_ids: string[];
  locaux_id: string;
  capacity: string;
  timeline: EventTimelineStep[];
};

export type AlertState = {
  msg: string;
  type: "success" | "error";
} | null;

export type EventPopularItem = {
  id: string;
  nom: string;
  participants: number;
  confirmed: number;
  waiting: number;
  capacity: number;
  fillRate: number;
};

export type EventDashboardStats = {
  nombreEvenements: number;
  nombreParticipants: number;
  tauxParticipation: number;
  tauxRemplissage: number;
  evenementsPopulaires: EventPopularItem[];
  participationParClub: {
    clubId: string;
    clubNom: string;
    participants: number;
    confirmed: number;
    waiting: number;
    evenements: number;
  }[];
  participationParUtilisateur: {
    userId: string;
    nom: string;
    participations: number;
    confirmees: number;
    enAttente: number;
  }[];
  frequenceEvenements: {
    periode: string;
    evenements: number;
  }[];
};
