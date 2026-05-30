import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import api from "../../api/axios";
import {
  createSession,
  getRecommendation,
  getSessionRecommendations,
  getSessions,
} from "../../api/recommendations";
import { RecommendationCard } from "../../components/layout/RecommendationCard";

type ClubRecord = {
  id: string;
  nom: string;
  categorie?: string | null;
  locale_fixe?: string | null;
  locale?: string | null;
  id_responsable?: string | null;
  centre?: { nom?: string | null } | null;
  _count?: { inscriptions?: number };
};

type ManagedClubEntry = {
  id?: string;
  club?: ClubRecord;
  nom?: string;
  categorie?: string | null;
  locale_fixe?: string | null;
  locale?: string | null;
  center?: { nom?: string | null } | null;
  centre?: { nom?: string | null } | null;
  _count?: { inscriptions?: number };
};

type SessionRecord = {
  id: number;
  club_id: string;
  num_seance: number;
  activite_actuelle: string;
  activite_choisie: string | null;
  created_at: string;
};

type Recommendation = {
  id: number;
  sessionId: number;
  recommandations: { activite: string; probabilite: number }[];
  modele_utilise: string;
  activite_choisie: string | null;
  created_at: string;
};

type FormState = {
  tranche_age: string;
  niveau: string;
  phase_annee: string;
  format_seance: string;
  duree_minutes: string;
  activite_actuelle: string;
  activite_exterieure: string;
  repetition_activite: string;
  sequence_logique: string;
  difficulte: string;
  niveau_fatigue: string;
  humeur_groupe: string;
  score_engagement: string;
  nb_presents: string;
  note_technique: string;
  note_comportement: string;
  evaluation_coach: string;
  progression_observee: string;
  meteo: string;
};

const AGE_RANGES = ["12-15", "15-19", "17-25", "25-30", "30+"];
const LEVELS = ["Débutant", "Intermédiaire", "Avancé"];
const PHASES = ["Début", "Milieu", "Fin"];
const FORMAT_OPTIONS = [
  "Atelier pratique",
  "Cours magistral",
  "Travail en groupe",
  "Projet",
  "Individuel",
  "Demonstration",
  "Competition",
  "Mixte",
  "Jeu pedagogique",
  "Debat",
];
const DIFFICULTIES = [
  "Très facile",
  "Facile",
  "Modéré",
  "Difficile",
  "Très difficile",
];
const FATIGUE_LEVELS = [
  "Très faible",
  "Faible",
  "Modéré",
  "Élevé",
  "Très élevé",
];
const GROUP_MOODS = [
  "Agité",
  "Motivé",
  "Calme",
  "Distrait",
  "Concentré",
  "Fatigué",
  "Enthousiaste",
];
const COACH_EVALS = [
  "Insuffisant",
  "À améliorer",
  "Moyen",
  "Bien",
  "Très bien",
  "Excellent",
];
const PROGRESSIONS = [
  "En régression",
  "Stable",
  "Légère progression",
  "Bonne progression",
  "Excellente progression",
];
const WEATHER_OPTIONS = [
  "Ensoleillé",
  "Orageux",
  "Froid",
  "Pluvieux",
  "Chaud",
  "Nuageux",
  "Doux",
  "Venteux",
];

function getStoredUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    const user = JSON.parse(raw);
    return {
      ...user,
      role: user?.role === "ADHERANT" ? "ADHERENT" : user?.role,
    };
  } catch {
    return null;
  }
}

function getDateContext(date = new Date()) {
  const days = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const month = date.getMonth() + 1;
  return {
    month,
    monthLabel: months[date.getMonth()],
    dayLabel: days[date.getDay()],
    season:
      month === 12 || month <= 2
        ? "Hiver"
        : month <= 5
          ? "Printemps"
          : month <= 8
            ? "Été"
            : "Automne",
    suggestedPhase: month <= 4 ? "Début" : month <= 8 ? "Milieu" : "Fin",
  };
}

