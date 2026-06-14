import { createPortal } from "react-dom";
import { useState } from "react";
import { X } from "lucide-react";
import type {
  AlertState,
  ClubLite,
  EventForm,
  EventItem,
  LocalLite,
} from "../types";
import { Input, Select, TimePicker } from "./FormFields";
import api from "../../../api/axios";

type Props = {
  isOpen: boolean;
  editingEvent: EventItem | null;
  isAdmin: boolean;
  form: EventForm;
  clubs: ClubLite[];
  ownedClubs?: ClubLite[];
  filteredLocaux: LocalLite[];
  gouvernorats: string[];
  centresByGouvernorat: Array<{ id: string; nom: string }>;
  selectedGouvernorat: string;
  selectedCentreForAdmin: string;
  today: string;
  formAlert: AlertState;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChangeGouvernorat: (value: string) => void;
  onChangeCentreForAdmin: (value: string) => void;
  onChangeForm: (patch: Partial<EventForm>) => void;
};

export default function EventFormModal({
  isOpen,
  editingEvent,
  isAdmin,
  form,
  clubs,
  ownedClubs,
  filteredLocaux,
  gouvernorats,
  centresByGouvernorat,
  selectedGouvernorat,
  selectedCentreForAdmin,
  today,
  formAlert,
  isSaving,
  onClose,
  onSubmit,
  onChangeGouvernorat,
  onChangeCentreForAdmin,
  onChangeForm,
}: Props) {
  if (!isOpen) return null;

  const principalClubs = ownedClubs ?? clubs;

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] =
    useState<AlertState>(null);


  const normalizeTime = (value: string) => {
    const parts = value.split(":");
    if (parts.length < 2) return "08:00";
    const hh = String(
      Math.min(Math.max(Number(parts[0]) || 0, 0), 23),
    ).padStart(2, "0");
    const mm = String(
      Math.min(Math.max(Number(parts[1]) || 0, 0), 59),
    ).padStart(2, "0");
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

  const previewText = () => {
    const club = clubs.find((c) => c.id === form.club_id);
    const collaborators = clubs.filter((c) => form.club_ids.includes(c.id));
    const local = filteredLocaux.find((l) => l.id === form.locaux_id);
    const date = form.date_event || "-";
    const times = `${form.start_time || "--:--"} - ${form.end_time || "--:--"}`;
    const clubLabel = club
      ? club.nom
      : collaborators.length > 0
        ? collaborators.map((item) => item.nom).join(", ")
        : "Aucun club";
    return `${date} • ${times} • ${clubLabel} • ${local ? local.nom : "Local non sélectionné"}`;
  };

  const checkAvailability = async () => {
    setAvailabilityMessage(null);

    if (
      !form.locaux_id ||
      !form.date_event ||
      !form.start_time ||
      !form.end_time
    ) {
      setAvailabilityMessage({
        msg: "Remplissez la date, heure et le local pour vérifier.",
        type: "error",
      });
      return;
    }

    setCheckingAvailability(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const resp = await api.get("/events/availability/check", {
        headers,
        params: {
          id_local: form.locaux_id,
          date: form.date_event,
          start: form.start_time,
          end: form.end_time,
          excludeEventId: editingEvent?.id,
        },
      });

      if (resp.data?.available) {
        setAvailabilityMessage({
          msg: "Local disponible pour ce créneau.",
          type: "success",
        });
      } else {
        const conflicts = resp.data?.conflicts;
        const detail =
          Array.isArray(conflicts) && conflicts.length > 0
            ? `Conflits: ${conflicts.join(", ")}`
            : "";
        setAvailabilityMessage({
          msg: `Local indisponible sur ce créneau. ${detail}`.trim(),
          type: "error",
        });
      }
    } catch (err) {
      setAvailabilityMessage({
        msg: "Erreur lors de la vérification de disponibilité.",
        type: "error",
      });
      setIsAvailablePreview(false);
    } finally {
      setCheckingAvailability(false);
    }
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
              <TimePicker
                label="Heure début"
                value={form.start_time}
                minHour={
                  form.date_event === today
                    ? Math.min(21, Math.max(8, new Date().getHours() + 1))
                    : 8
                }
                maxHour={21}
                onChange={(v) => onChangeForm({ start_time: v })}
              />
              <TimePicker
                label="Heure fin"
                value={form.end_time}
                minHour={
                  form.start_time
                    ? parseInt(form.start_time.split(":")[0], 10)
                    : 8
                }
                onChange={(v) => onChangeForm({ end_time: v })}
              />

              {!isAdmin && principalClubs.length === 1 ? (
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                    Club principal
                  </label>
                  <div className="mt-1.5 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {principalClubs[0].nom}
                  </div>
                </div>
              ) : (
                <Select
                  label={isAdmin ? "Club principal (optionnel)" : "Club principal"}
                  value={form.club_id}
                  required={!isAdmin}
                  onChange={(v) =>
                    onChangeForm({
                      club_id: v,
                      club_ids: form.club_ids.filter((clubId) => clubId !== v),
                      locaux_id: "",
                    })
                  }
                  options={principalClubs.map((c) => ({ value: c.id, label: c.nom }))}
                />
              )}

              <div className="md:col-span-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                  Clubs collaborateurs
                </label>
                <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-3">
                  {clubs.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      Aucun club disponible.
                    </div>
                  ) : (
                    clubs.map((club) => {
                      const checked = form.club_ids.includes(club.id);
                      const disabled = club.id === form.club_id;
                      return (
                        <label
                          key={club.id}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium ${
                            checked
                              ? "border-[#436D75] bg-[#EAF2F4]"
                              : "border-gray-200 bg-white"
                          } ${disabled ? "opacity-50" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? Array.from(
                                    new Set([...form.club_ids, club.id]),
                                  )
                                : form.club_ids.filter((id) => id !== club.id);
                              onChangeForm({ club_ids: next });
                            }}
                          />
                          <span>{club.nom}</span>
                        </label>
                      );
                    })
                  )}
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  Laissez vide pour créer un événement indépendant.
                </p>
              </div>

              {isAdmin && (
                <Select
                  label="Région"
                  value={selectedGouvernorat}
                  onChange={onChangeGouvernorat}
                  options={gouvernorats.map((g) => ({ value: g, label: g }))}
                />
              )}

              {isAdmin && (
                <Select
                  label="Centre"
                  value={selectedCentreForAdmin}
                  onChange={onChangeCentreForAdmin}
                  options={centresByGouvernorat.map((centre) => ({
                    value: centre.id,
                    label: centre.nom,
                  }))}
                />
              )}

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

              <div className="md:col-span-2 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                      Prévisualisation
                    </label>
                    <div className="mt-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                      {previewText()}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <button
                      type="button"
                      onClick={checkAvailability}
                      disabled={checkingAvailability}
                      className="px-4 py-2 rounded-xl bg-[#436D75] text-white font-black text-sm disabled:opacity-60"
                    >
                      {checkingAvailability
                        ? "Vérification..."
                        : "Vérifier disponibilité"}
                    </button>
                  </div>
                </div>

                {availabilityMessage && (
                  <div
                    className={`px-3 py-2 rounded-xl border text-xs md:text-sm font-bold ${
                      availabilityMessage.type === "success"
                        ? "bg-[#D9E8D1] text-[#436D75] border-[#436D75]/20"
                        : "bg-[#FDE5E1] text-[#B23A2B] border-[#E98A7D]/40"
                    }`}
                  >
                    {availabilityMessage.msg}
                  </div>
                )}
              </div>

              {/* Recurrence removed — single occurrence events only */}

              <div className="md:col-span-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    onChangeForm({ description: e.target.value })
                  }
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
                        key={originalIndex}
                        className="rounded-xl border border-gray-200 bg-white p-3 shadow-[0_6px_20px_rgba(38,67,74,0.06)]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-black text-[#436D75] uppercase tracking-wider inline-flex items-center gap-2">
                            Étape {index + 1}
                            <span className="rounded-full bg-[#EAF2F4] px-2 py-0.5 text-[10px] text-[#2D4E56]">
                              {step.start_time || "--:--"} -{" "}
                              {step.end_time || "--:--"}
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

                          {(() => {
                              // event boundaries
                              const evEndH = form.end_time
                                ? parseInt(form.end_time.split(":")[0], 10)
                                : 22;
                              const evEndM = form.end_time
                                ? parseInt(form.end_time.split(":")[1], 10)
                                : 0;

                              // previous step's end time = lower bound for this step's start
                              const prevEnd =
                                index > 0
                                  ? (timelineView[index - 1].step.end_time || form.start_time || "")
                                  : (form.start_time || "");
                              const prevEndH = prevEnd
                                ? parseInt(prevEnd.split(":")[0], 10)
                                : 8;
                              const prevEndM = prevEnd
                                ? parseInt(prevEnd.split(":")[1], 10)
                                : 0;

                              // current step's start (for constraining end field)
                              const stepStartH = step.start_time
                                ? parseInt(step.start_time.split(":")[0], 10)
                                : prevEndH;
                              const stepStartM = step.start_time
                                ? parseInt(step.start_time.split(":")[1], 10)
                                : prevEndM;

                              // step start max hour: evEndH only if evEndM > 0
                              const stepStartMaxH =
                                evEndM > 0
                                  ? evEndH
                                  : Math.max(prevEndH, evEndH - 1);

                              const cls =
                                "rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#436D75]/40";

                              return (["start_time", "end_time"] as const).map(
                                (field) => {
                                  const fieldVal = step[field];
                                  const [hVal, mVal] = fieldVal
                                    ? fieldVal.split(":")
                                    : ["", ""];
                                  const hNum = hVal ? parseInt(hVal, 10) : null;

                                  // hour range
                                  const minH =
                                    field === "start_time"
                                      ? prevEndH
                                      : stepStartH;
                                  const maxH =
                                    field === "start_time"
                                      ? stepStartMaxH
                                      : evEndH;
                                  const hours = Array.from(
                                    { length: Math.max(0, maxH - minH + 1) },
                                    (_, i) => i + minH,
                                  );

                                  // minute constraints
                                  const minM =
                                    field === "start_time"
                                      ? hNum === prevEndH ? prevEndM : 0
                                      : hNum === stepStartH ? stepStartM : 0;
                                  const maxM =
                                    field === "end_time" && hNum === evEndH
                                      ? evEndM
                                      : 59;

                                  const emit = (h: string, m: string) => {
                                    updateTimelineStep(originalIndex, {
                                      [field]: h ? `${h}:${m || "00"}` : "",
                                    });
                                  };

                                  return (
                                    <div key={field}>
                                      <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                                        {field === "start_time"
                                          ? "Début"
                                          : "Fin"}
                                      </label>
                                      <div className="mt-1 flex gap-1.5">
                                        <select
                                          value={hVal}
                                          onChange={(e) =>
                                            emit(e.target.value, mVal)
                                          }
                                          className={`flex-1 ${cls}`}
                                        >
                                          <option value="">H</option>
                                          {hours.map((hr) => {
                                            const v = String(hr).padStart(
                                              2,
                                              "0",
                                            );
                                            return (
                                              <option key={v} value={v}>
                                                {v}h
                                              </option>
                                            );
                                          })}
                                        </select>
                                        <input
                                          type="number"
                                          min={minM}
                                          max={maxM}
                                          placeholder="min"
                                          value={
                                            mVal
                                              ? String(parseInt(mVal, 10))
                                              : ""
                                          }
                                          onChange={(e) => {
                                            const raw = e.target.value;
                                            const n = parseInt(raw, 10);
                                            if (
                                              raw === "" ||
                                              (!isNaN(n) &&
                                                n >= 0 &&
                                                n <= 59)
                                            ) {
                                              emit(
                                                hVal,
                                                raw === ""
                                                  ? "00"
                                                  : String(n).padStart(2, "0"),
                                              );
                                            }
                                          }}
                                          className={`flex-1 ${cls}`}
                                        />
                                      </div>
                                    </div>
                                  );
                                },
                              );
                            })()}

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
