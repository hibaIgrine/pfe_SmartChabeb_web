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

  const normalizeTime = (value: string) => {
    const parts = value.split(":");
    if (parts.length < 2) return "08:00";
    const hh = String(Math.min(Math.max(Number(parts[0]) || 0, 0), 23)).padStart(
      2,
      "0",
    );
    const mm = String(Math.min(Math.max(Number(parts[1]) || 0, 0), 59)).padStart(
      2,
      "0",
    );
    return `${hh}:${mm}`;
  };

  const addMinutes = (time: string, minutes: number) => {
    const normalized = normalizeTime(time);
    const [h, m] = normalized.split(":").map(Number);
    const total = Math.min(23 * 60 + 59, h * 60 + m + minutes);
    const hh = String(Math.floor(total / 60)).padStart(2, "0");
    const mm = String(total % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const timeToMinutes = (time: string) => {
    const [h, m] = normalizeTime(time).split(":").map(Number);
    return h * 60 + m;
  };

  const timelineView = [...form.timeline]
    .map((step, originalIndex) => ({ step, originalIndex }))
    .sort(
      (a, b) =>
        timeToMinutes(a.step.start_time || "00:00") -
        timeToMinutes(b.step.start_time || "00:00"),
    );

  const addTimelineStep = () => {
    const latestStep = [...form.timeline].sort(
      (a, b) =>
        timeToMinutes(a.end_time || "00:00") -
        timeToMinutes(b.end_time || "00:00"),
    )[form.timeline.length - 1];

    const nextStart = latestStep?.end_time
      ? normalizeTime(latestStep.end_time)
      : form.start_time;
    const nextEnd = addMinutes(nextStart, 60);

    onChangeForm({
      timeline: [
        ...form.timeline,
        {
          title: "",
          start_time: nextStart,
          end_time: nextEnd,
          details: "",
        },
      ],
    });
  };

  const updateTimelineStep = (
    index: number,
    patch: Partial<(typeof form.timeline)[number]>,
  ) => {
    const next = [...form.timeline];
    next[index] = { ...next[index], ...patch };
    onChangeForm({ timeline: next });
  };

  const removeTimelineStep = (index: number) => {
    onChangeForm({
      timeline: form.timeline.filter((_, i) => i !== index),
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[2500] bg-black/35 p-4 md:p-6 flex items-center justify-center">
      <div className="h-[92vh] w-[min(96vw,1280px)] rounded-[28px] border border-gray-100 bg-white shadow-2xl overflow-hidden flex flex-col">
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-2xl md:text-3xl font-black italic text-smart-teal">
              {editingEvent ? "Modifier événement" : "Créer un événement"}
            </h3>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1">
              Formulaire complet événement
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 bg-[#F7FBFC]">
          <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-4 md:p-6">
            {formAlert && (
              <div
                className={`mb-4 px-3 py-2 rounded-xl border text-xs md:text-sm font-bold ${
                  formAlert.type === "success"
                    ? "bg-[#D9E8D1] text-[#436D75] border-[#436D75]/20"
                    : "bg-[#FDE5E1] text-[#B23A2B] border-[#E98A7D]/40"
                }`}
              >
                {formAlert.msg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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

          <Select
            label="Récurrence"
            value={form.recurrence_type}
            onChange={(v) =>
              onChangeForm({
                recurrence_type: v as "NONE" | "DAILY" | "WEEKLY" | "MONTHLY",
              })
            }
            options={[
              { value: "NONE", label: "Aucune" },
              { value: "DAILY", label: "Quotidienne" },
              { value: "WEEKLY", label: "Hebdomadaire" },
              { value: "MONTHLY", label: "Mensuelle" },
            ]}
          />

          <Input
            label="Nb occurrences"
            type="text"
            value={form.recurrence_count}
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(v) =>
              onChangeForm({ recurrence_count: v.replace(/[^0-9]/g, "") })
            }
          />

          <Input
            label="Fin récurrence"
            type="date"
            value={form.recurrence_until}
            min={form.date_event || today}
            onChange={(v) => onChangeForm({ recurrence_until: v })}
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

              <div className="md:col-span-2 rounded-2xl border border-gray-200 p-3 md:p-4 bg-[#F9FBFC]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs font-black uppercase tracking-widest text-[#436D75]">
                Timeline de l'événement
              </p>
            </div>

            {form.timeline.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Aucune étape ajoutée. Exemple: 08:00-10:00 Conférence.
                </p>
                <button
                  type="button"
                  onClick={addTimelineStep}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-dashed border-[#436D75]/35 text-[#2D4E56] text-xs font-black hover:bg-[#EAF2F4] transition"
                >
                  + Ajouter la première étape
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {timelineView.map(({ step, originalIndex }, index) => (
                  <div
                    key={`${originalIndex}-${step.start_time}-${step.end_time}`}
                    className="rounded-xl border border-gray-200 bg-white p-3 shadow-[0_6px_20px_rgba(38,67,74,0.06)]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-black text-[#436D75] uppercase tracking-wider inline-flex items-center gap-2">
                        Étape {index + 1}
                        <span className="rounded-full bg-[#EAF2F4] px-2 py-0.5 text-[10px] text-[#2D4E56]">
                          {step.start_time || "--:--"} - {step.end_time || "--:--"}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={() => removeTimelineStep(originalIndex)}
                        className="text-[11px] font-black text-[#B23A2B]"
                      >
                        Supprimer
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                          Titre
                        </label>
                        <input
                          value={step.title}
                          onChange={(e) =>
                            updateTimelineStep(originalIndex, {
                              title: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Conférence"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                          Début
                        </label>
                        <input
                          type="time"
                          value={step.start_time}
                          onChange={(e) =>
                            updateTimelineStep(originalIndex, {
                              start_time: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                          Fin
                        </label>
                        <input
                          type="time"
                          value={step.end_time}
                          onChange={(e) =>
                            updateTimelineStep(originalIndex, {
                              end_time: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="md:col-span-4">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                          Détails (optionnel)
                        </label>
                        <input
                          value={step.details ?? ""}
                          onChange={(e) =>
                            updateTimelineStep(originalIndex, {
                              details: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Pause café, intervenant, salle..."
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addTimelineStep}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-dashed border-[#436D75]/35 text-[#2D4E56] text-xs font-black hover:bg-[#EAF2F4] transition"
                >
                  + Ajouter une étape sous la précédente
                </button>
              </div>
            )}
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur border-t border-gray-200 px-4 md:px-6 py-3">
          <div className="flex justify-end gap-2">
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
      </div>
    </div>,
    document.body,
  );
}
