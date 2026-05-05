import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import {
  Building2,
  Users2,
  MapPin,
  Clock,
  ClipboardList,
  CalendarDays,
  List,
} from "lucide-react";
import { ClubResponsablesList } from "./components/ClubResponsablesList";
import { EditClubModal } from "./components/EditClubModal";
import { ALL_CATEGORIES } from "./components/AddClubModal";

function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-white/60">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
            {label}
          </p>
          <p className="text-2xl font-extrabold text-[#436D75] mt-1">{value}</p>
        </div>
        <div className="text-[#E98A7D]">{icon}</div>
      </div>
    </div>
  );
}

export default function ManagedClubDetailsPage() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [salles, setSalles] = useState<any[]>([]);

  useEffect(() => {
    if (!clubId) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Non authentifié");
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/clubs/${clubId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClub(res.data);

        try {
          const centresRes = await api.get(`/centres`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSalles(Array.isArray(centresRes.data) ? centresRes.data : []);
        } catch {
          setSalles([]);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [clubId]);

  const openEdit = () => {
    if (!club) return;
    setEditFormData({
      nom: club.nom ?? "",
      description: club.description ?? "",
      categorie: club.categorie ?? "",
      id_salle: club.id_centre ?? club.centre?.id ?? "",
      id_local: club.id_local ?? "",
      id_coach: club.id_coach ?? "",
      logo_url: club.logo_url ?? "",
      planning: club.planning ?? "",
      capacite: club.capacite ?? "",
      locale: club.locale_fixe ?? "",
      objectifs: Array.isArray(club?.planning?.objectifs)
        ? club.planning.objectifs
        : [],
      staff: club.staff ?? [],
      centre: club.centre ?? null,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: any, updatedData: any) => {
    e.preventDefault();
    if (!club) return;
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await api.patch(
        `/clubs/${club.id}`,
        {
          ...updatedData,
          id_centre: updatedData.id_salle,
          locale_fixe: updatedData.locale,
          planning: updatedData.planning,
        },
        { headers },
      );
      setIsEditOpen(false);
      // reload club
      const res = await api.get(`/clubs/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClub(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!club) return <div>Aucun club sélectionné.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#F3F6F5] flex items-center justify-center border border-white/40 shadow-inner">
            {club.logo_url ? (
              <img
                src={club.logo_url}
                alt={club.nom}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 size={36} className="text-[#436D75]" />
            )}
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-[#436D75]">
              {club.nom}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm uppercase font-black text-[#E98A7D] tracking-wider">
                {club.categorie || "Club"}
              </span>
              <span className="text-sm text-gray-500">{club.centre?.nom}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openEdit}
            className="bg-[#E98A7D] text-white px-4 py-2 rounded-xl font-bold shadow hover:opacity-95"
          >
            Modifier
          </button>

          <button
            onClick={() => navigate(`/clubs/${club.id}/staff`)}
            className="bg-[#436D75] text-white px-4 py-2 rounded-xl font-bold shadow hover:opacity-95"
          >
            Gérer le club
          </button>

          <button
            onClick={() => navigate(`/clubs/${club.id}/`)}
            className="bg-white border border-gray-200 px-4 py-2 rounded-xl font-bold text-[#436D75]"
          >
            Voir page publique
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-white/60">
            <h2 className="font-bold text-lg text-[#436D75]">Description</h2>
            <p className="mt-3 text-gray-700">{club.description || "—"}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              label="Local / Salle"
              value={club.locale_fixe || club.locale || "—"}
              icon={<MapPin size={28} />}
            />
            <StatCard
              label="Participants actifs"
              value={
                club._count?.inscriptions ?? club.inscriptions?.length ?? 0
              }
              icon={<Users2 size={28} />}
            />
            <StatCard
              label="Capacité"
              value={club.capacite ?? "—"}
              icon={<ClipboardList size={28} />}
            />
            <StatCard
              label="Démarrage"
              value={
                club.start_status?.is_started
                  ? "Démarré"
                  : club.start_status?.ready_for_validation
                    ? "Prêt"
                    : "En attente"
              }
              icon={<Clock size={28} />}
            />
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-white/60">
            <h3 className="font-bold text-[#436D75] mb-3">Planning</h3>
            <div className="space-y-3">
              {(() => {
                const raw = club.planning;
                let pl: any = {};
                if (!raw)
                  return <div className="text-gray-500">Aucun planning.</div>;
                try {
                  pl = typeof raw === "string" ? JSON.parse(raw) : raw;
                } catch {
                  pl = { texte: String(raw) };
                }

                const slots = Array.isArray(pl.slots) ? pl.slots : [];
                const objectifs = Array.isArray(pl.objectifs)
                  ? pl.objectifs
                  : [];

                return (
                  <div className="space-y-3">
                    {slots.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {slots.map((s: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 bg-[#F8FAFC] p-3 rounded-lg border border-gray-100"
                          >
                            <div className="p-2 rounded-md bg-white shadow-sm">
                              <CalendarDays
                                size={20}
                                className="text-[#436D75]"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-sm text-[#244047]">
                                {String(s.day || s.jour || "").replace(
                                  /_/g,
                                  " ",
                                )}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <Clock size={12} />
                                <span>
                                  {(s.startTime ||
                                    s.heure_debut ||
                                    s.start ||
                                    "") +
                                    " — " +
                                    (s.endTime || s.heure_fin || s.end || "")}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : pl.texte ? (
                      <div className="text-sm text-gray-700">{pl.texte}</div>
                    ) : (
                      <div className="text-gray-500">Aucun créneau défini.</div>
                    )}

                    {objectiveRender(objectifs, pl)}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-[#F7F3E9] p-4 rounded-2xl border border-white/60">
            <h4 className="font-black uppercase text-[10px] text-gray-500 tracking-wider">
              Responsable(s)
            </h4>
            <div className="mt-3">
              <ClubResponsablesList
                responsables={club.staff
                  ?.filter((s: any) => s.club_role?.nom === "RESPONSABLE_CLUB")
                  .map((s: any) => s.utilisateur)}
                responsable={club.responsable?.id ? club.responsable : null}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-white/60">
            <h4 className="font-bold text-[#436D75]">Actions rapides</h4>
            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={() => navigate(`/clubs/${club.id}/staff`)}
                className="w-full text-left px-3 py-2 rounded-md bg-[#436D75] text-white font-bold"
              >
                Gérer le personnel
              </button>
              <button
                onClick={() => navigate(`/presences?club=${club.id}`)}
                className="w-full text-left px-3 py-2 rounded-md border border-gray-200"
              >
                Présences
              </button>
            </div>
          </div>
        </aside>
      </div>

      <EditClubModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        formData={editFormData}
        setFormData={setEditFormData}
        salles={salles}
        categories={ALL_CATEGORIES}
        lockedCentreId={editFormData?.id_salle}
        lockedCentreName={editFormData?.centre?.nom}
      />
    </div>
  );
}

function objectiveRender(objectifs: any[], planningObj: any) {
  const list =
    objectifs && objectifs.length > 0
      ? objectifs
      : planningObj?.objectifs || [];
  if (!Array.isArray(list) || list.length === 0) return null;

  return (
    <div className="bg-[#F7F3E9] p-4 rounded-xl border border-white/60 mt-2">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-white rounded-md shadow-sm">
          <List size={18} className="text-[#436D75]" />
        </div>
        <h4 className="font-bold text-[#436D75]">Objectifs</h4>
      </div>
      <ul className="mt-3 space-y-2 list-inside">
        {list.map((o: any, i: number) => (
          <li key={i} className="flex items-start gap-3">
            <span className="text-[#E98A7D] font-bold">•</span>
            <span className="text-sm text-gray-700">{o}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
