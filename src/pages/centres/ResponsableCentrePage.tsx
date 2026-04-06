import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Edit3,
  LayoutGrid,
  Loader2,
  MapPin,
  Package,
  Phone,
  Warehouse,
} from "lucide-react";
import api from "../../api/axios";
import { EditCentreModal } from "../admin/centres/components/EditCentreModal";
import { CentreMetricCard } from "./components/CentreMetricCard";

const GOUVERNORATS_AR = [
  "أريانة",
  "باجة",
  "بن عروس",
  "بنزرت",
  "تطاوين",
  "توزر",
  "تونس",
  "جندوبة",
  "زغوان",
  "سليانة",
  "سوسة",
  "سيدي بوزيد",
  "قبلي",
  "صفاقس",
  "قابس",
  "القصرين",
  "قفصة",
  "القيروان",
  "الكاف",
  "مدنين",
  "المنستير",
  "منوبة",
  "المهدية",
  "نابل",
];

type Toast = {
  msg: string;
  type: "success" | "error";
};

export default function ResponsableCentrePage() {
  const [centre, setCentre] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<Toast | null>(null);

  const user = useMemo(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }, []);

  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const centreId =
    currentUser?.centre?.id ??
    currentUser?.id_centre ??
    user?.centre?.id ??
    user?.id_centre;

  const showToast = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    window.setTimeout(() => setNotification(null), 4000);
  };

  const loadCentre = async () => {
    setLoading(true);
    try {
      const meRes = await api.get("/users/me/profile", { headers });
      const freshUser = meRes.data;
      setCurrentUser(freshUser);

      const resolvedCentreId =
        freshUser?.centre?.id ??
        freshUser?.id_centre ??
        user?.centre?.id ??
        user?.id_centre;

      if (!resolvedCentreId) {
        setCentre(null);
        showToast("Aucun centre associé à votre compte.", "error");
        setLoading(false);
        return;
      }

      const res = await api.get(`/centres/${resolvedCentreId}`, { headers });
      setCentre(res.data);
    } catch {
      showToast("Impossible de charger les informations du centre.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCentre();
  }, [centreId]);

  const metrics = useMemo(() => {
    const locaux = Array.isArray(centre?.locaux) ? centre.locaux : [];
    const clubs = Array.isArray(centre?.clubs) ? centre.clubs : [];
    const inventaire = Array.isArray(centre?.inventaire) ? centre.inventaire : [];

    return {
      locaux: locaux.length,
      clubs: clubs.length,
      inventaire: inventaire.length,
      locauxActifs: locaux.filter((item: any) => item.est_actif !== false).length,
      clubsActifs: clubs.filter((item: any) => item.est_actif !== false).length,
    };
  }, [centre]);

  const quickLinks = [
    { to: "/locaux", label: "Gérer les locaux", icon: <Warehouse size={16} /> },
    { to: "/clubs", label: "Gérer les clubs", icon: <LayoutGrid size={16} /> },
    { to: "/events", label: "Gérer les événements", icon: <CalendarDays size={16} /> },
    { to: "/presences", label: "Suivi présence", icon: <ClipboardCheck size={16} /> },
  ];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto animate-in fade-in duration-500">
      {notification && (
        <div
          className={`fixed top-10 right-10 z-[1000] rounded-[26px] px-6 py-4 shadow-2xl border border-white/20 backdrop-blur-md ${
            notification.type === "error"
              ? "bg-[#E98A7D] text-white"
              : "bg-[#D9E8D1] text-[#436D75]"
          }`}
        >
          <p className="font-black uppercase tracking-[0.2em] text-xs">
            {notification.msg}
          </p>
        </div>
      )}

      <section className="rounded-[34px] border border-[#D8E5E8] bg-gradient-to-br from-[#23444C] via-[#2F5A63] to-[#436D75] p-7 md:p-9 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-[#D9E8D1]">
              Tableau Responsable Centre
            </p>
            <h1 className="mt-3 text-3xl md:text-5xl font-black tracking-tight leading-tight">
              {centre?.nom || "Mon Centre"}
            </h1>
            <p className="mt-4 text-sm text-[#E2EEF1] leading-7">
              Vue dédiée à votre centre uniquement: pilotage des locaux, clubs,
              inventaire et informations institutionnelles.
            </p>
          </div>

          <div className="flex flex-col gap-3 min-w-[260px]">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-black">
                Responsable
              </p>
              <p className="mt-1 text-sm font-black">
                {currentUser?.nom ?? user?.nom} {currentUser?.prenom ?? user?.prenom}
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#D9E8D1] font-bold mt-1">
                RESPONSABLE_CENTRE
              </p>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-[#244047] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] hover:bg-[#F3F7F8] transition"
            >
              <Edit3 size={16} /> Modifier ce centre
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={48} className="animate-spin text-[#436D75]" />
        </div>
      ) : !centre ? (
        <div className="rounded-[28px] border border-[#F2D1CC] bg-[#FFF5F3] p-6 flex items-start gap-3">
          <AlertTriangle size={18} className="text-[#B23A2B] mt-0.5" />
          <p className="text-sm font-bold text-[#B23A2B]">
            Centre introuvable ou non accessible.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            <CentreMetricCard
              icon={<Warehouse size={20} />}
              label="Locaux"
              value={metrics.locaux}
              helpText={`${metrics.locauxActifs} actif(s) pour votre centre.`}
            />
            <CentreMetricCard
              icon={<LayoutGrid size={20} />}
              label="Clubs"
              value={metrics.clubs}
              helpText={`${metrics.clubsActifs} actif(s) dans votre centre.`}
            />
            <CentreMetricCard
              icon={<Package size={20} />}
              label="Inventaire"
              value={metrics.inventaire}
              helpText="Équipements enregistrés sur ce centre." 
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-[#1A1C1E]">Identité du Centre</h2>
              <p className="mt-1 text-xs text-gray-400 uppercase tracking-[0.2em] font-bold">
                Informations officielles
              </p>

              <div className="mt-6 space-y-4">
                <InfoRow
                  icon={<MapPin size={16} />}
                  label="Gouvernorat"
                  value={centre.gouvernorat || "—"}
                />
                <InfoRow
                  icon={<Building2 size={16} />}
                  label="Délégation"
                  value={centre.delegation || "—"}
                />
                <InfoRow
                  icon={<Phone size={16} />}
                  label="Téléphone"
                  value={centre.telephone_centre || "—"}
                />
                <InfoRow
                  icon={<MapPin size={16} />}
                  label="Adresse"
                  value={centre.adresse || "—"}
                />
              </div>
            </section>

            <section className="rounded-[30px] border border-[#D7E4E8] bg-[#F7FBFC] p-6 shadow-sm">
              <h2 className="text-lg font-black text-[#244047]">Actions Rapides</h2>
              <p className="mt-1 text-xs text-gray-500">
                Raccourcis de gestion pour votre centre.
              </p>
              <div className="mt-4 grid gap-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="inline-flex items-center justify-between rounded-xl border border-[#D7E4E8] bg-white px-3 py-2 text-sm font-bold text-[#2D4E56] hover:bg-[#EEF5F7] transition"
                  >
                    <span className="inline-flex items-center gap-2">
                      {link.icon}
                      {link.label}
                    </span>
                    <span className="text-xs text-gray-400">Ouvrir</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-black text-[#1A1C1E]">Clubs de Mon Centre</h3>
              <p className="mt-1 text-xs text-gray-500">Seulement les clubs rattachés à votre centre.</p>

              <div className="mt-4 space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {(centre.clubs ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400">Aucun club rattaché.</p>
                ) : (
                  (centre.clubs ?? []).map((club: any) => (
                    <div
                      key={club.id}
                      className="rounded-xl border border-gray-100 px-3 py-2 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-sm text-[#203A43]">{club.nom}</p>
                        <p className="text-[11px] text-gray-500">
                          Responsable: {club.responsable ? `${club.responsable.nom} ${club.responsable.prenom}` : "Non assigné"}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                          club.est_actif === false
                            ? "bg-gray-100 text-gray-500"
                            : "bg-[#D9E8D1] text-[#436D75]"
                        }`}
                      >
                        {club.est_actif === false ? "Inactif" : "Actif"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-black text-[#1A1C1E]">Locaux du Centre</h3>
              <p className="mt-1 text-xs text-gray-500">Vision opérationnelle des espaces disponibles.</p>

              <div className="mt-4 space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {(centre.locaux ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400">Aucun local enregistré.</p>
                ) : (
                  (centre.locaux ?? []).map((local: any) => (
                    <div
                      key={local.id}
                      className="rounded-xl border border-gray-100 px-3 py-2 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-sm text-[#203A43]">{local.nom}</p>
                        <p className="text-[11px] text-gray-500">
                          {local.type || "Type non défini"} • Capacité: {local.capacite ?? "—"}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                          local.est_actif === false
                            ? "bg-gray-100 text-gray-500"
                            : "bg-[#D9E8D1] text-[#436D75]"
                        }`}
                      >
                        {local.est_actif === false ? "Inactif" : "Actif"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}

      <EditCentreModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        centre={centre}
        gouvernorats={GOUVERNORATS_AR}
        onRefresh={loadCentre}
      />
    </div>
  );
}

function InfoRow({ icon, label, value }: any) {
  return (
    <div className="grid grid-cols-[30px_1fr] items-start gap-3">
      <div className="h-8 w-8 rounded-xl bg-[#F2F7F8] text-[#436D75] flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] font-black text-gray-400">
          {label}
        </p>
        <p className="mt-1 text-sm font-bold text-[#203A43]">{value}</p>
      </div>
    </div>
  );
}
