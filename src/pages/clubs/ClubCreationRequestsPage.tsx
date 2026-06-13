import { useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  MapPin,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import api from "../../api/axios";
import { ALL_CATEGORIES } from "./components/AddClubModal";

type ClubCreationRequestItem = {
  id: string;
  nom_club: string;
  categorie: string;
  description: string;
  planning_souhaite?: any;
  statut: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE";
  commentaire_decision?: string | null;
  cv_url?: string | null;
  attestation_url?: string | null;
  created_at: string;
  demandeur?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  local_souhaite?: {
    id: string;
    nom: string;
    type: string;
  } | null;
  centre?: {
    id: string;
    nom: string;
  } | null;
};

type RequestFormState = {
  nom_club: string;
  categorie: string;
  custom_categorie: string;
  capacite: string;
  description: string;
  objectifs: string[];
  planning_souhaite: string;
  id_local_souhaite: string;
  jour_recurrent: string;
  heure_debut_souhaitee: string;
  heure_fin_souhaitee: string;
};

const WEEKDAYS = [
  { value: "MONDAY", label: "Lundi" },
  { value: "TUESDAY", label: "Mardi" },
  { value: "WEDNESDAY", label: "Mercredi" },
  { value: "THURSDAY", label: "Jeudi" },
  { value: "FRIDAY", label: "Vendredi" },
  { value: "SATURDAY", label: "Samedi" },
  { value: "SUNDAY", label: "Dimanche" },
];

const DEFAULT_FORM: RequestFormState = {
  nom_club: "",
  categorie: "",
  custom_categorie: "",
  capacite: "",
  description: "",
  objectifs: [],
  planning_souhaite: "",
  id_local_souhaite: "",
  jour_recurrent: "FRIDAY",
  heure_debut_souhaitee: "",
  heure_fin_souhaitee: "",
};

const formatDateOnly = (date: Date) => date.toISOString().split("T")[0];

const getNextWeekdayDate = (weekday: string) => {
  const weekdayIndex: Record<string, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };

  const nextDate = new Date();
  const currentIndex = nextDate.getDay();
  const targetIndex = weekdayIndex[weekday] ?? 5;
  let daysUntilTarget = (targetIndex - currentIndex + 7) % 7;

  if (daysUntilTarget === 0) {
    daysUntilTarget = 7;
  }

  nextDate.setDate(nextDate.getDate() + daysUntilTarget);
  return nextDate;
};

const buildPlanningSummary = (planning: any) => {
  if (!planning) return "Planning hebdomadaire";
  if (typeof planning === "string") return planning;

  const day = WEEKDAYS.find(
    (item) =>
      item.value === planning.jour_recurrent || item.value === planning.jour,
  );
  const start =
    planning.heure_debut || planning.start_time || planning.startTime;
  const end = planning.heure_fin || planning.end_time || planning.endTime;

  if (day && start && end) {
    return `Chaque ${day.label} de ${start} à ${end}`;
  }

  return planning.texte || "Planning détaillé";
};

const extractObjectives = (planning: any): string[] => {
  if (!planning || typeof planning !== "object") return [];
  if (!Array.isArray(planning.objectifs)) return [];
  return planning.objectifs
    .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
};

