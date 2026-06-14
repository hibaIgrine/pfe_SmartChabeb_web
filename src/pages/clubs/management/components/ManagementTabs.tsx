/**
 * ManagementTabs.tsx — Onglets de gestion des membres d'un club.
 *
 * RÔLE :
 *   Barre d'onglets dans ClubManagementView permettant de filtrer les inscriptions.
 *
 * ONGLETS :
 *   PENDING  (Clock)     — Demandes en attente de validation
 *   ACCEPTED (Users)     — Membres actifs (statut ACCEPTE)
 *   WAITING  (Hourglass) — Liste d'attente (capacité atteinte)
 *   REJECTED (XCircle)   — Inscriptions refusées
 *
 * Props :
 *   activeTab — Onglet sélectionné
 *   setTab()  — Change l'onglet
 *   counts    — Compteurs par statut { PENDING, ACCEPTED, WAITING, REJECTED }
 */
import { Clock, Users, Hourglass, XCircle } from "lucide-react"; // 💡 Ajout de XCircle

export const ManagementTabs = ({ activeTab, setTab, counts }: any) => {
  const tabs = [
    {
      id: "PENDING",
      label: "Demandes",
      icon: <Clock size={16} />,
      count: counts.pending,
    },
    {
      id: "WAITLIST",
      label: "File d'attente",
      icon: <Hourglass size={16} />,
      count: counts.waitlist,
    },
    {
      id: "MEMBERS",
      label: "Membres Actifs",
      icon: <Users size={16} />,
      count: counts.members,
    },
    {
      id: "REJECTED",
      label: "Refusés",
      icon: <XCircle size={16} />,
      count: counts.rejected,
    }, // 💡 NOUVEAU
  ];

  return (
    <div className="flex bg-white p-2 rounded-[30px] shadow-sm border border-gray-100 gap-2 overflow-x-auto custom-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setTab(tab.id)}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-3 py-4 rounded-[22px] font-black text-xs transition-all ${
            activeTab === tab.id
              ? "bg-smart-teal text-white shadow-lg shadow-smart-teal/20"
              : "text-gray-400 hover:bg-smart-sage/10 hover:text-smart-teal"
          }`}
        >
          {tab.icon}
          <span className="uppercase tracking-widest">{tab.label}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}`}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
};
