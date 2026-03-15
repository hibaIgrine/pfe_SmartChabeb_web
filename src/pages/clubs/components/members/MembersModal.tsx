import { X, Users } from "lucide-react";
import { PendingRequests } from "./PendingRequests";
import { MemberList } from "./MemberList";


export const MembersModal = ({
  club,
  onClose,
  onUpdateStatus,
  onRemoveMember,
}: any) => {
  if (!club) return null;

  // 💡 Séparation logique des listes selon le statut
  const pending =
    club.inscriptions?.filter(
      (i: any) => i.statut === "EN_ATTENTE" || i.statut === "LISTE_ATTENTE",
    ) || [];
  const accepted =
    club.inscriptions?.filter((i: any) => i.statut === "ACCEPTE") || [];

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6">
      <div className="bg-[#F7F3E9] rounded-[50px] p-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl relative border-4 border-white animate-in zoom-in">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 bg-white p-2 rounded-full text-gray-400 hover:text-black shadow-sm transition-all"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-smart-teal text-white rounded-2xl flex items-center justify-center shadow-lg">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-smart-teal italic leading-none">
              {club.nom}
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Gestion des adhésions
            </p>
          </div>
        </div>

        {/* ZONE DE VALIDATION */}
        <div className="mb-10">
          <h4 className="text-xs font-black text-smart-salmon uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-smart-salmon animate-pulse"></span>
            Demandes à traiter ({pending.length})
          </h4>
          <PendingRequests requests={pending} onAction={onUpdateStatus} />
        </div>

        {/* ZONE MEMBRES ACTIFS */}
        <div>
          <h4 className="text-xs font-black text-smart-teal uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-smart-sage"></span>
            Membres Actifs ({accepted.length}
            {club.capacite ? ` / ${club.capacite}` : ""})
          </h4>
          <MemberList members={accepted} onRemove={onRemoveMember} />
        </div>
      </div>
    </div>
  );
};
