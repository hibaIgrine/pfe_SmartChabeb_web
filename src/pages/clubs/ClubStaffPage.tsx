import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Users, User, Search, Calendar } from "lucide-react";
import api from "../../api/axios";
import { ClubPageShell } from "./components/ClubPageShell";
import { getAuthHeaders } from "./clubUtils";

export default function ClubStaffPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const [club, setClub] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadClub = async () => {
      if (!clubId) {
        setError("Club introuvable");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/clubs/${clubId}`, {
          headers: getAuthHeaders(),
        });
        setClub(response.data);
      } catch (err: any) {
        console.error("Erreur chargement club :", err);
        setError(
          err?.response?.data?.message ||
            "Impossible de charger les informations du club.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadClub();
  }, [clubId]);

  const staffMembers = Array.isArray(club?.staff) ? club.staff : [];
  const responsableCount = club?.responsable ? 1 : 0;
  const personnelCount = staffMembers.length + responsableCount;

  const filteredStaff = staffMembers.filter((item: any) => {
    const query = search.toLowerCase().trim();
    const name =
      `${item.utilisateur?.nom ?? ""} ${item.utilisateur?.prenom ?? ""}`.toLowerCase();
    const role = item.role_dans_club?.toString().toLowerCase() ?? "";
    return name.includes(query) || role.includes(query);
  });

  const inscriptions = Array.isArray(club?.inscriptions)
    ? club.inscriptions
    : [];
  const totalMembers = inscriptions.length;
  const staffCount = staffMembers.length;

  if (!club && !loading && error) {
    return (
      <ClubPageShell
        title="Personnel du club"
        subtitle="Erreur"
        loading={false}
        error={error}
        notification={null}
      >
        <></>
      </ClubPageShell>
    );
  }

  return (
    <ClubPageShell
      title="Personnel du club"
      subtitle={club?.nom ?? "Chargement..."}
      loading={loading}
      error={error}
      notification={null}
    >
      <div className="grid grid-cols-2 gap-4 text-center mb-10">
        <div className="rounded-[30px] bg-smart-sage/20 p-6">
          <div className="text-xs uppercase tracking-[0.4em] text-gray-500 font-black">
            Personnel
          </div>
          <div className="text-3xl font-black text-smart-teal">
            {personnelCount}
          </div>
        </div>
        <div className="rounded-[30px] bg-smart-teal/10 p-6">
          <div className="text-xs uppercase tracking-[0.4em] text-gray-500 font-black">
            Membres
          </div>
          <div className="text-3xl font-black text-smart-teal">
            {totalMembers}
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[2.1fr_1fr]">
        <div className="space-y-8">
          <section className="bg-[#F7F3E9] border border-gray-100 rounded-[32px] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-black text-smart-teal">
                Responsable principal
              </h2>
              <p className="text-sm text-gray-500">
                Le responsable officiel du club.
              </p>
            </div>

            {club?.responsable ? (
              <div className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[24px] bg-smart-sage/50 flex items-center justify-center text-xl text-smart-teal">
                    <User size={24} />
                  </div>
                  <div>
                    <div className="mt-2 text-lg font-black text-gray-900">
                      {club.responsable?.nom ?? ""}{" "}
                      {club.responsable?.prenom ?? ""}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-white border border-gray-100 p-6 text-sm text-gray-500">
                Aucun responsable assigné pour le moment.
              </div>
            )}
          </section>

          <section className="bg-white border border-gray-100 rounded-[32px] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-smart-teal">
                  Equipe du club
                </h2>
                <p className="text-sm text-gray-500">
                  Tous les collaborateurs, coachs et animateurs rattachés.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-smart-sage/10 px-4 py-2 text-[11px] uppercase tracking-[0.35em] font-black text-smart-teal">
                <Users size={14} /> {staffCount} membre(s)
              </div>
            </div>

            <div className="relative mb-6">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un membre du staff..."
                className="w-full rounded-[24px] border border-gray-200 bg-white py-4 pl-12 pr-4 text-sm font-bold text-gray-700 outline-none focus:border-smart-teal focus:ring-2 focus:ring-smart-teal/10"
              />
            </div>

            {filteredStaff.length > 0 ? (
              <div className="space-y-4">
                {filteredStaff.map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-gray-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm text-gray-500 uppercase tracking-[0.35em] font-black">
                          {item.role_dans_club || "Staff"}
                        </div>
                        <div className="mt-2 text-lg font-black text-gray-900">
                          {item.utilisateur?.nom} {item.utilisateur?.prenom}
                        </div>
                      </div>
                      <div className="rounded-full bg-smart-teal/10 px-3 py-2 text-xs uppercase tracking-[0.35em] text-smart-teal font-black">
                        {item.utilisateur?.email ?? "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                Aucun membre du staff ne correspond à votre recherche.
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-[32px] p-6">
            <div className="flex items-center gap-3 text-sm uppercase tracking-[0.35em] text-gray-400 font-black">
              <Calendar size={14} /> Statistiques
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm font-black text-gray-700">
                <span>Nombre total de personnel</span>
                <span>{personnelCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-black text-gray-700">
                <span>Nombre d’inscriptions</span>
                <span>{totalMembers}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-black text-gray-700">
                <span>Statut du club</span>
                <span>{club?.est_actif ? "Actif" : "Désactivé"}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </ClubPageShell>
  );
}
