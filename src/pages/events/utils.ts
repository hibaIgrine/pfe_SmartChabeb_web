import type { EventForm } from "./types";

export const MAX_EVENT_CAPACITY = 1000000;

export function toTimeHHMM(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function getCurrentTimeHHMM() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function formatDateOnly(value: string) {
  const raw = (value || "").toString();
  if (!raw) return "-";

  const datePart = raw.includes("T") ? raw.split("T")[0] : raw;
  return datePart;
}

export function getEmptyForm(): EventForm {
  return {
    nom: "",
    description: "",
    date_event: getTodayDate(),
    start_time: "10:00",
    end_time: "12:00",
    club_id: "",
    club_ids: [],
    locaux_id: "",
    capacity: "",
    timeline: [],
  };
}

function timeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function validateEventForm(form: EventForm, today: string) {
  if (
    !form.nom.trim() ||
    !form.description.trim() ||
    !form.date_event ||
    !form.start_time ||
    !form.end_time ||
    !form.locaux_id ||
    !form.capacity.trim()
  ) {
    return "Tous les champs du formulaire sont obligatoires.";
  }

  if (!/^\d+$/.test(form.capacity.trim())) {
    return "La capacité doit contenir uniquement des nombres entiers.";
  }

  const capacityValue = BigInt(form.capacity.trim());
  if (capacityValue < 1n) {
    return "La capacité doit être supérieure à 0.";
  }

  if (capacityValue > BigInt(MAX_EVENT_CAPACITY)) {
    return `La capacité ne doit pas dépasser ${MAX_EVENT_CAPACITY.toLocaleString("fr-FR")}.`;
  }

  if (form.date_event < today) {
    return "La date de l'événement doit être à partir d'aujourd'hui.";
  }

  if (form.start_time < "08:00") {
    return "L'heure de début ne peut pas être avant 08h00.";
  }

  if (form.end_time > "22:00") {
    return "L'heure de fin ne peut pas dépasser 22h00.";
  }

  if (form.end_time <= form.start_time) {
    return "L'heure de fin doit être strictement supérieure à l'heure de début.";
  }

  if (form.date_event === today) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = form.start_time.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    if (startMinutes <= currentMinutes) {
      return "L'heure de début doit être après l'heure actuelle du système.";
    }
  }

  // recurrence removed — single occurrence events only

  if (form.timeline.length > 0) {
    const eventStartMinutes = timeToMinutes(form.start_time);
    const eventEndMinutes = timeToMinutes(form.end_time);

    for (let i = 0; i < form.timeline.length; i++) {
      const step = form.timeline[i];
      if (!step.title.trim() || !step.start_time || !step.end_time) {
        return `Étape ${i + 1}: titre, heure début et heure fin sont obligatoires.`;
      }

      if (step.end_time <= step.start_time) {
        return `Étape ${i + 1}: l'heure de fin doit être supérieure à l'heure de début.`;
      }

      const stepStart = timeToMinutes(step.start_time);
      const stepEnd = timeToMinutes(step.end_time);

      if (stepStart < eventStartMinutes || stepEnd > eventEndMinutes) {
        return `Étape ${i + 1}: doit être entre ${form.start_time} et ${form.end_time}.`;
      }
    }

    const sorted = [...form.timeline].sort((a, b) =>
      a.start_time.localeCompare(b.start_time),
    );

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start_time < sorted[i - 1].end_time) {
        return "Timeline invalide: certaines étapes se chevauchent.";
      }
    }
  }

  return null;
}
