import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarCheck,
  Edit3,
  Home,
  LayoutGrid,
  Loader2,
  Map,
  MapPin,
  Phone,
  Users,
  Hash,
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

export default function ResponsableCentrePage() {
  const [centre, setCentre] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const user = useMemo(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }, []);

  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const centreId = user?.centre?.id;

  const showToast = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadCentre = async () => {
    if (!centreId) {
      showToast("Aucun centre associé à votre compte.", "error");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/centres/${centreId}`, { headers });
      setCentre(res.data);
    } catch (err) {
      showToast("Impossible de charger les informations du centre.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCentre();
  }, [centreId]);

  const metrics = useMemo(
    () => ({
      espaces: centre?.locaux?.length ?? 0,
      clubs: centre?.clubs?.length ?? 0,
      inventaire: centre?.inventaire?.length ?? 0,
    }),
    [centre],
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {notification && (
        <div
          className={`fixed top-10 right-10 z-[1000] rounded-[30px] px-6 py-4 shadow-2xl border border-white/20 backdrop-blur-md ${
            notification.type === "error"
              ? "bg-[#E98A7D] text-white"
              : "bg-[#D9E8D1] text-[#436D75]"
          }`}
        >
          <p className="font-black uppercase tracking-[0.3em] text-sm">
            {notification.msg}
          </p>
        </div>
      )}

      <section className="rounded-[40px] bg-white shadow-2xl border border-gray-100 p-10">
        <div className="flex flex-col lg:flex-row justify-between gap-8">
          <div className="max-w-2xl">
            <span className="text-[10px] tracking-[0.4em] uppercase text-gray-400 font-black">
              Espace responsable · Centre de Jeunesse
            </span>
            <h1 className="mt-4 text-4xl md:text-5xl font-black text-[#1A1C1E] tracking-tight leading-tight">
              {centre?.nom || "Mon Centre"}
            </h1>
            <p className="mt-5 text-gray-500 leading-8 text-sm md:text-base">
              Consultez les données institutionnelles, suivez vos équipes et
              mettez à jour rapidement les informations essentielles de votre
              établissement.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-[30px] bg-[#EDF7F2] p-6 shadow-sm border border-[#D9E8D1]">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-black mb-3">
                Responsable
              </p>
              <h2 className="text-xl font-black text-[#436D75]">
                {user?.nom} {user?.prenom}
              </h2>
              <p className="mt-2 text-sm text-gray-500 uppercase tracking-[0.3em] font-bold">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center gap-3 rounded-[30px] bg-[#436D75] px-8 py-4 text-white font-black uppercase tracking-[0.25em] shadow-xl hover:bg-black transition-all active:scale-[0.98]"
            >
              <Edit3 size={18} /> Modifier mon centre
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-28">
          <Loader2 className="animate-spin text-[#436D75]" size={48} />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <CentreMetricCard
              icon={<LayoutGrid size={20} />}
              label="Espaces"
              value={metrics.espaces}
              helpText="Salles, terrains et studios rattachés à votre centre."
            />
            <CentreMetricCard
              icon={<Users size={20} />}
              label="Clubs"
              value={metrics.clubs}
              helpText="Activités et associations gérées depuis votre institution."
            />
            <CentreMetricCard
              icon={<CalendarCheck size={20} />}
              label="Inventaire"
              value={metrics.inventaire}
              helpText="Articles et équipements administrés par votre équipe."
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
            <section className="rounded-[40px] bg-white p-10 shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-[#1A1C1E]">
                    Informations du Centre
                  </h2>
                  <p className="mt-2 text-sm text-gray-400">
                    Données officielles et coordonnées institutionnelles.
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-black">
                  ID #{centre?.id?.slice(0, 8)}
                </span>
              </div>

              <div className="space-y-5">
                <InfoRow
                  icon={<MapPin size={18} />}
                  label="Gouvernorat"
                  value={centre?.gouvernorat}
                />
                <InfoRow
                  icon={<Map size={18} />}
                  label="Délégation"
                  value={centre?.delegation}
                />
                <InfoRow
                  icon={<Hash size={18} />}
                  label="Code postal"
                  value={centre?.code_postal || "—"}
                />
                <InfoRow
                  icon={<Phone size={18} />}
                  label="Téléphone"
                  value={centre?.telephone_centre || "—"}
                />
                <InfoRow
                  icon={<Home size={18} />}
                  label="Adresse"
                  value={centre?.adresse || "—"}
                />
              </div>
            </section>

            <aside className="rounded-[40px] bg-[#436D75] p-10 text-white shadow-2xl border border-white/10">
              <div className="mb-8">
                <h3 className="text-xl font-black uppercase tracking-[0.3em]">
                  Fiche institutionnelle
                </h3>
                <p className="mt-3 text-sm text-[#D9E8D1] leading-6">
                  Toutes les données de votre centre sont centralisées ici. Vous
                  pouvez les mettre à jour dès que nécessaire.
                </p>
              </div>
              <div className="space-y-6">
                <StatRow
                  icon={<Building2 size={18} />}
                  label="Structure"
                  value={centre?.nom}
                />
                <StatRow
                  icon={<Users size={18} />}
                  label="Responsable"
                  value={`${user?.nom} ${user?.prenom}`}
                />
                <StatRow
                  icon={<CalendarCheck size={18} />}
                  label="Locaux"
                  value={`${metrics.espaces} élément(s)`}
                />
                <StatRow
                  icon={<LayoutGrid size={18} />}
                  label="Clubs"
                  value={`${metrics.clubs} actif(s)`}
                />
              </div>
            </aside>
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
    <div className="grid grid-cols-[34px_1fr] gap-4 items-center">
      <div className="w-10 h-10 rounded-3xl bg-[#F7F3E9] text-[#436D75] flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-black">
          {label}
        </p>
        <p className="mt-2 text-sm text-[#1A1C1E] font-bold">{value}</p>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-11 h-11 rounded-3xl bg-white/10 text-white flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/70 font-black">
          {label}
        </p>
        <p className="mt-2 text-sm font-black">{value}</p>
      </div>
    </div>
  );
}
