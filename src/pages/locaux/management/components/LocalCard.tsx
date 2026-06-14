/**
 * LocalCard.tsx — Carte d'affichage d'un local/salle dans la liste des locaux.
 *
 * RÔLE :
 *   Présente les informations d'un local avec actions de gestion.
 *
 * INFORMATIONS :
 *   Nom, type (salle, terrain, gymnase...), capacité (Users), tarif horaire (DollarSign),
 *   localisation (MapPin), équipements disponibles (Monitor, Theater...)
 *
 * ACTIONS :
 *   Edit3  → Modifier le local (EditLocalModal)
 *   Trash2 → Supprimer le local (DeleteLocalModal)
 */
import {
  Users,
  MapPin,
  DollarSign,
  Edit3,
  Trash2,
  Monitor,
  Theater,
  Trophy,
  Coffee,
  Hash,
} from "lucide-react";

const TYPE_LABELS: any = {
  SPORT: {
    label: "Infrastructure Sportive",
    color: "bg-blue-50 text-blue-600",
    icon: <Trophy size={14} />,
  },
  CULTURE: {
    label: "Espace Culturel",
    color: "bg-purple-50 text-purple-600",
    icon: <Theater size={14} />,
  },
  INFORMATIQUE: {
    label: "Laboratoire IT",
    color: "bg-green-50 text-green-600",
    icon: <Monitor size={14} />,
  },
  REUNION: {
    label: "Salle Polyvalente",
    color: "bg-orange-50 text-orange-600",
    icon: <Coffee size={14} />,
  },
};

export const LocalCard = ({ local, onEdit, onDelete }: any) => {
  const typeInfo = TYPE_LABELS[local.type] || {
    label: local.type,
    color: "bg-gray-100 text-gray-600",
    icon: <Hash size={14} />,
  };

  return (
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-2xl transition-all duration-500">
      {/* Barre de Statut Supérieure */}
      <div className="p-6 pb-2 flex justify-between items-center">
        <span
          className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${typeInfo.color}`}
        >
          {typeInfo.icon} {typeInfo.label}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(local)}
            className="p-2.5 text-gray-300 hover:text-smart-teal hover:bg-smart-sage/20 rounded-xl transition-all"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => onDelete(local)}
            className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="px-8 py-4">
        <h3 className="text-2xl font-black text-smart-teal tracking-tighter italic leading-tight mb-1">
          {local.nom}
        </h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <MapPin size={10} className="text-smart-salmon" />{" "}
          {local.localisation || "RDC - Centre"}
        </p>
      </div>

      {/* Grid de Données Structurées */}
      <div className="grid grid-cols-2 border-t border-gray-50">
        <div className="p-6 border-r border-gray-50 flex flex-col items-center">
          <p className="text-[8px] font-black text-gray-300 uppercase mb-2">
            Capacité Max.
          </p>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-smart-teal opacity-40" />
            <span className="text-lg font-black text-smart-teal italic">
              {local.capacite}{" "}
              <small className="text-[10px] not-italic">pax</small>
            </span>
          </div>
        </div>
        <div className="p-6 flex flex-col items-center">
          <p className="text-[8px] font-black text-gray-300 uppercase mb-2">
            Redevance / Heure
          </p>
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-smart-salmon opacity-40" />
            <span className="text-lg font-black text-smart-salmon italic">
              {local.prix_heure}{" "}
              <small className="text-[10px] not-italic">TND</small>
            </span>
          </div>
        </div>
      </div>

      {/* Footer Fiche */}
      <div className="bg-gray-50/50 px-8 py-3 flex justify-between items-center">
        <span className="text-[8px] font-black text-gray-300 uppercase italic">
          Code Inventaire: {local.id.slice(0, 8)}
        </span>
        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
      </div>
    </div>
  );
};
