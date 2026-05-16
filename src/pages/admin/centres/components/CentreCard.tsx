import { Eye, Edit, Power, RefreshCw } from "lucide-react";

export const CentreCard = ({
  centre,
  onView,
  onEdit,
  onDelete,
  onReactivate,
}: any) => {
  return (
    <tr className="group hover:bg-[#FDFCF9] transition-all duration-300">
      <td className="py-6 pl-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#F7F3E9] rounded-2xl flex items-center justify-center font-black text-[#436d75] shadow-inner italic text-lg">
            {centre.nom[0].toUpperCase()}
          </div>
          <div>
            <span className="font-black text-[#1A1C1E] text-md block leading-none mb-1">
              {centre.nom}
            </span>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic">
              {centre.delegation}
            </span>
          </div>
        </div>
      </td>
      <td className="py-6 font-black text-[#436d75] text-sm uppercase">
        {centre.gouvernorat}
      </td>
      <td className="py-6 text-center">
        <p className="font-black text-[#1A1C1E] text-xs">
          {centre.code_postal}
        </p>
        <p className="text-[9px] text-gray-400 font-bold italic mt-1">
          {centre.telephone_centre}
        </p>
      </td>
      <td className="py-6 text-gray-400 text-[11px] font-medium max-w-[200px] truncate italic">
        {centre.adresse}
      </td>
      <td className="py-4 sm:py-6 pr-3 sm:pr-4 lg:sticky lg:right-0 lg:bg-[#FDFCF9] lg:group-hover:bg-[#FDFCF9] lg:z-10 lg:shadow-[-12px_0_24px_-18px_rgba(0,0,0,0.18)]">
        <div className="flex flex-wrap justify-end gap-1.5 sm:gap-2 max-w-[320px] ml-auto">
          <button
            onClick={() => onView(centre)}
            className="px-2.5 sm:px-3 py-2 sm:py-2.5 bg-smart-sage/20 text-smart-teal rounded-xl hover:bg-smart-teal hover:text-white transition-all inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wide whitespace-nowrap"
          >
            <Eye size={16} />
            <span>Voir</span>
          </button>
          <button
            onClick={() => onEdit(centre)}
            className="px-2.5 sm:px-3 py-2 sm:py-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-smart-teal hover:text-white transition-all inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wide whitespace-nowrap"
          >
            <Edit size={16} />
            <span>Éditer</span>
          </button>
          {centre.est_actif !== false ? (
            <button
              onClick={() => onDelete(centre.id)}
              className="px-2.5 sm:px-3 py-2 sm:py-2.5 bg-[#FFF4EB] text-[#D97706] rounded-xl hover:bg-orange-500 hover:text-white transition-all inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wide whitespace-nowrap"
            >
              <Power size={16} />
              <span>Désactiver</span>
            </button>
          ) : (
            <button
              onClick={() => onReactivate(centre)}
              type="button"
              className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] uppercase tracking-wide font-black hover:bg-emerald-600 hover:text-white transition-all inline-flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
            >
              <RefreshCw size={16} />
              <span>Réactiver</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
