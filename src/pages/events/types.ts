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
};

export type EventItem = {
  id: string;
  nom: string;
  description?: string | null;
  date_event: string;
  start_time: string;
  end_time: string;
  capacity?: number | null;
  is_active: boolean;
  club_id: string;
  locaux_id: string;
  club?: { id: string; nom: string; categorie?: string };
  local?: { id: string; nom: string; type?: string };
  _count?: { participants?: number };
  durationMinutes?: number;
};

export type EventDetail = EventItem & {
  participants?: EventParticipant[];
  createur?: { id: string; nom: string; prenom: string; role: string };
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
  locaux_id: string;
  capacity: string;
  recurrence_type: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  recurrence_count: string;
  recurrence_until: string;
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
};
