import { MapPin, Phone, Eye, Edit, Trash2 } from "lucide-react";

export const CentreCard = ({ centre, onView, onEdit, onDelete }: any) => {
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
      <td className="py-6 pr-4">
        <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <button
            onClick={() => onView(centre)}
            className="p-2.5 bg-smart-sage/20 text-smart-teal rounded-xl hover:bg-smart-teal hover:text-white transition-all"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => onEdit(centre)}
            className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-smart-teal hover:text-white transition-all"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(centre.id)}
            className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};
