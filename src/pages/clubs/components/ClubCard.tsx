import {
  Users,
  Power,
  Edit,
  MapPin,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import api from "../../../api/axios";
import { ClubResponsablesList } from "./ClubResponsablesList";

const CATEGORY_MAP: Record<string, { bg: string; text: string; icon: string }> =
  {
    Technologie: { bg: "bg-blue-50", text: "text-blue-600", icon: "💻" },
    Art: { bg: "bg-purple-50", text: "text-purple-600", icon: "🎭" },
    Musique: { bg: "bg-pink-50", text: "text-pink-600", icon: "🎵" },
    Sport: { bg: "bg-orange-50", text: "text-orange-600", icon: "⚽" },
    Science: { bg: "bg-cyan-50", text: "text-cyan-600", icon: "🔭" },
    Litterature: { bg: "bg-amber-50", text: "text-amber-600", icon: "📚" },
    Photographie: { bg: "bg-slate-50", text: "text-slate-600", icon: "📷" },
    EnvironmentClub: { bg: "bg-green-50", text: "text-green-600", icon: "🌿" },
    Cuisine: { bg: "bg-yellow-50", text: "text-yellow-600", icon: "👨‍🍳" },
    Numismatique: { bg: "bg-rose-50", text: "text-rose-600", icon: "🏛️" },
  };

const getCategoryStyle = (category: string) => {
  if (CATEGORY_MAP[category]) return CATEGORY_MAP[category];

  // Logic for custom category emojis
  const lower = category.toLowerCase();
  let icon = "✨";
  if (
    lower.includes("foot") ||
    lower.includes("sport") ||
    lower.includes("gym")
  )
    icon = "⚽";
  else if (
    lower.includes("code") ||
    lower.includes("web") ||
    lower.includes("dev")
  )
    icon = "💻";
  else if (lower.includes("danse") || lower.includes("art")) icon = "🎭";
  else if (lower.includes("livre") || lower.includes("ecole")) icon = "📚";
  else if (lower.includes("nature") || lower.includes("plage")) icon = "🌿";
  else if (lower.includes("photo") || lower.includes("video")) icon = "📷";

  return { bg: "bg-smart-sage/30", text: "text-smart-teal", icon };
};

const getFullImageUrl = (url?: string, seed: string = "default") => {
  if (!url || url === "null" || url.trim() === "") return null;

  if (url.startsWith("assets/")) {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=436d75&fontFamily=Inter&fontWeight=900`;
  }

  if (url.startsWith("http")) return url;
  if (url.startsWith("data:")) return url;

  const baseURL = api.defaults.baseURL || "http://192.168.1.17:3000";
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${baseURL}${cleanPath}`;
};

/** Convertit sécurisément le champ planning (JSON structuré) en string affichable */
const safePlanning = (planning: any): string => {
  if (!planning) return "";

  try {
    let parsed = typeof planning === "string" ? JSON.parse(planning) : planning;
    const slots = parsed.slots || (Array.isArray(parsed) ? parsed : null);

    if (slots && Array.isArray(slots) && slots.length > 0) {
      return slots
        .map((s: any) => `${s.day}: ${s.startTime}-${s.endTime}`)
        .join(" | ");
    }

    if (typeof parsed === "string") return parsed;
    return "";
  } catch (e) {
    if (typeof planning === "string") return planning;
    return "";
  }
};

interface ClubCardProps {
  club: any;
  onViewRequests: (club: any) => void;
  onViewStaff: (club: any) => void;
  onEdit: (club: any) => void;
  onDelete: (club: any) => void;
  canValidateStart?: boolean;
  onValidateStart?: (club: any) => void;
  validatingStartId?: string | null;
}

export const ClubCard = ({
  club,
  onViewRequests,
  onViewStaff,
  onEdit,
  onDelete,
  canValidateStart = false,
  onValidateStart,
  validatingStartId = null,
}: ClubCardProps) => {
  const cat = getCategoryStyle(club.categorie);
  const totalMembers =
    club._count?.inscriptions ?? club.inscriptions?.length ?? 0;
  const planningText = safePlanning(club.planning);
  const imageUrl = getFullImageUrl(club.logo_url, club.nom);
  const startStatus = club.start_status ?? {};
  const isStarted = Boolean(startStatus.is_started);
  const readyForValidation = Boolean(startStatus.ready_for_validation);
  const minimumReached = Boolean(startStatus.minimum_reached);
  const canShowValidateButton =
    canValidateStart && readyForValidation && !isStarted && !!onValidateStart;

  return (
    <div className="group bg-white rounded-[28px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
      {/* Bandeau couleur */}
      <div className="h-3 w-full bg-gradient-to-r from-smart-teal to-smart-sage/80" />

      <div className="p-6 flex flex-col flex-1">
        {/* Badge catégorie + compteur */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-wrap gap-2">
            <span
              className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${cat.bg} ${cat.text}`}
            >
              <span>{cat.icon}</span>
              {club.categorie}
            </span>
            <span
              className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                isStarted
                  ? "bg-emerald-50 text-emerald-700"
                  : readyForValidation
                    ? "bg-amber-50 text-amber-700"
                    : minimumReached
                      ? "bg-sky-50 text-sky-700"
                      : "bg-gray-100 text-gray-500"
              }`}
            >
              <CheckCircle2 size={10} />
              {isStarted
                ? "Club démarré"
                : readyForValidation
                  ? "Validation finale requise"
                  : minimumReached
                    ? "Participants atteints"
                    : "En attente"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-smart-sage/20 px-3 py-1.5 rounded-full">
            <Users size={12} className="text-smart-teal" />
            <span className="text-xs font-black text-smart-teal">
              {totalMembers}
            </span>
          </div>
        </div>

        {/* Logo + Nom */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-smart-sage/30 flex items-center justify-center text-xl relative overflow-hidden shadow border border-white shrink-0">
            {cat.icon}
            {imageUrl && (
              <img
                src={imageUrl}
                alt={club.nom}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e: any) => {
                  e.target.style.display = "none";
                }}
              />
            )}
          </div>
          <h3 className="text-lg font-black text-smart-teal leading-tight truncate">
            {club.nom}
          </h3>
        </div>

        {/* Description */}
        {club.description && typeof club.description === "string" && (
          <p className="text-gray-400 text-xs font-medium italic mb-3 leading-relaxed line-clamp-2">
            {club.description}
          </p>
        )}

        {!club.est_actif && (
          <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-red-600 bg-red-50 mb-4">
            Désactivé
          </span>
        )}

        {/* Méta : salle, coach, planning */}
        <div className="space-y-1.5 mb-4">
          {club.centre && (
            <div className="flex items-center gap-1.5 text-gray-400">
              <MapPin size={11} className="text-smart-salmon shrink-0" />
              <span className="text-[10px] font-bold">
                {club.centre.nom}
                {club.centre.gouvernorat ? ` — ${club.centre.gouvernorat}` : ""}
              </span>
            </div>
          )}

          <ClubResponsablesList
            className="text-gray-400"
            responsable={club.responsable}
            responsables={club.staff}
          />
          {planningText && (
            <div className="flex items-center gap-1.5 text-gray-400">
              <Calendar size={11} className="text-purple-400 shrink-0" />
              <span className="text-[10px] font-medium line-clamp-1">
                {planningText}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-50 flex flex-col gap-4 mt-auto">
          {canShowValidateButton && (
            <button
              onClick={() => onValidateStart?.(club)}
              disabled={validatingStartId === club.id}
              className="w-full px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {validatingStartId === club.id ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Validation...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Valider le démarrage
                </>
              )}
            </button>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onViewRequests(club)}
              className="px-4 py-3 bg-smart-teal text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition hover:bg-black"
            >
              Gérer les demandes
            </button>
            <button
              onClick={() => onViewStaff(club)}
              className="px-4 py-3 bg-white text-smart-teal rounded-2xl text-xs font-black uppercase tracking-[0.2em] border border-smart-teal transition hover:bg-smart-teal hover:text-white"
            >
              Voir le personnel
            </button>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onEdit(club)}
              title="Modifier"
              className="p-2 rounded-xl bg-smart-teal/10 text-smart-teal hover:bg-smart-teal hover:text-white transition-all"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => onDelete(club)}
              title={club.est_actif ? "Désactiver" : "Réactiver"}
              className={`p-2 rounded-xl transition-all ${
                club.est_actif
                  ? "bg-red-50 text-red-400 hover:bg-red-500 hover:text-white"
                  : "bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white"
              }`}
            >
              <Power size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