function createEmptyForm(defaultPhase = "Début"): FormState {
  return {
    tranche_age: "",
    niveau: "",
    phase_annee: defaultPhase,
    format_seance: "",
    duree_minutes: "90",
    activite_actuelle: "",
    activite_exterieure: "Non",
    repetition_activite: "0",
    sequence_logique: "1",
    difficulte: "",
    niveau_fatigue: "",
    humeur_groupe: "",
    score_engagement: "5",
    nb_presents: "",
    note_technique: "",
    note_comportement: "",
    evaluation_coach: "",
    progression_observee: "",
    meteo: "",
  };
}

function fieldClassName(readOnly = false) {
  return [
    "w-full rounded-2xl border px-3 py-2 text-sm outline-none transition",
    readOnly
      ? "border-[#D7E3DE] bg-[#F4F8F5] text-[#436D75]"
      : "border-gray-300 bg-white text-gray-800 focus:border-[#E98A7D] focus:ring-2 focus:ring-[#E98A7D]/25",
  ].join(" ");
}

function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
      {children}
    </label>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_14px_40px_rgba(67,109,117,0.08)] backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black uppercase tracking-[0.18em] text-[#436D75]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        <div className="rounded-full bg-[#F6E7E3] p-2 text-[#E98A7D]">
          <Sparkles size={16} />
        </div>
      </div>
      {children}
    </section>
  );
}

function ReadOnlyBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className={fieldClassName(true)}>{value}</div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "-- Choisir --",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName()}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={fieldClassName()}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className={fieldClassName()}
      />
    </div>
  );
}