const extractCapacity = (planning: any): number | null => {
  if (!planning || typeof planning !== "object") return null;
  const parsed = Number(planning.capacite);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const extractLogoUrl = (planning: any): string | null => {
  if (!planning || typeof planning !== "object") return null;
  const raw = planning.logo_url;
  return typeof raw === "string" && raw.trim().length > 0 ? raw : null;
};

type CategoryOption = {
  id: string;
  label: string;
  icon: string;
};

function AttachmentCard({
  title,
  description,
  file,
  onChange,
}: {
  title: string;
  description: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="group cursor-pointer rounded-[28px] border border-dashed border-[#436D75]/25 bg-[#F7F3E9]/80 p-5 transition hover:border-[#436D75] hover:bg-white">
      <input
        type="file"
        accept=".pdf,.doc,.docx,image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-2xl bg-[#436D75] text-white flex items-center justify-center shadow-lg shadow-[#436D75]/20">
          <Upload size={22} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-black text-[#244047]">{title}</h4>
            {file && <CheckCircle2 size={16} className="text-emerald-600" />}
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            {description}
          </p>
          <div className="mt-3 rounded-2xl bg-white px-4 py-3 border border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-600">
            <FileText size={14} className="text-[#436D75]" />
            <span className="truncate">
              {file ? file.name : "Cliquez pour joindre un fichier"}
            </span>
          </div>
        </div>
      </div>
    </label>
  );
}

export default function ClubCreationRequestsPage() {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const role = user?.role;
  const centerName = user?.centre?.nom || "Votre centre";

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const isRequester = role === "ADHERENT";
  const canReview = role === "ADMIN" || role === "RESPONSABLE_CENTRE";

  const [items, setItems] = useState<ClubCreationRequestItem[]>([]);
  const [locaux, setLocaux] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("EN_ATTENTE");
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>(
    {},
  );
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [form, setForm] = useState<RequestFormState>(DEFAULT_FORM);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [attestationFile, setAttestationFile] = useState<File | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState<string>("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [objectifInput, setObjectifInput] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const categoryOptions: CategoryOption[] = useMemo(() => {
    const defaults = [...ALL_CATEGORIES];
    const knownDefaultIds = new Set(defaults.map((item) => item.id));
    const generated = customCategories
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value) => !knownDefaultIds.has(value))
      .map((value) => ({ id: value, label: value, icon: "✨" }));
    return [...defaults, ...generated];
  }, [customCategories]);

  const selectedCategory = isCustomCategory
    ? form.custom_categorie.trim()
    : form.categorie;

  const selectedCategoryLabel = isCustomCategory
    ? form.custom_categorie.trim() || "Catégorie personnalisée"
    : categoryOptions.find((category) => category.id === form.categorie)
        ?.label || "Catégorie";

  const availableLocals = useMemo(
    () => (Array.isArray(locaux) ? locaux : []),
    [locaux],
  );

  const buildFileUrl = (url: string) => {
    const base = String(api.defaults.baseURL || "").replace(/\/$/, "");
    if (url.startsWith("http")) return url;
    return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2800);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isRequester) {
        const [requestsRes, locauxRes, categoriesRes] = await Promise.all([
          api.get("/club-creation-requests/mine", { headers }),
          api.get("/locaux", { headers }),
          api.get("/club-creation-requests/categories", { headers }),
        ]);

        setItems(Array.isArray(requestsRes.data) ? requestsRes.data : []);
        setLocaux(Array.isArray(locauxRes.data) ? locauxRes.data : []);
        setCustomCategories(
          Array.isArray(categoriesRes.data) ? categoriesRes.data : [],
        );
      } else if (canReview) {
        const [requestsRes, categoriesRes] = await Promise.all([
          api.get(`/club-creation-requests?statut=${statusFilter}`, {
            headers,
          }),
          api.get("/club-creation-requests/categories", { headers }),
        ]);
        setItems(Array.isArray(requestsRes.data) ? requestsRes.data : []);
        setCustomCategories(
          Array.isArray(categoriesRes.data) ? categoriesRes.data : [],
        );
      } else {
        setItems([]);
      }
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setError(
        Array.isArray(apiMessage)
          ? apiMessage.join(" | ")
          : apiMessage || "Impossible de charger les demandes.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [statusFilter, role]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.nom_club.trim() || form.nom_club.trim().length < 3) {
      nextErrors.nom_club =
        "Le nom du club doit contenir au moins 3 caractères.";
    }

    if (!selectedCategory) {
      nextErrors.categorie =
        "Choisissez une catégorie ou saisissez-en une autre.";
    }

    if (!form.description.trim() || form.description.trim().length < 20) {
      nextErrors.description =
        "La description doit contenir au moins 20 caractères.";
    }

    const capacity = Number(form.capacite);
    if (!form.capacite || !Number.isInteger(capacity) || capacity <= 0) {
      nextErrors.capacite =
        "La capacité doit être un nombre entier supérieur à 0.";
    }

    if (!Array.isArray(form.objectifs) || form.objectifs.length === 0) {
      nextErrors.objectifs = "Ajoutez au moins un objectif du club.";
    }

    if (!form.id_local_souhaite) {
      nextErrors.id_local_souhaite = "Sélectionnez un local de votre centre.";
    }

    if (!form.jour_recurrent) {
      nextErrors.jour_recurrent = "Sélectionnez un jour récurrent.";
    }

    if (!form.heure_debut_souhaitee || !form.heure_fin_souhaitee) {
      nextErrors.heure = "Précisez les heures de début et de fin.";
    } else if (form.heure_fin_souhaitee <= form.heure_debut_souhaitee) {
      nextErrors.heure =
        "L'heure de fin doit être supérieure à l'heure de début.";
    }

    if (!cvFile) {
      nextErrors.cv = "Le CV est obligatoire.";
    }

    if (!attestationFile) {
      nextErrors.attestation = "L'attestation est obligatoire.";
    }

    return nextErrors;
  };

  const checkAvailability = async () => {
    const nextErrors = validateForm();

    if (
      nextErrors.id_local_souhaite ||
      nextErrors.heure ||
      nextErrors.jour_recurrent
    ) {
      setFieldErrors(nextErrors);
      setAvailabilityMessage("");
      return;
    }

    const date = formatDateOnly(getNextWeekdayDate(form.jour_recurrent));

    setCheckingAvailability(true);
    setAvailabilityMessage("");
    try {
      const response = await api.get(
        `/reservations/check?id_local=${form.id_local_souhaite}&date=${date}&start=${form.heure_debut_souhaitee}&end=${form.heure_fin_souhaitee}`,
        { headers },
      );
      setAvailabilityMessage(
        response.data?.available
          ? "Créneau disponible sur ce local."
          : "Créneau déjà occupé pour ce jour.",
      );
    } catch {
      setAvailabilityMessage("Vérification indisponible pour le moment.");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setObjectifInput("");
    setLogoFile(null);
    setCvFile(null);
    setAttestationFile(null);
    setAvailabilityMessage("");
    setFieldErrors({});
    setIsCustomCategory(false);
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError("Veuillez corriger les champs signalés.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const referenceDate = formatDateOnly(
        getNextWeekdayDate(form.jour_recurrent),
      );
      const planningPayload = {
        mode: "HEBDOMADAIRE",
        jour_recurrent: form.jour_recurrent,
        heure_debut: form.heure_debut_souhaitee,
        heure_fin: form.heure_fin_souhaitee,
        recurrence: "TOUTE_L_ANNEE",
        objectifs: form.objectifs,
        notes: form.planning_souhaite.trim() || undefined,
      };

      const payload = new FormData();
      payload.append("nom_club", form.nom_club.trim());
      payload.append("categorie", selectedCategory);
      payload.append("description", form.description.trim());
      payload.append("capacite", form.capacite);
      payload.append("objectifs", JSON.stringify(form.objectifs));
      payload.append("planning_souhaite", JSON.stringify(planningPayload));
      payload.append("id_local_souhaite", form.id_local_souhaite);
      payload.append("jour_recurrent", form.jour_recurrent);
      payload.append("date_souhaitee", referenceDate);
      payload.append("heure_debut_souhaitee", form.heure_debut_souhaitee);
      payload.append("heure_fin_souhaitee", form.heure_fin_souhaitee);
      payload.append("cv", cvFile as Blob);
      payload.append("attestation", attestationFile as Blob);
      if (logoFile) {
        payload.append("logo", logoFile as Blob);
      }

      await api.post("/club-creation-requests", payload, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });

      resetForm();
      showNotice("Demande envoyée avec succès.");
      await loadData();
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setError(
        Array.isArray(apiMessage)
          ? apiMessage.join(" | ")
          : apiMessage || "Erreur lors de l'envoi de la demande.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const reviewRequest = async (id: string, status: "ACCEPTEE" | "REFUSEE") => {
    try {
      await api.patch(
        `/club-creation-requests/${id}/status`,
        {
          statut: status,
          commentaire_decision: decisionNotes[id] || "",
        },
        { headers },
      );
      showNotice(
        status === "ACCEPTEE"
          ? "Demande acceptée avec succès."
          : "Demande refusée avec succès.",
      );
      await loadData();
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setError(
        Array.isArray(apiMessage)
          ? apiMessage.join(" | ")
          : apiMessage || "Action impossible sur cette demande.",
      );
    }
  };

  const addObjectif = () => {
    const value = objectifInput.trim();
    if (!value) return;

    setForm((prev) => {
      if (prev.objectifs.some((objectif) => objectif === value)) {
        return prev;
      }
      return { ...prev, objectifs: [...prev.objectifs, value] };
    });
    setObjectifInput("");
    setFieldErrors((prev) => ({ ...prev, objectifs: "" }));
  };

  const removeObjectif = (objectifToRemove: string) => {
    setForm((prev) => ({
      ...prev,
      objectifs: prev.objectifs.filter(
        (objectif) => objectif !== objectifToRemove,
      ),
    }));
  };

  if (!isRequester && !canReview) {
    return (
      <div className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
        <h2 className="text-xl font-black text-smart-teal">Demandes Clubs</h2>
        <p className="text-sm text-gray-500 mt-2">
          Votre rôle ne permet pas d'accéder à cette section.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {(notice || error) && (
        <div className="fixed right-4 top-4 z-[80] w-[min(92vw,420px)] space-y-3 pointer-events-none">
          {notice && (
            <div className="pointer-events-auto rounded-2xl bg-[#D9E8D1] text-[#436D75] border border-[#436D75]/20 text-sm font-bold shadow-xl px-4 py-3 flex items-start justify-between gap-3">
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="rounded-full p-1 hover:bg-white/60"
                aria-label="Fermer la notification"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {error && (
            <div className="pointer-events-auto rounded-2xl bg-[#FDE5E1] text-[#B23A2B] border border-[#E98A7D]/40 text-sm font-bold shadow-xl px-4 py-3 flex items-start justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="rounded-full p-1 hover:bg-white/60"
                aria-label="Fermer l'erreur"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-[32px] border border-white bg-gradient-to-br from-white via-[#F7F3E9] to-[#D9E8D1] p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#436D75] shadow-sm">
              <Sparkles size={12} /> Demandes de création de club
            </div>
            <h2 className="mt-4 text-3xl lg:text-4xl font-black italic tracking-tight text-[#244047]">
              {isRequester
                ? "Construisez votre demande de club"
                : "Pilotez les propositions de clubs"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-gray-600 font-medium">
              {isRequester
                ? " le planning se répète chaque semaine toute l'année."
                : "Les demandes sont triées par statut avec les pièces jointes, le planning récurrent et la disponibilité du local souhaité."}
            </p>
          </div>

          

          {canReview && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-bold shadow-sm"
            >
              <option value="EN_ATTENTE">En attente</option>
              <option value="ACCEPTEE">Acceptées</option>
              <option value="REFUSEE">Refusées</option>
            </select>
          )}
        </div>
      </div>

      {isRequester && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <form
            onSubmit={submitRequest}
            className="xl:col-span-3 rounded-[32px] bg-white border border-gray-100 shadow-sm p-6 space-y-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black italic text-[#244047]">
                  Nouveau dossier
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  Remplissez les informations du club et joignez vos
                  justificatifs.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 rounded-full bg-[#F7F3E9] px-4 py-2 text-xs font-black text-[#436D75]">
                <CalendarRange size={14} /> Hebdomadaire toute l'année
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                  Nom du club
                </label>
                <input
                  value={form.nom_club}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, nom_club: e.target.value }));
                    setFieldErrors((prev) => ({ ...prev, nom_club: "" }));
                  }}
                  placeholder="Ex: Club Robotique"
                  className={`w-full rounded-2xl border bg-[#F8FAFC] px-4 py-3 text-sm font-semibold outline-none transition focus:bg-white ${fieldErrors.nom_club ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"}`}
                />
                {fieldErrors.nom_club && (
                  <p className="text-xs font-bold text-red-500">
                    {fieldErrors.nom_club}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                  Capacité
                </label>
                <input
                  value={form.capacite}
                  onChange={(e) => {
                    const numericOnly = e.target.value.replace(/\D/g, "");
                    setForm((p) => ({ ...p, capacite: numericOnly }));
                    setFieldErrors((prev) => ({ ...prev, capacite: "" }));
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Ex: 30"
                  className={`w-full rounded-2xl border bg-[#F8FAFC] px-4 py-3 text-sm font-semibold outline-none transition focus:bg-white ${fieldErrors.capacite ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"}`}
                />
                {fieldErrors.capacite && (
                  <p className="text-xs font-bold text-red-500">
                    {fieldErrors.capacite}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                  Centre d'attache
                </label>
                <div className="rounded-2xl border border-[#D9E8D1] bg-[#F7F3E9] px-4 py-3 text-sm font-bold text-[#244047] flex items-center gap-2">
                  <MapPin size={14} className="text-[#436D75]" />
                  {centerName}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                    Catégorie
                  </label>
                  <p className="text-sm font-semibold text-gray-500 mt-1">
                    Choisissez une catégorie réelle, ou utilisez “Autre” si elle
                    n'existe pas.
                  </p>
                </div>
                <div className="rounded-full bg-[#F7F3E9] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#436D75]">
                  {selectedCategoryLabel}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {categoryOptions.map((category) => {
                  const active =
                    !isCustomCategory && form.categorie === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(false);
                        setForm((prev) => ({
                          ...prev,
                          categorie: category.id,
                          custom_categorie: "",
                        }));
                        setFieldErrors((prev) => ({ ...prev, categorie: "" }));
                      }}
                      className={`rounded-[22px] border p-4 text-left transition-all ${active ? "border-[#436D75] bg-[#436D75] text-white shadow-lg shadow-[#436D75]/15" : "border-gray-100 bg-[#F8FAFC] hover:border-[#D9E8D1] hover:bg-white"}`}
                    >
                      <div className="text-2xl">{category.icon}</div>
                      <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] leading-snug">
                        {category.label}
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(true);
                    setForm((prev) => ({ ...prev, categorie: "" }));
                    setFieldErrors((prev) => ({ ...prev, categorie: "" }));
                  }}
                  className={`rounded-[22px] border p-4 text-left transition-all ${isCustomCategory ? "border-[#436D75] bg-[#244047] text-white shadow-lg shadow-[#244047]/15" : "border-gray-100 bg-[#F8FAFC] hover:border-[#D9E8D1] hover:bg-white"}`}
                >
                  <div className="text-2xl">✨</div>
                  <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] leading-snug">
                    Autre
                  </div>
                </button>
              </div>

              {isCustomCategory && (
                <div className="space-y-2">
                  <input
                    value={form.custom_categorie}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        custom_categorie: e.target.value,
                      }));
                      setFieldErrors((prev) => ({ ...prev, categorie: "" }));
                    }}
                    placeholder="Saisissez la nouvelle catégorie"
                    className={`w-full rounded-2xl border bg-[#F8FAFC] px-4 py-3 text-sm font-semibold outline-none transition focus:bg-white ${fieldErrors.categorie ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"}`}
                  />
                  {fieldErrors.categorie && (
                    <p className="text-xs font-bold text-red-500">
                      {fieldErrors.categorie}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                Description du club
              </label>
              <textarea
                value={form.description}
                onChange={(e) => {
                  setForm((p) => ({ ...p, description: e.target.value }));
                  setFieldErrors((prev) => ({ ...prev, description: "" }));
                }}
                placeholder="Expliquez l'objectif, les activités, le public visé et l'intérêt du club."
                className={`w-full min-h-[140px] rounded-[28px] border bg-[#F8FAFC] px-4 py-4 text-sm font-medium outline-none transition focus:bg-white ${fieldErrors.description ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"}`}
              />
              {fieldErrors.description && (
                <p className="text-xs font-bold text-red-500">
                  {fieldErrors.description}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                Objectifs du club
              </label>
              <p className="text-sm text-gray-500 font-medium">
                Ajoutez les objectifs sous forme de puces. Ce champ est
                obligatoire.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={objectifInput}
                  onChange={(e) => setObjectifInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addObjectif();
                    }
                  }}
                  placeholder="Ex: Former les jeunes au leadership"
                  className="flex-1 rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm font-semibold outline-none transition focus:bg-white"
                />
                <button
                  type="button"
                  onClick={addObjectif}
                  className="rounded-2xl bg-[#436D75] px-4 py-3 text-xs font-black uppercase tracking-[0.15em] text-white"
                >
                  Ajouter
                </button>
              </div>

              {form.objectifs.length > 0 && (
                <ul className="space-y-2 rounded-2xl border border-gray-100 bg-[#F8FAFC] p-4 text-sm text-gray-700">
                  {form.objectifs.map((objectif) => (
                    <li
                      key={objectif}
                      className="flex items-start justify-between gap-3"
                    >
                      <span className="font-medium">• {objectif}</span>
                      <button
                        type="button"
                        onClick={() => removeObjectif(objectif)}
                        className="text-xs font-bold text-[#B23A2B]"
                      >
                        Retirer
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {fieldErrors.objectifs && (
                <p className="text-xs font-bold text-red-500">
                  {fieldErrors.objectifs}
                </p>
              )}
            </div>

            <div className="rounded-[28px] border border-gray-100 bg-[#F7F3E9] p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-[#244047]">
                    Planning hebdomadaire
                  </h4>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Le créneau est répété chaque semaine au même horaire pendant
                    toute l'année.
                  </p>
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#436D75]">
                  {
                    WEEKDAYS.find((day) => day.value === form.jour_recurrent)
                      ?.label
                  }
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    Jour
                  </label>
                  <select
                    value={form.jour_recurrent}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        jour_recurrent: e.target.value,
                      }));
                      setFieldErrors((prev) => ({
                        ...prev,
                        jour_recurrent: "",
                      }));
                    }}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold outline-none ${fieldErrors.jour_recurrent ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"}`}
                  >
                    {WEEKDAYS.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    Heure début
                  </label>
                  <div className={`flex items-center gap-1 w-full rounded-2xl border bg-white px-4 py-2.5 ${fieldErrors.heure ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"}`}>
                    <select
                      value={(form.heure_debut_souhaitee || "08:00").split(":")[0]}
                      onChange={(e) => {
                        const m = (form.heure_debut_souhaitee || "08:00").split(":")[1] || "00";
                        setForm((prev) => ({ ...prev, heure_debut_souhaitee: `${e.target.value}:${m}` }));
                        setFieldErrors((prev) => ({ ...prev, heure: "" }));
                      }}
                      className="outline-none bg-transparent text-sm font-semibold text-gray-800 cursor-pointer"
                    >
                      {Array.from({ length: 14 }, (_, i) => 8 + i).map((hr) => (
                        <option key={hr} value={String(hr).padStart(2, "0")}>
                          {String(hr).padStart(2, "0")}h
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-400 font-bold px-0.5">:</span>
                    <select
                      value={(form.heure_debut_souhaitee || "08:00").split(":")[1] || "00"}
                      onChange={(e) => {
                        const h = (form.heure_debut_souhaitee || "08:00").split(":")[0] || "08";
                        setForm((prev) => ({ ...prev, heure_debut_souhaitee: `${h}:${e.target.value}` }));
                        setFieldErrors((prev) => ({ ...prev, heure: "" }));
                      }}
                      className="outline-none bg-transparent text-sm font-semibold text-gray-800 cursor-pointer w-14"
                    >
                      {Array.from({ length: 60 }, (_, i) => i).map((min) => (
                        <option key={min} value={String(min).padStart(2, "0")}>
                          {String(min).padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    Heure fin
                  </label>
                  <div className={`flex items-center gap-1 w-full rounded-2xl border bg-white px-4 py-2.5 ${fieldErrors.heure ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"}`}>
                    <select
                      value={(form.heure_fin_souhaitee || "10:00").split(":")[0]}
                      onChange={(e) => {
                        const newH = e.target.value;
                        const m = newH === "22"
                          ? "00"
                          : (form.heure_fin_souhaitee || "10:00").split(":")[1] || "00";
                        setForm((prev) => ({ ...prev, heure_fin_souhaitee: `${newH}:${m}` }));
                        setFieldErrors((prev) => ({ ...prev, heure: "" }));
                      }}
                      className="outline-none bg-transparent text-sm font-semibold text-gray-800 cursor-pointer"
                    >
                      {Array.from({ length: 15 }, (_, i) => 8 + i).map((hr) => (
                        <option key={hr} value={String(hr).padStart(2, "0")}>
                          {String(hr).padStart(2, "0")}h
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-400 font-bold px-0.5">:</span>
                    <select
                      value={(form.heure_fin_souhaitee || "10:00").split(":")[1] || "00"}
                      disabled={(form.heure_fin_souhaitee || "10:00").split(":")[0] === "22"}
                      onChange={(e) => {
                        const h = (form.heure_fin_souhaitee || "10:00").split(":")[0] || "10";
                        setForm((prev) => ({ ...prev, heure_fin_souhaitee: `${h}:${e.target.value}` }));
                        setFieldErrors((prev) => ({ ...prev, heure: "" }));
                      }}
                      className="outline-none bg-transparent text-sm font-semibold text-gray-800 cursor-pointer w-14 disabled:opacity-40"
                    >
                      {Array.from({ length: 60 }, (_, i) => i).map((min) => (
                        <option key={min} value={String(min).padStart(2, "0")}>
                          {String(min).padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {fieldErrors.heure && (
                <p className="text-xs font-bold text-red-500">
                  {fieldErrors.heure}
                </p>
              )}

              <div className="rounded-[24px] bg-white p-4 border border-[#D9E8D1] flex items-start gap-3">
                <Clock3 size={18} className="text-[#436D75] mt-0.5" />
                <div>
                  <p className="text-sm font-black text-[#244047]">
                    Prévisualisation
                  </p>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    {form.heure_debut_souhaitee && form.heure_fin_souhaitee
                      ? `Chaque ${WEEKDAYS.find((day) => day.value === form.jour_recurrent)?.label.toLowerCase()} de ${form.heure_debut_souhaitee} à ${form.heure_fin_souhaitee}`
                      : "Choisissez un jour et des heures pour obtenir la prévisualisation."}
                  </p>
                </div>
              </div>

              <textarea
                value={form.planning_souhaite}
                onChange={(e) =>
                  setForm((p) => ({ ...p, planning_souhaite: e.target.value }))
                }
                placeholder="Compléments de planning ou détails internes du club"
                className="w-full min-h-[92px] rounded-[24px] border border-gray-200 bg-white px-4 py-3 text-sm font-medium outline-none"
              />
            </div>

            <div className="rounded-[28px] border border-gray-100 bg-white p-5 space-y-4">
              <div>
                <h4 className="text-sm font-black text-[#244047]">
                  Local de votre centre
                </h4>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Les locaux affichés ici proviennent uniquement de votre
                  centre.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  Local souhaité
                </label>
                <select
                  value={form.id_local_souhaite}
                  onChange={(e) => {
                    setForm((p) => ({
                      ...p,
                      id_local_souhaite: e.target.value,
                    }));
                    setFieldErrors((prev) => ({
                      ...prev,
                      id_local_souhaite: "",
                    }));
                  }}
                  className={`w-full rounded-2xl border bg-[#F8FAFC] px-4 py-3 text-sm font-semibold outline-none ${fieldErrors.id_local_souhaite ? "border-red-300 ring-2 ring-red-100" : "border-gray-200"}`}
                >
                  <option value="">Choisissez un local...</option>
                  {availableLocals.map((local) => (
                    <option key={local.id} value={local.id}>
                      {local.nom} - {local.type}
                    </option>
                  ))}
                </select>
                {fieldErrors.id_local_souhaite && (
                  <p className="text-xs font-bold text-red-500">
                    {fieldErrors.id_local_souhaite}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void checkAvailability()}
                  disabled={checkingAvailability}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#436D75] px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-sm disabled:opacity-60"
                >
                  <ChevronRight size={14} />
                  {checkingAvailability
                    ? "Vérification..."
                    : "Vérifier la disponibilité"}
                </button>
                {availabilityMessage && (
                  <span className="text-xs font-bold text-gray-600">
                    {availabilityMessage}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-black text-[#244047]">
                  Pièces jointes
                </h4>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Joignez un CV, une attestation et un logo optionnel.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AttachmentCard
                  title="CV du porteur"
                  description="Mettez en avant votre parcours et votre rôle dans le club."
                  file={cvFile}
                  onChange={(file) => {
                    setCvFile(file);
                    setFieldErrors((prev) => ({ ...prev, cv: "" }));
                  }}
                />

                <AttachmentCard
                  title="Attestation / justificatif"
                  description="Ajoutez un document officiel, une attestation ou un appui associatif."
                  file={attestationFile}
                  onChange={(file) => {
                    setAttestationFile(file);
                    setFieldErrors((prev) => ({ ...prev, attestation: "" }));
                  }}
                />

                <AttachmentCard
                  title="Logo du club (optionnel)"
                  description="Ajoutez l'identité visuelle de votre club (image)."
                  file={logoFile}
                  onChange={(file) => {
                    setLogoFile(file);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-bold">
                {fieldErrors.cv && (
                  <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-600 border border-red-100">
                    {fieldErrors.cv}
                  </p>
                )}
                {fieldErrors.attestation && (
                  <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-600 border border-red-100">
                    {fieldErrors.attestation}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-[26px] bg-[#244047] px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[#244047]/15 transition hover:bg-[#436D75] disabled:opacity-60"
            >
              {submitting ? "Envoi en cours..." : "Envoyer ma demande"}
            </button>
          </form>

          <div className="xl:col-span-2 rounded-[32px] bg-white border border-gray-100 shadow-sm p-5">
            <h3 className="text-lg font-black italic text-[#244047] mb-1">
              Mes demandes
            </h3>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-4">
              Suivi personnel
            </p>

            {loading ? (
              <p className="text-sm text-gray-400">Chargement...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-400">
                Aucune demande pour l'instant.
              </p>
            ) : (
              <div className="space-y-3 max-h-[760px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[26px] border border-gray-100 bg-[#F9FAFB] p-4"
                  >
                    {(() => {
                      const objectifs = extractObjectives(
                        item.planning_souhaite,
                      );
                      const capacity = extractCapacity(item.planning_souhaite);
                      const logoUrl = extractLogoUrl(item.planning_souhaite);
                      return (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-[#244047]">
                                {item.nom_club}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {item.categorie} ·{" "}
                                {new Date(item.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#436D75] border border-gray-100">
                              {item.statut}
                            </span>
                          </div>

                          <p className="mt-3 text-xs leading-5 text-gray-600">
                            {item.description}
                          </p>

                          {capacity && (
                            <p className="mt-2 text-xs font-bold text-[#436D75]">
                              Capacité: {capacity} membres
                            </p>
                          )}

                          {logoUrl && (
                            <img
                              src={buildFileUrl(logoUrl)}
                              alt="Logo club"
                              className="mt-3 h-16 w-16 rounded-2xl border border-gray-200 object-cover"
                            />
                          )}

                          <div className="mt-3 rounded-2xl bg-white p-3 text-xs font-semibold text-gray-600 border border-gray-100">
                            {buildPlanningSummary(item.planning_souhaite)}
                          </div>

                          {objectifs.length > 0 && (
                            <div className="mt-3 rounded-2xl bg-white p-3 border border-gray-100">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                                Objectifs
                              </p>
                              <ul className="space-y-1 text-xs text-gray-700">
                                {objectifs.map((objectif) => (
                                  <li key={objectif}>• {objectif}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {item.local_souhaite && (
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                              <MapPin size={12} /> {item.local_souhaite.nom} (
                              {item.local_souhaite.type})
                            </p>
                          )}

                          {(item.cv_url || item.attestation_url) && (
                            <div className="flex flex-wrap gap-3 mt-3 text-xs font-bold">
                              {item.cv_url && (
                                <a
                                  href={buildFileUrl(item.cv_url)}
                                  className="inline-flex items-center gap-1 rounded-full bg-[#D9E8D1] px-3 py-2 text-[#244047]"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <FileText size={12} /> CV
                                </a>
                              )}
                              {item.attestation_url && (
                                <a
                                  href={buildFileUrl(item.attestation_url)}
                                  className="inline-flex items-center gap-1 rounded-full bg-[#F7F3E9] px-3 py-2 text-[#244047]"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Check size={12} /> Attestation
                                </a>
                              )}
                            </div>
                          )}

                          {item.commentaire_decision && (
                            <p className="text-xs text-gray-600 mt-3 rounded-2xl bg-white px-3 py-2 border border-gray-100">
                              Commentaire: {item.commentaire_decision}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {canReview && (
        <div className="rounded-[32px] bg-white border border-gray-100 shadow-sm p-5">
          {loading ? (
            <p className="text-sm text-gray-400">Chargement des demandes...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400">
              Aucune demande pour ce statut.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[26px] border border-gray-100 bg-[#F9FAFB] p-4"
                >
                  {(() => {
                    const objectifs = extractObjectives(item.planning_souhaite);
                    const capacity = extractCapacity(item.planning_souhaite);
                    const logoUrl = extractLogoUrl(item.planning_souhaite);
                    return (
                      <>
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div>
                            <p className="text-sm font-black text-[#244047]">
                              {item.nom_club}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {item.categorie} · {item.demandeur?.nom}{" "}
                              {item.demandeur?.prenom} · {item.demandeur?.email}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Centre: {item.centre?.nom || "-"}
                            </p>
                            <p className="text-xs text-gray-600 mt-2">
                              {item.description}
                            </p>
                            {capacity && (
                              <p className="text-xs font-bold text-[#436D75] mt-2">
                                Capacité: {capacity} membres
                              </p>
                            )}
                            {logoUrl && (
                              <img
                                src={buildFileUrl(logoUrl)}
                                alt="Logo club"
                                className="mt-3 h-16 w-16 rounded-2xl border border-gray-200 object-cover"
                              />
                            )}
                            <div className="mt-3 rounded-2xl bg-white p-3 text-xs font-semibold text-gray-600 border border-gray-100">
                              {buildPlanningSummary(item.planning_souhaite)}
                            </div>
                            {objectifs.length > 0 && (
                              <div className="mt-3 rounded-2xl bg-white p-3 border border-gray-100">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                                  Objectifs
                                </p>
                                <ul className="space-y-1 text-xs text-gray-700">
                                  {objectifs.map((objectif) => (
                                    <li key={objectif}>• {objectif}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {item.local_souhaite && (
                              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <MapPin size={12} /> {item.local_souhaite.nom} (
                                {item.local_souhaite.type})
                              </p>
                            )}
                            {(item.cv_url || item.attestation_url) && (
                              <div className="flex flex-wrap gap-3 mt-3 text-xs font-bold">
                                {item.cv_url && (
                                  <a
                                    href={buildFileUrl(item.cv_url)}
                                    className="inline-flex items-center gap-1 rounded-full bg-[#D9E8D1] px-3 py-2 text-[#244047]"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <FileText size={12} /> CV
                                  </a>
                                )}
                                {item.attestation_url && (
                                  <a
                                    href={buildFileUrl(item.attestation_url)}
                                    className="inline-flex items-center gap-1 rounded-full bg-[#F7F3E9] px-3 py-2 text-[#244047]"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Check size={12} /> Attestation
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

                          {item.statut === "EN_ATTENTE" && (
                            <div className="w-full md:w-[320px] space-y-2 rounded-[22px] bg-white p-3 border border-gray-100">
                              <textarea
                                placeholder="Commentaire de décision (optionnel)"
                                value={decisionNotes[item.id] || ""}
                                onChange={(e) =>
                                  setDecisionNotes((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.value,
                                  }))
                                }
                                className="w-full min-h-[92px] rounded-2xl border border-gray-200 bg-[#F8FAFC] px-3 py-3 text-xs font-medium outline-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    void reviewRequest(item.id, "ACCEPTEE")
                                  }
                                  className="flex-1 rounded-2xl bg-[#436D75] px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-white"
                                >
                                  Accepter
                                </button>
                                <button
                                  onClick={() =>
                                    void reviewRequest(item.id, "REFUSEE")
                                  }
                                  className="flex-1 rounded-2xl bg-[#FDE5E1] px-3 py-3 text-xs font-black uppercase tracking-[0.15em] text-[#B23A2B] border border-[#E98A7D]/40"
                                >
                                  Refuser
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
