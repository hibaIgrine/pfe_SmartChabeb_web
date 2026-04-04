import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type {
  AlertState,
  ClubLite,
  EventForm,
  EventItem,
  LocalLite,
} from "../types";
import { getCurrentTimeHHMM } from "../utils";
import { Input, Select } from "./FormFields";

type Props = {
  isOpen: boolean;
  editingEvent: EventItem | null;
  form: EventForm;
  clubs: ClubLite[];
  filteredLocaux: LocalLite[];
  today: string;
  formAlert: AlertState;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChangeForm: (patch: Partial<EventForm>) => void;
};

export default function EventFormModal({
  isOpen,
  editingEvent,
  form,
  clubs,
  filteredLocaux,
  today,
  formAlert,
  isSaving,
  onClose,
  onSubmit,
  onChangeForm,
}: Props) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2500] bg-black/35 flex items-center justify-center p-4">
      <div className="w-[min(96vw,980px)] bg-white rounded-[24px] border border-gray-100 shadow-2xl p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl md:text-2xl font-black italic text-smart-teal">
            {editingEvent ? "Modifier événement" : "Créer un événement"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {formAlert && (
          <div
            className={`mb-3 px-3 py-2 rounded-xl border text-xs md:text-sm font-bold ${
              formAlert.type === "success"
                ? "bg-[#D9E8D1] text-[#436D75] border-[#436D75]/20"
                : "bg-[#FDE5E1] text-[#B23A2B] border-[#E98A7D]/40"
            }`}
          >
            {formAlert.msg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <Input
            label="Nom"
            value={form.nom}
            onChange={(v) => onChangeForm({ nom: v })}
          />
          <Input
            label="Date"
            type="date"
            value={form.date_event}
            min={today}
            onChange={(v) => onChangeForm({ date_event: v })}
          />
          <Input
            label="Heure début"
            type="time"
            value={form.start_time}
            min={form.date_event === today ? getCurrentTimeHHMM() : undefined}
            onChange={(v) => onChangeForm({ start_time: v })}
          />
          <Input
            label="Heure fin"
            type="time"
            value={form.end_time}
            min={form.start_time || undefined}
            onChange={(v) => onChangeForm({ end_time: v })}
          />

          <Select
            label="Club"
            value={form.club_id}
            onChange={(v) => onChangeForm({ club_id: v, locaux_id: "" })}
            options={clubs.map((c) => ({ value: c.id, label: c.nom }))}
          />

          <Select
            label="Local"
            value={form.locaux_id}
            onChange={(v) => onChangeForm({ locaux_id: v })}
            options={filteredLocaux.map((l) => ({
              value: l.id,
              label: `${l.nom}${l.type ? ` (${l.type})` : ""}`,
            }))}
          />

          <Input
            label="Capacité"
            type="text"
            value={form.capacity}
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(v) =>
              onChangeForm({ capacity: v.replace(/[^0-9]/g, "") })
            }
          />

          <div className="md:col-span-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onChangeForm({ description: e.target.value })}
              className="mt-1.5 w-full min-h-20 rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#436D75]/40"
              placeholder="Objectif de l'événement..."
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-[#436D75] text-white font-black text-sm disabled:opacity-60"
          >
            {isSaving
              ? "Enregistrement..."
              : editingEvent
                ? "Mettre à jour"
                : "Créer"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
