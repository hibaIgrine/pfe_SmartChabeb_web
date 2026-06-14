/**
 * AdherentClubsPage.tsx — Catalogue des clubs pour les adhérents.
 *
 * RÔLE :
 *   Vue DÉCOUVERTE des clubs pour les adhérents. Permet de parcourir, filtrer
 *   et faire une demande d'adhésion à un club.
 *
 * FONCTIONNALITÉS :
 *   - Grille de clubs avec photo, catégorie, nombre de membres
 *   - Filtre par catégorie + recherche par nom
 *   - Affichage du statut d'inscription (INSCRIT / EN_ATTENTE / REFUSE / non-inscrit)
 *   - Bouton "Rejoindre" → POST /clubs/:clubId/inscriptions → crée une demande
 *   - Clic sur une card → AdherentClubDetailsPage (/clubs/:clubId)
 *
 * ÉTATS D'INSCRIPTION :
 *   null                  → bouton "Rejoindre" actif
 *   EN_ATTENTE_VALIDATION → badge orange "En attente"
 *   ACCEPTEE              → badge vert "Membre" + bouton désactivé
 *   REJETEE               → badge rouge "Refusé"
 *
 * ACCÈS : ADHERENT (composant sélectionné par ClubsPageRouter dans App.tsx)
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Search,
  Send,
  Users,
} from "lucide-react";
import api from "../../api/axios";

const statusStyle: Record<string, { label: string; className: string }> = {
  ACCEPTE: {
    label: "Inscrit",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  EN_ATTENTE: {
    label: "Demande envoyee",
    className: "bg-amber-50 text-amber-700 border-amber-100",
  },
  LISTE_ATTENTE: {
    label: "Liste d'attente",
    className: "bg-sky-50 text-sky-700 border-sky-100",
  },
  REFUSE: {
    label: "Refuse",
    className: "bg-rose-50 text-rose-700 border-rose-100",
  },
};

function getImageUrl(url?: string) {
  if (!url || url === "null" || url.trim() === "") return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;

  const baseURL = api.defaults.baseURL || "http://localhost:3000";
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${baseURL}${cleanPath}`;
}

function getPlanningText(planning: any) {
  if (!planning) return "";

  try {
    const parsed = typeof planning === "string" ? JSON.parse(planning) : planning;
    const slots = parsed?.slots || (Array.isArray(parsed) ? parsed : []);

    if (Array.isArray(slots) && slots.length > 0) {
      return slots
        .slice(0, 2)
        .map((slot: any) => `${slot.day} ${slot.startTime}-${slot.endTime}`)
        .join(" | ");
    }

    if (typeof parsed?.texte === "string") return parsed.texte;
    if (typeof parsed === "string") return parsed;
  } catch {
    if (typeof planning === "string") return planning;
  }

  return "";
}

function getCategoryClasses(category?: string) {
  const value = (category || "").toLowerCase();

  if (value.includes("sport")) return "bg-orange-50 text-orange-700";
  if (value.includes("art") || value.includes("musique"))
    return "bg-rose-50 text-rose-700";
  if (value.includes("tech") || value.includes("science"))
    return "bg-cyan-50 text-cyan-700";
  if (value.includes("environment") || value.includes("nature"))
    return "bg-emerald-50 text-emerald-700";

  return "bg-[#D9E8D1]/60 text-[#436D75]";
}

export default function AdherentClubsPage() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<any[]>([]);
  const [centre, setCentre] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const loadClubs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/clubs/my-centre", { headers });
      setCentre(response.data?.centre ?? null);
      setClubs(Array.isArray(response.data?.clubs) ? response.data.clubs : []);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Impossible de charger les clubs de votre centre.";
      setNotice({
        type: "error",
        message: Array.isArray(message) ? message[0] : message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClubs();
  }, []);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(clubs.map((club) => club.categorie).filter(Boolean)),
      ) as string[],
    [clubs],
  );

  const filteredClubs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return clubs.filter((club) => {
      const matchesQuery =
        !normalizedQuery ||
        club.nom?.toLowerCase().includes(normalizedQuery) ||
        club.description?.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        category === "ALL" || club.categorie === category;

      return matchesQuery && matchesCategory;
    });
  }, [clubs, query, category]);

  const applyToClub = async (club: any) => {
    if (!club?.id || club.my_inscription) return;

    setApplyingId(club.id);
    try {
      await api.post(`/clubs/${club.id}/apply`, {}, { headers });
      await loadClubs();
      setNotice({
        type: "success",
        message: `Votre demande pour ${club.nom} a ete envoyee.`,
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Impossible d'envoyer la demande.";
      setNotice({
        type: "error",
        message: Array.isArray(message) ? message[0] : message,
      });
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {notice && (
        <div
          className={`fixed right-6 top-6 z-[80] flex max-w-md items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-bold shadow-2xl ${
            notice.type === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-rose-100 bg-rose-50 text-rose-700"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-[32px] bg-[#436D75] text-white shadow-xl">
        <div className="grid gap-6 p-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#D9E8D1]">
              <MapPin size={14} />
              {centre
                ? `${centre.nom}${centre.gouvernorat ? ` - ${centre.gouvernorat}` : ""}`
                : "Centre non renseigne"}
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight">
              Clubs et activites de votre maison des jeunes
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/70">
              Retrouvez uniquement les clubs disponibles dans votre centre,
              puis envoyez une demande d'inscription en un clic.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">
                Clubs
              </p>
              <p className="mt-2 text-3xl font-black">{clubs.length}</p>
            </div>
            <div className="rounded-3xl bg-[#E98A7D] p-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">
                Demandes
              </p>
              <p className="mt-2 text-3xl font-black">
                {clubs.filter((club) => club.my_inscription).length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[28px] border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl bg-[#F7F3E9] px-4 text-[#436D75]">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un club"
            className="h-12 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-[#436D75]/40"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setCategory("ALL")}
            className={`h-12 whitespace-nowrap rounded-2xl px-5 text-xs font-black uppercase tracking-[0.18em] ${
              category === "ALL"
                ? "bg-[#436D75] text-white"
                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
            }`}
          >
            Tous
          </button>
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`h-12 whitespace-nowrap rounded-2xl px-5 text-xs font-black uppercase tracking-[0.18em] ${
                category === item
                  ? "bg-[#436D75] text-white"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[22rem] items-center justify-center rounded-[32px] bg-white">
          <Loader2 className="animate-spin text-[#436D75]" size={42} />
        </div>
      ) : !centre ? (
        <div className="rounded-[32px] border border-amber-100 bg-amber-50 p-10 text-center text-amber-800">
          <AlertCircle className="mx-auto mb-4" size={36} />
          <p className="text-lg font-black">Aucun centre associe a ce compte</p>
          <p className="mt-2 text-sm font-semibold opacity-70">
            Completez votre profil pour consulter les clubs de votre centre.
          </p>
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="rounded-[32px] border border-gray-100 bg-white p-14 text-center">
          <Search className="mx-auto mb-4 text-gray-300" size={42} />
          <p className="text-lg font-black text-[#436D75]">
            Aucun club trouve
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-400">
            Essayez une autre recherche ou une autre categorie.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredClubs.map((club) => {
            const imageUrl = getImageUrl(club.logo_url);
            const planning = getPlanningText(club.planning);
            const inscription = club.my_inscription;
            const status = inscription?.statut
              ? statusStyle[inscription.statut] ?? statusStyle.EN_ATTENTE
              : null;
            const acceptedCount = club._count?.inscriptions ?? 0;

            return (
              <article
                key={club.id}
                onClick={() => navigate(`/clubs/${club.id}`)}
                className="group flex min-h-[22rem] cursor-pointer flex-col overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="relative h-36 bg-[#D9E8D1]">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={club.nom}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[#D9E8D1] text-5xl font-black text-[#436D75]">
                      {club.nom?.slice(0, 1) ?? "C"}
                    </div>
                  )}
                  <div className="absolute left-4 top-4 flex gap-2">
                    <span
                      className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${getCategoryClasses(
                        club.categorie,
                      )}`}
                    >
                      {club.categorie || "Club"}
                    </span>
                  </div>
                  {status && (
                    <span
                      className={`absolute bottom-4 right-4 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] ${status.className}`}
                    >
                      {status.label}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black leading-tight text-[#436D75]">
                        {club.nom}
                      </h2>
                      <p className="mt-1 text-xs font-bold text-gray-400">
                        {club.centre?.nom}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl bg-[#F7F3E9] px-3 py-2 text-[#436D75]">
                      <Users size={15} />
                      <span className="text-xs font-black">
                        {acceptedCount}
                      </span>
                    </div>
                  </div>

                  {club.description && (
                    <p className="line-clamp-3 text-sm font-medium leading-6 text-gray-500">
                      {club.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-2 text-xs font-bold text-gray-400">
                    {planning && (
                      <div className="flex items-center gap-2">
                        <CalendarDays size={14} className="text-[#E98A7D]" />
                        <span className="line-clamp-1">{planning}</span>
                      </div>
                    )}
                    {club.locale_fixe && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#E98A7D]" />
                        <span>{club.locale_fixe}</span>
                      </div>
                    )}
                    {club.start_status && (
                      <div className="flex items-center gap-2">
                        <Clock3 size={14} className="text-[#E98A7D]" />
                        <span>
                          {club.start_status.is_started
                            ? "Club demarre"
                            : "Ouverture en preparation"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {(club.staff ?? []).slice(0, 3).map((item: any) => (
                      <span
                        key={item.id}
                        className="rounded-full bg-gray-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500"
                      >
                        {item.utilisateur?.prenom || item.utilisateur?.nom}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      applyToClub(club);
                    }}
                    disabled={Boolean(inscription) || applyingId === club.id}
                    className={`mt-auto flex h-12 items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-[0.18em] transition ${
                      inscription
                        ? "bg-gray-100 text-gray-400"
                        : "bg-[#436D75] text-white hover:bg-[#2f4d54]"
                    }`}
                  >
                    {applyingId === club.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : inscription ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                    {inscription ? status?.label : "Demander l'inscription"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
