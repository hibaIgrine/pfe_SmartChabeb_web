/**
 * ClubManagementView.tsx — Vue complète de gestion d'un club (RESPONSABLE_CLUB).
 *
 * RÔLE :
 *   Vue détaillée d'un club affichée dans ManagedClubDetailsPage.
 *   Composition de sous-composants : header + onglets + tableau d'inscriptions.
 *
 * STRUCTURE :
 *   ManagementHeader — Nom du club, statut, boutons actions (activer/désactiver)
 *   ManagementTabs   — Onglets: Membres | Statistiques | Paramètres
 *   InscriptionTable — Liste des inscriptions filtrée par statut (ACCEPTE/EN_ATTENTE/REFUSE)
 *
 * PROPS :
 *   club             — Données complètes du club
 *   onBack()         — Retour à la liste des clubs gérés
 *   onUpdateStatus() — Changer le statut du club (ACTIF/INACTIF)
 *   onMemberAction() — Accepter/refuser une inscription
 */
import { useState } from "react";
import { InscriptionTable } from "./components/InscriptionTable";
import { ManagementHeader } from "./components/ManagementHeader";
import { ManagementTabs } from "./components/ManagementTabs";


export const ClubManagementView = ({
  club,
  onBack,
  onUpdateStatus,
  onMemberAction,
}: any) => {
  const [activeTab, setActiveTab] = useState("PENDING");

  const currentRole = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").role ?? ""; }
    catch { return ""; }
  })();
  const isViewer = currentRole === "ADMIN" || currentRole === "RESPONSABLE_CENTRE";

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
              readOnly={isViewer}
              onAction={onUpdateStatus}
            />
          )}
          {activeTab === "WAITLIST" && (
            <InscriptionTable
              data={waitlist}
              type="WAITLIST"
              readOnly={isViewer}
              onAction={onUpdateStatus}
            />
          )}
          {activeTab === "MEMBERS" && (
            <InscriptionTable
              data={members}
              type="MEMBERS"
              readOnly={isViewer}
              onAction={onMemberAction}
            />
          )}
          {activeTab === "REJECTED" && (
            <InscriptionTable
              data={rejected}
              type="REJECTED"
              readOnly={isViewer}
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
