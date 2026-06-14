/**
 * ManagementHeader.tsx — En-tête de la vue de gestion d'un club.
 *
 * RÔLE :
 *   Affiche le nom du club, le nombre de membres actifs, les places restantes,
 *   et le bouton retour vers la liste des clubs gérés.
 *
 * INFORMATIONS :
 *   club.nom, club.capacite, membersCount actifs
 *   freePlaces = capacite - membersCount (affiche ∞ si capacite = null)
 */
import { ArrowLeft, CheckCircle, Users } from "lucide-react";

export const ManagementHeader = ({ club, membersCount, onBack }: any) => {
  const freePlaces = club.capacite ? club.capacite - membersCount : "∞";

  return (
    <div className="space-y-8">
      {/* Bouton Retour */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-smart-teal transition-all group"
      >
        <ArrowLeft
          size={16}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Retour au réseau des clubs
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-6xl font-black text-smart-teal tracking-tighter italic leading-none">
            {club.nom}
          </h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] mt-4 tracking-[0.4em] flex items-center gap-2">
            <span className="w-8 h-1 bg-smart-salmon rounded-full"></span>
            Administration du Club
          </p>
        </div>

        {/* Stats Rapides */}
        <div className="flex gap-3">
          <StatCard
            label="Capacité"
            val={club.capacite || "Non déf."}
            icon={<Users size={14} />}
            color="text-smart-teal"
          />
          <StatCard
            label="Places Libres"
            val={freePlaces}
            icon={<CheckCircle size={14} />}
            color="text-green-500"
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, val, icon, color }: any) => (
  <div className="bg-white px-6 py-4 rounded-[25px] border border-gray-100 shadow-sm flex flex-col items-center min-w-[120px]">
    <div className={`${color} opacity-30 mb-1`}>{icon}</div>
    <p className={`text-2xl font-black italic ${color}`}>{val}</p>
    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">
      {label}
    </p>
  </div>
);
