import { useState } from "react";
import { InscriptionTable } from "./components/InscriptionTable";
import { ManagementHeader } from "./components/ManagementHeader";
import { ManagementTabs } from "./components/ManagementTabs";


export const ClubManagementView = ({
  club,
  onBack,
  onUpdateStatus,
  onRemoveMember,
}: any) => {
  const [activeTab, setActiveTab] = useState("PENDING");

  // Filtrage intelligent
  const pending =
    club.inscriptions?.filter((i: any) => i.statut === "EN_ATTENTE") || [];
  const waitlist =
    club.inscriptions?.filter((i: any) => i.statut === "LISTE_ATTENTE") || [];
  const members =
    club.inscriptions?.filter((i: any) => i.statut === "ACCEPTE") || [];
    const rejected =
      club.inscriptions?.filter((i: any) => i.statut === "REFUSE") || [];
  return (
    <div className="animate-in slide-in-from-right duration-700 bg-smart-bg min-h-screen p-10 absolute inset-0 z-[800] overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-10">
        <ManagementHeader
          club={club}
          membersCount={members.length}
          onBack={onBack}
        />

        <ManagementTabs
          activeTab={activeTab}
          setTab={setActiveTab}
          counts={{
            pending: pending.length,
            waitlist: waitlist.length,
            members: members.length,
            rejected: rejected.length,
          }}
        />

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "PENDING" && (
            <InscriptionTable
              data={pending}
              type="PENDING"
              onAction={onUpdateStatus}
            />
          )}
          {activeTab === "WAITLIST" && (
            <InscriptionTable
              data={waitlist}
              type="WAITLIST"
              onAction={onUpdateStatus}
            />
          )}
          {activeTab === "MEMBERS" && (
            <InscriptionTable
              data={members}
              type="MEMBERS"
              onAction={onRemoveMember}
            />
          )}
          {activeTab === "REJECTED" && (
            <InscriptionTable
              data={rejected}
              type="REJECTED"
              onAction={onUpdateStatus}
            />
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-[9px] font-black text-gray-300 uppercase tracking-[0.5em] pt-10">
          Système de gestion SmartChabeb v2.0 • République Tunisienne
        </p>
      </div>
    </div>
  );
};
