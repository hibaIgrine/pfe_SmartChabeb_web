import { Plus } from "lucide-react";

type Props = {
  showInactive: boolean;
  onToggleInactive: (value: boolean) => void;
  onCreate: () => void;
};

export default function EventHeader({
  showInactive,
  onToggleInactive,
  onCreate,
}: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 className="text-6xl font-black italic tracking-tighter text-smart-teal">
          Gestion Événements
        </h1>
        <p className="text-gray-400 text-[10px] uppercase font-black tracking-[0.25em] mt-2">
          Créer, gérer et suivre les participants
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-bold text-gray-500">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => onToggleInactive(e.target.checked)}
            className="accent-[#436D75]"
          />
          Afficher inactifs
        </label>
        <button
          onClick={onCreate}
          className="px-5 py-3 rounded-2xl bg-[#436D75] text-white font-black text-sm hover:bg-black transition flex items-center gap-2"
        >
          <Plus size={18} /> Nouvel événement
        </button>
      </div>
    </div>
  );
}
