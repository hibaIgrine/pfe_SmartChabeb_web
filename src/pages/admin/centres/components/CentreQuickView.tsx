/**
 * CentreQuickView.tsx — Vue rapide latérale d'un centre (panneau glissant).
 *
 * RÔLE :
 *   Panneau de détails d'un centre sans naviguer vers une autre page.
 *   S'ouvre depuis l'icône Eye dans CentreCard.
 *
 * INFORMATIONS :
 *   Infos générales (adresse, téléphone, responsable), liste des clubs,
 *   statistiques (membres, événements), bouton édition rapide.
 *
 * API :
 *   GET /centres/:id (détails)
 *   GET /clubs?centreId=:id (clubs du centre)
 */
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Edit3,
  Loader2,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  UserPlus,
  UserRound,
  Users2,
  X,
} from "lucide-react";
import api from "../../../../api/axios";

export const CentreQuickView = ({ isOpen, onClose, centre, onEdit }: any) => {
  const [detailCentre, setDetailCentre] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [candidats, setCandidats] = useState<any[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchCandidate, setSearchCandidate] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");

  useEffect(() => {
    if (!isOpen || !centre?.id) return;

    let isMounted = true;

    const loadCentre = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/centres/${centre.id}`);
        if (isMounted) {
          setDetailCentre(response.data);
        }
      } catch {
        if (isMounted) {
          setDetailCentre(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCentre();

    return () => {
      isMounted = false;
    };
  }, [isOpen, centre?.id]);

  const resolvedCentre = detailCentre ?? centre;
  const responsable = resolvedCentre?.utilisateurs?.[0];
  const clubsCount =
    resolvedCentre?._count?.clubs ?? resolvedCentre?.clubs?.length ?? 0;
  const adherentsCount = resolvedCentre?._count?.utilisateurs ?? 0;
  const centreId = resolvedCentre?.id;

  const responsibleName = useMemo(() => {
    if (!responsable) return "Aucun responsable rattaché";
    return `${responsable.prenom} ${responsable.nom}`.trim();
  }, [responsable]);

  const filteredCandidates = useMemo(() => {
    const q = searchCandidate.trim().toLowerCase();
    if (!q) return candidats;
    return candidats.filter((user: any) => {
      const haystack =
        `${user.nom ?? ""} ${user.prenom ?? ""} ${user.email ?? ""} ${user.role ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [candidats, searchCandidate]);

  useEffect(() => {
    if (!assignOpen || !centreId) return;

    let isMounted = true;

    const loadCandidates = async () => {
      setCandidatesLoading(true);
      setAssignError("");
      try {
        const response = await api.get(`/users/staff-by-centre/${centreId}`);
        if (isMounted) {
          setCandidats(response.data || []);
        }
      } catch {
        if (isMounted) {
          setCandidats([]);
          setAssignError("Impossible de charger les membres de ce centre.");
        }
      } finally {
        if (isMounted) {
          setCandidatesLoading(false);
        }
      }
    };

    loadCandidates();

    return () => {
      isMounted = false;
    };
  }, [assignOpen, centreId]);

  useEffect(() => {
    if (!assignOpen) {
      setSelectedUserId("");
      setSearchCandidate("");
      setAssignError("");
      setAssignSuccess("");
    }
  }, [assignOpen]);

  const handleAssignResponsible = async () => {
    if (!centreId || !selectedUserId) return;

    setAssigning(true);
    setAssignError("");
    setAssignSuccess("");

    try {
      await api.patch(`/users/${selectedUserId}/assign-centre`, {
        id_centre: centreId,
      });
      setAssignSuccess("Responsable affecté avec succès.");
      setAssignOpen(false);
      const response = await api.get(`/centres/${centreId}`);
      setDetailCentre(response.data);
    } catch (error: any) {
      setAssignError(
        error?.response?.data?.message ||
          "Impossible d'affecter ce responsable au centre.",
      );
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen || !centre) return null;

  return (
    <div className="fixed inset-0 z-[1500] bg-[#1A1C1E]/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 md:p-8 animate-in fade-in duration-500">
      <div className="bg-[#F7F3E9] w-full h-[96vh] max-w-6xl rounded-[28px] sm:rounded-[36px] lg:rounded-[56px] shadow-2xl border-4 border-white relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        <div className="p-5 sm:p-7 md:p-10 flex flex-col gap-5 md:gap-6 border-b border-white/50 bg-gradient-to-r from-[#F7F3E9] via-[#F7F3E9] to-white">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-smart-teal/10 text-smart-teal text-[10px] font-black uppercase tracking-[0.25em]">
                <ShieldCheck size={14} /> Fiche du centre
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-smart-teal tracking-tight italic leading-none break-words">
                {resolvedCentre.nom}
              </h2>
              <p className="text-gray-400 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.28em] sm:tracking-[0.35em]">
                Informations détaillées et responsable du centre
              </p>
            </div>

            <button
              onClick={onClose}
              className="shrink-0 h-11 w-11 sm:h-12 sm:w-12 inline-flex items-center justify-center bg-white text-gray-400 hover:text-black rounded-full shadow-sm hover:rotate-90 transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <StatusPill active={resolvedCentre.est_actif !== false} />
            <Pill label="Clubs" value={clubsCount} />
            <Pill label="Adhérents" value={adherentsCount} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
          {loading && !detailCentre ? (
            <div className="h-full flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-smart-teal" size={42} />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
              <div className="xl:col-span-1 space-y-5 md:space-y-6">
                <div className="bg-white p-5 sm:p-6 md:p-8 rounded-[28px] sm:rounded-[34px] shadow-sm border border-white space-y-5">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-smart-teal italic tracking-tight">
                      {resolvedCentre.nom}
                    </h3>
                    <p className="text-gray-400 text-[11px] uppercase tracking-[0.25em] font-black mt-2">
                      Vue générale du centre
                    </p>
                  </div>

                  <div className="space-y-4">
                    <InfoItem
                      icon={<MapPin size={18} />}
                      label="Gouvernorat"
                      value={resolvedCentre.gouvernorat || "Non renseigné"}
                    />
                    <InfoItem
                      icon={<Building2 size={18} />}
                      label="Délégation"
                      value={resolvedCentre.delegation || "Non renseignée"}
                    />
                    <InfoItem
                      icon={<Phone size={18} />}
                      label="Téléphone"
                      value={resolvedCentre.telephone_centre || "Aucun contact"}
                    />
                    <InfoItem
                      icon={<Calendar size={18} />}
                      label="Date d'affiliation"
                      value={
                        resolvedCentre.date_creation
                          ? new Date(
                              resolvedCentre.date_creation,
                            ).toLocaleDateString()
                          : "Non renseignée"
                      }
                    />
                  </div>
                </div>

                <div className="bg-smart-teal text-white rounded-[28px] sm:rounded-[34px] p-5 sm:p-6 md:p-7 shadow-lg shadow-smart-teal/20 relative overflow-hidden">
                  <p className="text-[10px] font-black uppercase opacity-60 mb-3 tracking-[0.3em]">
                    Adresse
                  </p>
                  <p className="text-sm sm:text-[15px] font-bold leading-relaxed italic relative z-10 break-words">
                    {resolvedCentre.adresse ||
                      "L'adresse précise n'est pas encore renseignée."}
                  </p>
                  <MapPin className="absolute -bottom-4 -right-4 size-24 opacity-10 rotate-12" />
                </div>
              </div>

              <div className="xl:col-span-2 space-y-5 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <StatCard
                    icon={<Users2 size={28} />}
                    val={clubsCount}
                    label="Clubs hébergés"
                    sub="Clubs rattachés au centre"
                  />
                  <StatCard
                    icon={<UserRound size={28} />}
                    val={adherentsCount}
                    label="Adhérents rattachés"
                    sub="Membres liés au centre"
                  />
                </div>

                <div className="bg-white p-5 sm:p-6 md:p-8 rounded-[28px] sm:rounded-[34px] shadow-sm border border-white">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="bg-[#D9E8D1] p-4 rounded-2xl text-[#436d75] shadow-inner">
                      <UserRound size={26} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase text-gray-300 tracking-[0.3em]">
                        Responsable du centre
                      </p>
                      <h4 className="text-2xl font-black text-smart-teal italic tracking-tight">
                        {responsibleName}
                      </h4>
                    </div>
                  </div>

                  {responsable ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DetailChip
                        label="Email"
                        value={responsable.email || "Non renseigné"}
                      />
                      <DetailChip
                        label="Rôle"
                        value={responsable.role || "RESPONSABLE_CENTRE"}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 font-medium italic">
                      Aucun utilisateur responsable n’est actuellement rattaché
                      à ce centre.
                    </p>
                  )}

                  <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setAssignOpen(true)}
                      className="flex-1 bg-smart-teal text-white py-4 rounded-[24px] font-black text-sm hover:bg-black transition-all shadow-lg flex items-center justify-center gap-3 uppercase tracking-wider"
                    >
                      <UserPlus size={18} />
                      {responsable
                        ? "Changer le responsable"
                        : "Affecter un responsable"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1 sm:pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(resolvedCentre);
                    }}
                    className="flex-1 bg-smart-teal text-white py-4 sm:py-5 rounded-[24px] sm:rounded-[30px] font-black text-sm sm:text-lg hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    <Edit3 size={22} /> ÉDITER LES INFORMATIONS
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 sm:px-10 py-4 sm:py-5 bg-white text-smart-teal border-2 border-smart-teal/10 rounded-[24px] sm:rounded-[30px] font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {assignOpen && (
          <AssignResponsibleModal
            isOpen={assignOpen}
            onClose={() => setAssignOpen(false)}
            centreName={resolvedCentre.nom}
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
            search={searchCandidate}
            setSearch={setSearchCandidate}
            candidates={filteredCandidates}
            loading={candidatesLoading}
            error={assignError}
            success={assignSuccess}
            assigning={assigning}
            onConfirm={handleAssignResponsible}
          />
        )}

        <div className="bg-white/50 p-3 sm:p-4 text-center border-t border-white">
          <p className="text-[8px] sm:text-[9px] font-black text-gray-300 uppercase tracking-[0.55em] sm:tracking-[1em]">
            SmartChabeb Management System
          </p>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }: any) => (
  <div className="flex items-start gap-3 sm:gap-4">
    <div className="text-smart-salmon opacity-50 pt-1">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
        {label}
      </p>
      <p className="text-sm font-black text-smart-teal italic break-words">
        {value}
      </p>
    </div>
  </div>
);

const StatCard = ({ icon, val, label, sub }: any) => (
  <div className="bg-white p-5 sm:p-6 md:p-7 rounded-[28px] sm:rounded-[36px] shadow-sm border border-white flex items-center gap-4 sm:gap-5 group hover:shadow-xl transition-all duration-500 min-h-[132px]">
    <div className="bg-smart-bg p-4 sm:p-5 rounded-2xl text-smart-teal shadow-inner group-hover:scale-110 transition-transform duration-500">
      {icon}
    </div>
    <div>
      <div className="flex items-baseline gap-2">
        <p className="text-4xl sm:text-5xl font-black text-smart-teal italic tracking-tighter">
          {val}
        </p>
        <p className="text-[10px] sm:text-xs font-bold text-gray-300 uppercase">
          unités
        </p>
      </div>
      <p className="text-[10px] sm:text-[11px] font-black uppercase text-gray-400 tracking-widest mt-1">
        {label}
      </p>
      <p className="text-[8px] sm:text-[9px] font-bold text-smart-salmon/70 uppercase italic mt-1">
        {sub}
      </p>
    </div>
  </div>
);

const DetailChip = ({ label, value }: any) => (
  <div className="bg-smart-bg/70 rounded-[22px] p-4 border border-white/70">
    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">
      {label}
    </p>
    <p className="text-sm font-black text-smart-teal italic break-words">
      {value}
    </p>
  </div>
);

const Pill = ({ label, value }: { label: string; value: number }) => (
  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white text-smart-teal shadow-sm border border-white/80">
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
      {label}
    </span>
    <span className="text-sm font-black italic">{value}</span>
  </div>
);

const StatusPill = ({ active }: { active: boolean }) => (
  <div
    className={`inline-flex items-center gap-2 px-3 py-2 rounded-full shadow-sm border text-[10px] font-black uppercase tracking-[0.2em] ${active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-[#FFF4EB] text-[#D97706] border-orange-100"}`}
  >
    <span
      className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-orange-400"}`}
    />
    {active ? "Centre actif" : "Centre désactivé"}
  </div>
);

const AssignResponsibleModal = ({
  isOpen,
  onClose,
  centreName,
  selectedUserId,
  setSelectedUserId,
  search,
  setSearch,
  candidates,
  loading,
  error,
  success,
  assigning,
  onConfirm,
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1600] bg-[#1A1C1E]/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[28px] sm:rounded-[38px] shadow-2xl border border-white overflow-hidden">
        <div className="p-5 sm:p-6 md:p-7 border-b border-gray-100 bg-gradient-to-r from-[#F7F3E9] to-white flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
              Affectation du responsable
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-smart-teal italic leading-none mt-2">
              {centreName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-white shadow-sm text-gray-400 hover:text-black transition-all"
          >
            <X size={20} className="mx-auto" />
          </button>
        </div>

        <div className="p-5 sm:p-6 md:p-7 space-y-5">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
              size={18}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un membre par nom ou email..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-smart-bg border border-transparent focus:border-smart-sage outline-none text-sm font-medium text-smart-teal"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-[#FFF4EB] text-[#D97706] px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-emerald-50 text-emerald-700 px-4 py-3 text-sm font-medium flex items-center gap-2">
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          <div className="max-h-[48vh] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="animate-spin text-smart-teal" size={34} />
              </div>
            ) : candidates.length ? (
              candidates.map((user: any) => {
                const isSelected = selectedUserId === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full text-left rounded-[24px] border p-4 sm:p-5 transition-all ${isSelected ? "border-smart-teal bg-smart-bg shadow-sm" : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-black text-smart-teal text-base sm:text-lg italic leading-tight">
                          {user.prenom} {user.nom}
                        </p>
                        <p className="text-gray-400 text-xs sm:text-sm mt-1 break-words">
                          {user.email}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                          {user.role}
                        </span>
                        <span
                          className={`h-3 w-3 rounded-full ${isSelected ? "bg-smart-teal" : "bg-gray-200"}`}
                        />
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-10 text-center text-gray-400 text-sm italic">
                Aucun membre trouvé dans ce centre.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={onConfirm}
              disabled={!selectedUserId || assigning}
              className="flex-1 bg-smart-teal text-white py-4 rounded-[24px] font-black text-sm uppercase tracking-wider hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {assigning ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <UserPlus size={18} />
              )}
              Affecter le responsable
            </button>
            <button
              onClick={onClose}
              className="px-6 py-4 bg-white text-smart-teal border-2 border-smart-teal/10 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
