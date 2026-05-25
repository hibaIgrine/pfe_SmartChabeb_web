import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageSquareText,
  Star,
  UserCircle,
  Users,
} from "lucide-react";
import api from "../../api/axios";

type SeanceFeedbackItem = {
  presenceId: string;
  seanceId: string | null;
  date_presence: string;
  canRate: boolean;
  club: {
    id: string;
    nom: string;
    categorie?: string | null;
    logo_url?: string | null;
    responsable?: {
      id: string;
      nom: string;
      prenom: string;
      photo_profil_url?: string | null;
    } | null;
  };
  seance: {
    id: string;
    titre?: string | null;
    date_seance: string;
    heure_debut?: string | null;
    heure_fin?: string | null;
  };
  myFeedback: {
    id: string;
    note_coach: number;
    note_activites: number;
    commentaire?: string | null;
    created_at?: string;
    updated_at?: string;
  } | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(date);
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  const text = String(value);
  const isoMatch = text.match(/T(\d{2}:\d{2})/);
  if (isoMatch?.[1]) return isoMatch[1];
  return text.slice(0, 5);
}

function getImageUrl(url?: string | null) {
  if (!url || url === "null" || url.trim() === "") return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;

  const baseURL = api.defaults.baseURL || "http://localhost:3000";
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${baseURL}${cleanPath}`;
}

export default function AdherentSeancesPage() {
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const [sessions, setSessions] = useState<SeanceFeedbackItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [coachNote, setCoachNote] = useState(0);
  const [activitiesNote, setActivitiesNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "rated">("all");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (message: string, type: "success" | "error") => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 3500);
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await api.get("/presences/adherent/seances", {
        headers,
      });
      const items = Array.isArray(response.data) ? response.data : [];
      setSessions(items);
      if (items.length > 0) {
        const nextSelected =
          items.find(
            (item: SeanceFeedbackItem) => item.seanceId && !item.myFeedback,
          ) || items[0];
        setSelectedSessionId(nextSelected?.seanceId ?? null);
      }
    } catch (error: any) {
      showFeedback(
        error?.response?.data?.message ||
          "Impossible de charger vos séances récentes.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const filteredSessions = sessions.filter((item) => {
    if (filter === "pending") return !item.myFeedback;
    if (filter === "rated") return Boolean(item.myFeedback);
    return true;
  });

  const selectedSession =
    filteredSessions.find((item) => item.seanceId === selectedSessionId) ||
    filteredSessions[0] ||
    null;

  useEffect(() => {
    if (!selectedSession) {
      setCoachNote(0);
      setActivitiesNote(0);
      setCommentaire("");
      return;
    }

    setCoachNote(selectedSession.myFeedback?.note_coach ?? 0);
    setActivitiesNote(selectedSession.myFeedback?.note_activites ?? 0);
    setCommentaire(selectedSession.myFeedback?.commentaire ?? "");
  }, [selectedSession?.seanceId, selectedSession?.myFeedback]);

  useEffect(() => {
    if (!filteredSessions.length) {
      setSelectedSessionId(null);
      return;
    }

    if (
      !selectedSession ||
      !filteredSessions.some(
        (item) => item.seanceId === selectedSession.seanceId,
      )
    ) {
      setSelectedSessionId(filteredSessions[0].seanceId);
    }
  }, [filter, sessions]);

  const renderStars = (
    value: number,
    onSelect?: (nextValue: number) => void,
    size = 20,
  ) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const active = starValue <= value;

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onSelect?.(starValue)}
            className={onSelect ? "rounded-full p-0.5" : "pointer-events-none"}
            aria-label={`Noter ${starValue} sur 5`}
          >
            <Star
              size={size}
              className={
                active ? "fill-amber-500 text-amber-500" : "text-gray-300"
              }
            />
          </button>
        );
      })}
    </div>
  );

  const submitFeedback = async () => {
    if (!selectedSession?.seanceId) return;
    if (coachNote < 1 || activitiesNote < 1) {
      showFeedback("Veuillez noter le coach et les activités.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(
        `/presences/adherent/seances/${selectedSession.seanceId}/feedback`,
        {
          note_coach: coachNote,
          note_activites: activitiesNote,
          commentaire,
        },
        { headers },
      );

      showFeedback("Votre feedback a été enregistré.", "success");
      await loadSessions();
    } catch (error: any) {
      showFeedback(
        error?.response?.data?.message || "Impossible d'envoyer le feedback.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCoach = selectedSession?.club?.responsable ?? null;
  const selectedCoachImage = getImageUrl(selectedCoach?.photo_profil_url);

  return (
    <div className="space-y-6 pb-8">
      {feedback && (
        <div
          className={`fixed right-6 top-6 z-[90] flex max-w-md items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-bold shadow-2xl ${
            feedback.type === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-rose-100 bg-rose-50 text-rose-700"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black italic text-smart-teal">
            Mes séances et feedback
          </h1>
          <p className="text-sm text-gray-500">
            Retrouvez les séances où votre présence a été marquée, puis notez le
            coach et les activités.
          </p>
        </div>

        <div className="inline-flex rounded-2xl bg-gray-100 p-1 w-full md:w-auto">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-black transition ${
              filter === "all"
                ? "bg-white text-[#436D75] shadow-sm"
                : "text-gray-500"
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-black transition ${
              filter === "pending"
                ? "bg-white text-[#436D75] shadow-sm"
                : "text-gray-500"
            }`}
          >
            À noter
          </button>
          <button
            onClick={() => setFilter("rated")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-black transition ${
              filter === "rated"
                ? "bg-white text-[#436D75] shadow-sm"
                : "text-gray-500"
            }`}
          >
            Déjà notées
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1.2fr]">
        <section className="overflow-hidden rounded-[30px] border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
              Séances suivies
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {filteredSessions.length} séance(s) disponible(s) pour feedback.
            </p>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-smart-teal" size={42} />
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                Chargement des séances...
              </p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-20 px-8 text-center text-gray-400 font-bold">
              Aucune séance à afficher pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredSessions.map((item) => {
                const isSelected = item.seanceId === selectedSessionId;
                const done = Boolean(item.myFeedback);

                return (
                  <button
                    key={item.seanceId || item.presenceId}
                    onClick={() => setSelectedSessionId(item.seanceId)}
                    className={`w-full p-5 text-left transition ${
                      isSelected ? "bg-[#D9E8D1]/25" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#D9E8D1] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#436D75]">
                            {item.club.categorie || "Club"}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                              done
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {done ? "Notée" : "À noter"}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-black italic text-smart-teal">
                          {item.seance.titre || "Séance de club"}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500 font-semibold">
                          {item.club.nom}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 font-bold">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={14} />
                            {formatDate(item.seance.date_seance)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 size={14} />
                            {formatTime(item.seance.heure_debut)} -{" "}
                            {formatTime(item.seance.heure_fin)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users size={14} />
                            Présence enregistrée
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm">
            {!selectedSession ? (
              <div className="py-12 text-center text-gray-400">
                Sélectionnez une séance pour la noter.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Détails séance
                    </p>
                    <h2 className="mt-2 text-2xl font-black italic text-smart-teal">
                      {selectedSession.seance.titre || "Séance de club"}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-gray-500">
                      {selectedSession.club.nom}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
                      selectedSession.myFeedback
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {selectedSession.myFeedback
                      ? "Feedback déjà enregistré"
                      : "Feedback à compléter"}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-[#F7F3E9] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Date
                    </p>
                    <p className="mt-2 text-sm font-black text-[#436D75]">
                      {formatDate(selectedSession.seance.date_seance)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#F7F3E9] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Heure
                    </p>
                    <p className="mt-2 text-sm font-black text-[#436D75]">
                      {formatTime(selectedSession.seance.heure_debut)} -{" "}
                      {formatTime(selectedSession.seance.heure_fin)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#F7F3E9] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Présence
                    </p>
                    <p className="mt-2 text-sm font-black text-[#436D75]">
                      Enregistrée le {formatDate(selectedSession.date_presence)}
                    </p>
                  </div>
                </div>

                <div className="rounded-[26px] border border-gray-100 bg-[#F8FCFD] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        Coach
                      </p>
                      <p className="mt-1 text-sm font-black text-[#436D75]">
                        {selectedCoach
                          ? `${selectedCoach.prenom} ${selectedCoach.nom}`
                          : "Coach non renseigné"}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white text-gray-300 ring-1 ring-gray-100">
                      {selectedCoachImage ? (
                        <img
                          src={selectedCoachImage}
                          alt="Coach"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserCircle size={28} />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-[26px] border border-gray-100 bg-white p-5">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-[#436D75]">
                      Note du coach
                    </p>
                    <div className="mt-3">
                      {renderStars(coachNote, setCoachNote)}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-[#436D75]">
                      Note des activités
                    </p>
                    <div className="mt-3">
                      {renderStars(activitiesNote, setActivitiesNote)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-black uppercase tracking-[0.2em] text-[#436D75]">
                      Commentaire
                    </label>
                    <div className="mt-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-[#436D75]/20">
                      <MessageSquareText
                        className="mb-2 text-[#E98A7D]"
                        size={18}
                      />
                      <textarea
                        value={commentaire}
                        onChange={(event) => setCommentaire(event.target.value)}
                        rows={5}
                        maxLength={500}
                        placeholder="Décrivez ce qui a bien fonctionné, ce qui peut être amélioré, et votre ressenti."
                        className="w-full resize-none border-0 p-0 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs font-semibold text-gray-500">
                      Votre feedback peut être modifié plus tard. Il est
                      enregistré dans une table indépendante dédiée aux séances.
                    </p>
                    <button
                      type="button"
                      onClick={submitFeedback}
                      disabled={submitting || !selectedSession.canRate}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#436D75] px-5 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#2f4d54] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Star size={16} />
                      )}
                      {submitting ? "Envoi..." : "Envoyer mon feedback"}
                    </button>
                  </div>

                  {!selectedSession.canRate && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                      Le feedback sera disponible après la séance.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