export default function ClubRecommendationPage() {
  const currentUser = getStoredUser();
  const dateContext = useMemo(() => getDateContext(new Date()), []);

  const [clubs, setClubs] = useState<ClubRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [form, setForm] = useState<FormState>(
    createEmptyForm(dateContext.suggestedPhase),
  );
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [prediction, setPrediction] = useState<Recommendation | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState("");
  const [history, setHistory] = useState<Recommendation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const previousClubIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setBootstrapLoading(true);
      try {
        const [clubsResponse, sessionsResponse] = await Promise.all([
          api.get("/presences/my-clubs"),
          getSessions(),
        ]);

        const managedClubs = (
          Array.isArray(clubsResponse.data) ? clubsResponse.data : []
        )
          .map((entry: ManagedClubEntry) => {
            const club = entry.club ?? entry;
            return {
              id: club.id ?? entry.id ?? "",
              nom: club.nom ?? entry.nom ?? "Club sans nom",
              categorie: club.categorie ?? entry.categorie ?? null,
              locale_fixe: club.locale_fixe ?? entry.locale_fixe ?? null,
              locale: club.locale ?? entry.locale ?? null,
              centre: club.centre ?? entry.centre ?? entry.center ?? null,
              _count: club._count ?? entry._count ?? { inscriptions: 0 },
            } as ClubRecord;
          })
          .filter((club: ClubRecord) => Boolean(club.id));

        setClubs(managedClubs);
        setSessions(Array.isArray(sessionsResponse) ? sessionsResponse : []);

        if (managedClubs.length > 0) {
          setSelectedClubId((previous) => previous || managedClubs[0].id);
        }
      } catch (error) {
        console.error("Erreur de chargement", error);
      } finally {
        setBootstrapLoading(false);
      }
    };

    void loadData();
  }, [currentUser?.id]);

  const selectedClub = useMemo(
    () => clubs.find((club) => club.id === selectedClubId) || null,
    [clubs, selectedClubId],
  );

  const autoContext = useMemo(() => {
    const clubSessions = sessions
      .filter((session) => session.club_id === selectedClubId)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

    const latest = clubSessions[clubSessions.length - 1] || null;
    const previous = clubSessions[clubSessions.length - 2] || null;
    const nextSessionNumber = clubSessions.length
      ? Math.max(
          ...clubSessions.map((session) => Number(session.num_seance) || 0),
        ) + 1
      : 1;

    const totalMembers =
      selectedClub?._count?.inscriptions ??
      selectedClub?._count?.inscriptions ??
      0;

    return {
      clubName: selectedClub?.nom || "—",
      domaine: selectedClub?.categorie || "—",
      local:
        selectedClub?.locale_fixe ||
        selectedClub?.locale ||
        selectedClub?.centre?.nom ||
        "—",
      totalMembers,
      nextSessionNumber,
      previousActivity: previous?.activite_actuelle || "Aucune",
      activityBeforePrevious: latest?.activite_actuelle || "Aucune",
      suggestedNextActivity: latest?.activite_choisie || "",
      month: dateContext.month,
      monthLabel: dateContext.monthLabel,
      dayLabel: dateContext.dayLabel,
      season: dateContext.season,
    };
  }, [dateContext, selectedClub, selectedClubId, sessions]);

  useEffect(() => {
    if (!selectedClubId) {
      return;
    }

    if (previousClubIdRef.current === selectedClubId) {
      return;
    }

    previousClubIdRef.current = selectedClubId;

    setForm({
      ...createEmptyForm(dateContext.suggestedPhase),
      activite_actuelle: autoContext.suggestedNextActivity || "",
    });
  }, [
    selectedClubId,
    autoContext.suggestedNextActivity,
    dateContext.suggestedPhase,
  ]);

  useEffect(() => {
    if (!selectedClubId || !autoContext.suggestedNextActivity) {
      return;
    }

    setForm((previous) => {
      if (previous.activite_actuelle) {
        return previous;
      }

      return {
        ...previous,
        activite_actuelle: autoContext.suggestedNextActivity,
      };
    });
  }, [selectedClubId, autoContext.suggestedNextActivity]);

  const nbPresents = Number(form.nb_presents || 0);
  const tauxPresence =
    autoContext.totalMembers > 0
      ? Math.round((nbPresents / autoContext.totalMembers) * 100)
      : 0;

  const resetForm = () => {
    setForm(createEmptyForm(dateContext.suggestedPhase));
    setSessionError("");
    setPredictionError("");
    setHistoryError("");
    setPrediction(null);
    setHistory([]);
    setCurrentSession(null);
  };

  const refreshHistory = async (sessionId: number) => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const response = await getSessionRecommendations(sessionId);
      setHistory(Array.isArray(response) ? response : []);
    } catch (error: any) {
      setHistoryError(
        error?.response?.data?.message || "Impossible de charger l'historique",
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const executePrediction = async (sessionId: number) => {
    setPredictionLoading(true);
    setPredictionError("");
    try {
      const response = await getRecommendation(sessionId);
      setPrediction(response);
      await refreshHistory(sessionId);
    } catch (error: any) {
      setPredictionError(
        error?.response?.data?.message ||
          "Erreur de prédiction. Vérifiez le service ML.",
      );
    } finally {
      setPredictionLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const club = selectedClub || clubs[0];
    if (!club) {
      setSessionError("Aucun club disponible pour ce compte.");
      return;
    }

    setSubmitLoading(true);
    setSessionError("");
    setPredictionError("");

    const nbPresentsValue = Number(form.nb_presents || 0);
    const payload = {
      club_id: club.id,
      tranche_age: form.tranche_age,
      niveau: form.niveau,
      num_seance: autoContext.nextSessionNumber,
      phase_annee: form.phase_annee,
      saison: autoContext.season,
      mois: autoContext.month,
      jour_semaine: autoContext.dayLabel,
      format_seance: form.format_seance,
      lieu: autoContext.local,
      duree_minutes: Number(form.duree_minutes || 0),
      activite_j_minus_2: autoContext.activityBeforePrevious,
      activite_precedente: autoContext.previousActivity,
      activite_actuelle: form.activite_actuelle,
      difficulte: form.difficulte,
      niveau_fatigue: form.niveau_fatigue,
      humeur_groupe: form.humeur_groupe,
      score_engagement: Number(form.score_engagement || 0),
      nb_membres_total: Number(autoContext.totalMembers || 0),
      nb_presents: nbPresentsValue,
      taux_presence:
        autoContext.totalMembers > 0
          ? Number((nbPresentsValue / autoContext.totalMembers).toFixed(2))
          : 0,
      note_technique: Number(form.note_technique || 0),
      note_comportement: Number(form.note_comportement || 0),
      evaluation_coach: form.evaluation_coach,
      progression_observee: form.progression_observee,
      meteo: form.meteo,
      activite_exterieure: form.activite_exterieure,
      repetition_activite: Number(form.repetition_activite || 0),
      sequence_logique: Number(form.sequence_logique || 0),
    };

    try {
      const createdSession = await createSession(payload);
      setCurrentSession(createdSession);
      setSessions((previous) => [createdSession, ...previous]);
      await executePrediction(createdSession.id);
    } catch (error: any) {
      setSessionError(
        error?.response?.data?.message || "Impossible d'enregistrer la séance.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const tauxPresenceLabel = `${tauxPresence}%`;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7F3E9_0%,#FDFCF8_48%,#F3F7F5_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="mb-2">
          <h1 className="text-4xl font-black tracking-tight text-[#436D75]">
            Recommandations IA
          </h1>
          <p className="mt-2 max-w-4xl text-sm text-gray-600">
            Le club, le contexte de la séance, le local, le nombre de membres,
            le numéro de séance et les activités précédentes sont calculés
            automatiquement. Le responsable ne saisit que les champs utiles à
            l'analyse.
          </p>
        </div>

        {bootstrapLoading ? (
          <div className="rounded-[28px] border border-white/70 bg-white/80 p-10 text-center shadow-[0_14px_40px_rgba(67,109,117,0.08)]">
            <Loader2 className="mx-auto animate-spin text-[#436D75]" />
            <p className="mt-3 text-sm text-gray-600">
              Chargement des clubs et des séances...
            </p>
          </div>
        ) : clubs.length === 0 ? (
          <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
            <p className="font-bold">Aucun club trouvé pour ce compte.</p>
            <p className="mt-1 text-sm">
              Le formulaire fonctionne uniquement pour un responsable de club
              avec au moins un club associé.
            </p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Card
              title="Informations du club"
              subtitle="Si vous gérez plusieurs clubs, choisissez celui qui doit alimenter la séance. Le domaine est déduit automatiquement de la catégorie du club."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <Label>Club</Label>
                  {clubs.length > 1 ? (
                    <select
                      value={selectedClubId}
                      onChange={(event) =>
                        setSelectedClubId(event.target.value)
                      }
                      className={fieldClassName()}
                    >
                      <option value="">-- Choisir un club --</option>
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.nom}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className={fieldClassName(true)}>
                      {autoContext.clubName}
                    </div>
                  )}
                </div>
                <ReadOnlyBox label="Domaine" value={autoContext.domaine} />
                <ReadOnlyBox label="Local" value={autoContext.local} />
                <ReadOnlyBox
                  label="Nb membres total"
                  value={String(autoContext.totalMembers)}
                />
              </div>
            </Card>

            <Card
              title="Contexte de la séance"
              subtitle="Mois, jour de la semaine et saison sont déduits de la date du jour. Le numéro de séance s'incrémente automatiquement à partir de l'historique."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ReadOnlyBox
                  label="Mois"
                  value={`${autoContext.monthLabel} (${autoContext.month})`}
                />
                <ReadOnlyBox
                  label="Jour de la semaine"
                  value={autoContext.dayLabel}
                />
                <ReadOnlyBox label="Saison" value={autoContext.season} />
                <ReadOnlyBox
                  label="Numéro de séance"
                  value={String(autoContext.nextSessionNumber)}
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SelectField
                  label="Phase de l'année"
                  value={form.phase_annee}
                  onChange={(value) =>
                    setForm((previous) => ({ ...previous, phase_annee: value }))
                  }
                  options={PHASES}
                />
                <SelectField
                  label="Format de séance"
                  value={form.format_seance}
                  onChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      format_seance: value,
                    }))
                  }
                  options={FORMAT_OPTIONS}
                  placeholder="-- Choisir un format --"
                />
                <SelectField
                  label="Tranche d'âge"
                  value={form.tranche_age}
                  onChange={(value) =>
                    setForm((previous) => ({ ...previous, tranche_age: value }))
                  }
                  options={AGE_RANGES}
                  placeholder="-- Choisir une tranche --"
                />
                <SelectField
                  label="Niveau"
                  value={form.niveau}
                  onChange={(value) =>
                    setForm((previous) => ({ ...previous, niveau: value }))
                  }
                  options={LEVELS}
                  placeholder="-- Choisir un niveau --"
                />
                <ReadOnlyBox label="Lieu" value={autoContext.local} />
                <NumberField
                  label="Durée en minutes"
                  value={form.duree_minutes}
                  onChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      duree_minutes: value,
                    }))
                  }
                  min={1}
                  placeholder="90"
                />
              </div>
            </Card>

            <Card
              title="Activités"
              subtitle="L'activité J-2 et l'activité précédente sont récupérées depuis l'historique des séances du même club."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ReadOnlyBox
                  label="Activité J-2"
                  value={autoContext.activityBeforePrevious}
                />
                <ReadOnlyBox
                  label="Activité précédente"
                  value={autoContext.previousActivity}
                />
                <TextField
                  label="Activité actuelle"
                  value={form.activite_actuelle}
                  onChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      activite_actuelle: value,
                    }))
                  }
                  placeholder="Saisir l'activité actuelle"
                />
                <SelectField
                  label="Activité extérieure"
                  value={form.activite_exterieure}
                  onChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      activite_exterieure: value,
                    }))
                  }
                  options={["Oui", "Non"]}
                  placeholder="-- Choisir --"
                />
                <SelectField
                  label="Répétition activité"
                  value={form.repetition_activite}
                  onChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      repetition_activite: value,
                    }))
                  }
                  options={["0", "1"]}
                  placeholder="-- Choisir --"
                />
                <SelectField
                  label="Séquence logique"
                  value={form.sequence_logique}
                  onChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      sequence_logique: value,
                    }))
                  }
                  options={["0", "1"]}
                  placeholder="-- Choisir --"
                />
              </div>
            </Card>

            <Card
              title="État du groupe"
              subtitle="Les listes de choix ont été adaptées pour coller à votre demande."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SelectField
                  label="Difficulté"
                  value={form.difficulte}
                  onChange={(value) =>
                    setForm((previous) => ({ ...previous, difficulte: value }))
                  }
                  options={DIFFICULTIES}
                  placeholder="-- Choisir --"
                />
                <SelectField
                  label="Niveau de fatigue"
                  value={form.niveau_fatigue}
                  onChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      niveau_fatigue: value,
                    }))
                  }
                  options={FATIGUE_LEVELS}
                  placeholder="-- Choisir --"
                />
                <SelectField
                  label="Humeur du groupe"
                  value={form.humeur_groupe}
                  onChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      humeur_groupe: value,
                    }))
                  }
                  options={GROUP_MOODS}
                  placeholder="-- Choisir --"
                />
                <NumberField
                  label="Score d'engagement"
                  value={form.score_engagement}
                  onChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      score_engagement: value,
                    }))
                  }
                  min={1}
                  max={10}
                  step="0.1"
                  placeholder="1 à 10"
                />
              </div>
            </Card>

            <Card
              title="Présence et évaluation"
              subtitle="Le taux de présence est calculé automatiquement: présents ÷ total de membres."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ReadOnlyBox
                  label="Nb membres total"
                  value={String(autoContext.totalMembers)}
                />
                <NumberField
                  label="Nb présents"
                  value={form.nb_presents}
                  onChange={(value) =>
                    setForm((previous) => ({ ...previous, nb_presents: value }))
                  }
                  min={0}
                  placeholder="Ex: 15"
                />
                <ReadOnlyBox
                  label="Taux de présence"
                  value={tauxPresenceLabel}
                />
                <NumberField
                  label="Note technique /10"
                  value={form.note_technique}
                  onChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      note_technique: value,
                    }))
                  }
                  min={0}
                  max={10}
                  step="0.1"
                  placeholder="7.5"
                />
                <NumberField
                  label="Note comportement /10"
                  value={form.note_comportement}
                  onChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      note_comportement: value,
                    }))
                  }
                  min={0}
                  max={10}
                  step="0.1"
                  placeholder="8"
                />
                <SelectField
                  label="Évaluation coach"
                  value={form.evaluation_coach}
                  onChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      evaluation_coach: value,
                    }))
                  }
                  options={COACH_EVALS}
                  placeholder="-- Choisir --"
                />
                <SelectField
                  label="Progression observée"
                  value={form.progression_observee}
                  onChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      progression_observee: value,
                    }))
                  }
                  options={PROGRESSIONS}
                  placeholder="-- Choisir --"
                />
                <SelectField
                  label="Météo"
                  value={form.meteo}
                  onChange={(value) =>
                    setForm((previous) => ({ ...previous, meteo: value }))
                  }
                  options={WEATHER_OPTIONS}
                  placeholder="-- Choisir --"
                />
              </div>
            </Card>

            {sessionError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
                  <p className="text-sm font-medium">{sessionError}</p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D7E3DE] bg-white px-5 py-3 text-sm font-bold text-[#436D75] transition hover:bg-[#F6FAF8]"
              >
                <RotateCcw size={16} />
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#436D75] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#436D75]/20 transition hover:bg-[#35545c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Enregistrer et obtenir la recommandation
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {currentSession ? (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_14px_40px_rgba(67,109,117,0.08)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-[0.18em] text-[#436D75]">
                    Recommandation
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Séance #{currentSession.num_seance} pour{" "}
                    {selectedClub?.nom || autoContext.clubName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => executePrediction(currentSession.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D7E3DE] px-4 py-2 text-sm font-bold text-[#436D75] transition hover:bg-[#F6FAF8]"
                >
                  <RefreshCcw size={14} />
                  Rafraîchir
                </button>
              </div>

              {predictionError ? (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {predictionError}
                </div>
              ) : null}

              {predictionLoading ? (
                <div className="flex items-center gap-3 rounded-2xl border border-[#D7E3DE] bg-[#F7FBF9] p-4 text-gray-600">
                  <Loader2 className="animate-spin text-[#436D75]" size={18} />
                  Calcul de la recommandation en cours...
                </div>
              ) : prediction ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-gradient-to-br from-[#436D75] to-[#2D4450] p-4 text-white">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">
                      Modèle utilisé
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      {prediction.modele_utilise}
                    </p>
                  </div>
                  <RecommendationCard
                    recoId={prediction.id}
                    recommendations={prediction.recommandations}
                    onChosen={async () => {
                      await refreshHistory(currentSession.id);
                      const refreshed = await getRecommendation(
                        currentSession.id,
                      );
                      setPrediction(refreshed);
                    }}
                  />
                  {prediction.activite_choisie ? (
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-900">
                      <div className="flex items-start gap-3">
                        <CheckCircle2
                          className="mt-0.5 flex-shrink-0 text-green-600"
                          size={18}
                        />
                        <div>
                          <p className="font-bold">Activité choisie</p>
                          <p className="mt-1 text-sm">
                            {prediction.activite_choisie}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#D7E3DE] bg-[#F7FBF9] p-6 text-sm text-gray-600">
                  La recommandation apparaîtra ici après l'enregistrement de la
                  séance.
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_14px_40px_rgba(67,109,117,0.08)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-[0.18em] text-[#436D75]">
                    Historique
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Recommandations générées pour cette séance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    currentSession && refreshHistory(currentSession.id)
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-[#D7E3DE] px-4 py-2 text-sm font-bold text-[#436D75] transition hover:bg-[#F6FAF8]"
                >
                  <RefreshCcw size={14} />
                  Recharger
                </button>
              </div>

              {historyError ? (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {historyError}
                </div>
              ) : null}

              {historyLoading ? (
                <div className="flex items-center gap-3 rounded-2xl border border-[#D7E3DE] bg-[#F7FBF9] p-4 text-gray-600">
                  <Loader2 className="animate-spin text-[#436D75]" size={18} />
                  Chargement de l'historique...
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[#E8EEEB] bg-[#FBFCFB] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-[#436D75]">
                            Recommandation #{item.id}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleString("fr-FR")}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#F6E7E3] px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-[#B95E4F]">
                          {item.modele_utilise}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {item.recommandations.map((row, index) => (
                          <div
                            key={`${item.id}-${index}`}
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="text-gray-700">
                              {row.activite}
                            </span>
                            <span className="font-bold text-[#E98A7D]">
                              {row.probabilite}%
                            </span>
                          </div>
                        ))}
                      </div>
                      {item.activite_choisie ? (
                        <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                          Activité choisie: {item.activite_choisie}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#D7E3DE] bg-[#F7FBF9] p-6 text-sm text-gray-600">
                  Aucun historique disponible pour le moment.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
