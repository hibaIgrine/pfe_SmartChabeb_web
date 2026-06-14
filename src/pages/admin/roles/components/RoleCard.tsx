/**
 * RoleCard.tsx — Carte d'affichage d'un grade/habilitation dans RolesPage.
 *
 * RÔLE :
 *   Présente un rôle de club avec ses statistiques et actions de gestion.
 *
 * INFORMATIONS :
 *   Nom du rôle, description, nombre de membres ayant ce rôle (filteredCount)
 *
 * ACTIONS :
 *   Edit3  → Modifier le rôle (ouvre RoleModals en mode 'edit')
 *   Trash2 → Supprimer le rôle (ouvre RoleModals en mode 'delete')
 */
import { ShieldCheck, Edit3, Trash2 } from "lucide-react";

export const RoleCard = ({ role, filteredCount, onEdit, onDelete }: any) => (
  <div className="bg-white p-6 rounded-[30px] border border-gray-100 flex flex-col justify-between group hover:shadow-xl transition-all duration-300 relative overflow-hidden">
    <div className="flex justify-between items-start mb-6">
      <div className="bg-smart-bg p-3 rounded-xl text-smart-teal shadow-inner">
        <ShieldCheck size={18} />
      </div>
      <div className="text-right">
        <p className="text-2xl font-black text-smart-teal leading-none italic">
          {filteredCount}
        </p>
        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1">
          Habilitations
        </p>
      </div>
    </div>
    <div>
      <h3 className="text-md font-black text-smart-teal uppercase tracking-tighter leading-tight">
        {role.nom}
      </h3>
      <p className="text-gray-400 text-[10px] font-medium mt-2 leading-relaxed line-clamp-2 italic">
        {role.description || "Droits d'accès standards."}
      </p>
    </div>
    <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end gap-1">
      <button
        onClick={() => onEdit(role)}
        className="p-2 text-gray-300 hover:text-smart-teal hover:bg-smart-sage/20 rounded-lg transition-all"
      >
        <Edit3 size={14} />
      </button>
      <button
        onClick={() => onDelete(role)}
        className="p-2 text-gray-300 hover:text-smart-salmon hover:bg-red-50 rounded-lg transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  </div>
);
