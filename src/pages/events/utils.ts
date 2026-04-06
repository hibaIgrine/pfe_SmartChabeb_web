import type { EventForm } from "./types";

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

export function getEmptyForm(): EventForm {
  return {
    nom: "",
    description: "",
    date_event: getTodayDate(),
    start_time: "10:00",
    end_time: "12:00",
    club_id: "",
    locaux_id: "",
    capacity: "",
    recurrence_type: "NONE",
    recurrence_count: "",
    recurrence_until: "",
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
    !form.club_id ||
    !form.locaux_id ||
    !form.capacity.trim()
  ) {
    return "Tous les champs du formulaire sont obligatoires.";
  }

  if (!/^\d+$/.test(form.capacity.trim())) {
    return "La capacité doit contenir uniquement des nombres entiers.";
  }

  if (form.date_event < today) {
    return "La date de l'événement doit être à partir d'aujourd'hui.";
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

  if (form.recurrence_type !== "NONE") {
    if (form.recurrence_count && !/^\d+$/.test(form.recurrence_count)) {
      return "Le nombre d'occurrences doit être un entier positif.";
    }

    if (form.recurrence_count && Number(form.recurrence_count) < 1) {
      return "Le nombre d'occurrences doit être supérieur à 0.";
    }

    if (form.recurrence_until && form.recurrence_until < form.date_event) {
      return "La date de fin de récurrence doit être >= à la date de l'événement.";
    }
  }

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
