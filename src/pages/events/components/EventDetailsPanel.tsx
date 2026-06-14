/**
 * EventDetailsPanel.tsx — Panneau de détails d'un événement (utilisé dans modale et page).
 *
 * RÔLE :
 *   Affiche toutes les informations d'un EventDetail : infos générales,
 *   feedbacks et étoiles, self check-in.
 *
 * FONCTIONNALITÉS :
 *   - Feedback: note moyenne, saisie de la note personnelle, commentaires récents
 *   - Self check-in si l'événement est en cours et l'adhérent est confirmé
 */
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import type { EventDetail } from "../types";
import { formatDateOnly, toTimeHHMM } from "../utils";

type Props = {
  selectedDetail: EventDetail | null;
  onSelfCheckin: (eventId: string) => Promise<void>;
  onSubmitFeedback: (
    eventId: string,
    note: number,
    commentaire: string,
  ) => Promise<void>;
  isSubmittingFeedback: boolean;
};

export default function EventDetailsPanel({
  selectedDetail,
  onSelfCheckin,
  onSubmitFeedback,
  isSubmittingFeedback,
}: Props) {
  const [myNote, setMyNote] = useState(0);
  const [myCommentaire, setMyCommentaire] = useState("");
  const [isSelfCheckingIn, setIsSelfCheckingIn] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    setMyNote(selectedDetail?.myFeedback?.note ?? 0);
    setMyCommentaire(selectedDetail?.myFeedback?.commentaire ?? "");
  }, [
    selectedDetail?.id,
    selectedDetail?.myFeedback?.note,
    selectedDetail?.myFeedback?.commentaire,
  ]);

  const participants = selectedDetail?.participants ?? [];
  const feedbacks = selectedDetail?.recentFeedbacks ?? [];
  const timeline = Array.isArray(selectedDetail?.timeline)
    ? selectedDetail.timeline
    : [];
  const timelineSorted = [...timeline].sort((a, b) =>
    String(a.start_time ?? "").localeCompare(String(b.start_time ?? "")),
  );

  // Find my participation
  const myParticipation = participants.find((p) => p.user?.id === user.id);
  const isMyStatusConfirmed = myParticipation?.status === "CONFIRME";
  const isMyCheckInAlready = myParticipation?.checkin === true;

  // Check if event is in time range
  const now = new Date();
  const eventStart = selectedDetail?.start_time
    ? new Date(selectedDetail.start_time)
    : null;
  const eventEnd = selectedDetail?.end_time
    ? new Date(selectedDetail.end_time)
    : null;
  const isEventOngoing =
    eventStart && eventEnd && now >= eventStart && now <= eventEnd;

  const canDoSelfCheckin =
    isMyStatusConfirmed && !isMyCheckInAlready && isEventOngoing;

  const renderStars = (value: number, size = 16) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          const active = starValue <= Math.round(value);
          return (
            <Star
              key={starValue}
              size={size}
              className={
                active ? "text-amber-500 fill-amber-500" : "text-gray-300"
              }
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[30px] border border-gray-100 shadow-sm p-5">
      <h3 className="text-xl font-black italic text-smart-teal mb-4">
        Détails Événement
      </h3>

      {!selectedDetail ? (
        <p className="text-sm text-gray-400">
          Sélectionnez un événement pour voir le détail.
        </p>
      ) : (
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
              Nom
            </p>
            <p className="font-bold text-smart-teal">{selectedDetail.nom}</p>
          </div>
          <div>
            <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
              Description
            </p>
            <p className="text-gray-700">
              {selectedDetail.description || "Aucune description"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
                Date
              </p>
              <p className="font-bold">
                {formatDateOnly(selectedDetail.date_event)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
                Heure
              </p>
              <p className="font-bold">
                {toTimeHHMM(selectedDetail.start_time)} -{" "}
                {toTimeHHMM(selectedDetail.end_time)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
              Club / Local
            </p>
            <p className="font-semibold text-gray-700">
              {selectedDetail.club?.nom ?? "-"} •{" "}
              {selectedDetail.local?.nom ?? "-"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
              Capacité
            </p>
            <p className="font-semibold text-gray-700">
              {selectedDetail.capacity ?? "Non définie"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider">
              Participants
            </p>
            <p className="font-semibold text-gray-700">
              {selectedDetail.participants?.length ?? 0}
            </p>
          </div>

          {timeline.length > 0 && (
            <div>
              <p className="text-gray-400 text-[11px] uppercase font-black tracking-wider mb-2">
                Timeline
              </p>
              <div className="rounded-2xl border border-[#D6E5E8] bg-[#F8FCFD] p-3 md:p-4 space-y-3">
                {timelineSorted.map((step, index) => {
                  const stepStart = String(step.start_time ?? "");
                  const stepEnd = String(step.end_time ?? "");
                  const [sh, sm] = stepStart.split(":").map(Number);
                  const [eh, em] = stepEnd.split(":").map(Number);
                  const durationMinutes =
                    Number.isFinite(sh) &&
                    Number.isFinite(sm) &&
                    Number.isFinite(eh) &&
                    Number.isFinite(em)
                      ? Math.max(0, eh * 60 + em - (sh * 60 + sm))
                      : 0;

                  return (
                    <div
                      key={`${index}-${step.start_time}-${step.end_time}-${step.title}`}
                      className="relative pl-7"
                    >
                      <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-[#436D75]" />
                      {index < timelineSorted.length - 1 ? (
                        <span className="absolute left-[14px] top-5 h-[calc(100%-8px)] w-[2px] bg-[#C7DCE1]" />
                      ) : null}

                      <div className="rounded-xl border border-[#E0ECEF] bg-white px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-[#203A43] text-xs">
                            {step.title}
                          </p>
                          <span className="text-[11px] font-black text-[#436D75]">
                            {stepStart} - {stepEnd}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#6B8790]">
                          Duree: {durationMinutes} min
                        </p>
                        {step.details ? (
                          <p className="text-[11px] text-gray-600 mt-1">
                            {step.details}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100 space-y-3">
            <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">
              Feedback & notation
            </p>

            {canDoSelfCheckin && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                <button
                  onClick={async () => {
                    setIsSelfCheckingIn(true);
                    try {
                      await onSelfCheckin(selectedDetail!.id);
                    } finally {
                      setIsSelfCheckingIn(false);
                    }
                  }}
                  disabled={isSelfCheckingIn}
                  className="w-full px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-black disabled:opacity-60 hover:bg-green-700 transition"
                >
                  {isSelfCheckingIn ? "Enregistrement..." : "✓ Je suis présent"}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl bg-[#F7FAFC] border border-gray-100 p-3">
              <div>
                <p className="text-xs text-gray-500 font-bold">
                  Moyenne des notes
                </p>
                <div className="mt-1">
                  {renderStars(selectedDetail.ratingAverage ?? 0, 18)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-[#203A43]">
                  {(selectedDetail.ratingAverage ?? 0).toFixed(1)}
                </p>
                <p className="text-[11px] font-semibold text-gray-500">
                  {selectedDetail.ratingCount ?? 0} avis
                </p>
              </div>
            </div>

            {selectedDetail.canRate && (
              <div className="rounded-xl border border-gray-100 p-3 bg-white/70 space-y-3">
                <p className="text-xs font-black text-[#203A43] uppercase tracking-wider">
                  Votre note
                </p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const starValue = index + 1;
                    const active = starValue <= myNote;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setMyNote(starValue)}
                        className="p-0.5"
                        aria-label={`Noter ${starValue} sur 5`}
                      >
                        <Star
                          size={20}
                          className={
                            active
                              ? "text-amber-500 fill-amber-500"
                              : "text-gray-300"
                          }
                        />
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={myCommentaire}
                  onChange={(event) => setMyCommentaire(event.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Ajoutez un commentaire (optionnel)"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#436D75]/20"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={isSubmittingFeedback || myNote < 1}
                    onClick={() =>
                      selectedDetail &&
                      onSubmitFeedback(selectedDetail.id, myNote, myCommentaire)
                    }
                    className="px-3 py-2 rounded-lg bg-[#436D75] text-white text-xs font-black disabled:opacity-60 hover:bg-[#33545B] transition"
                  >
                    {isSubmittingFeedback ? "Envoi..." : "Envoyer mon feedback"}
                  </button>
                </div>
              </div>
            )}

            {feedbacks.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                  Derniers commentaires
                </p>
                {feedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="rounded-xl border border-gray-100 p-3 bg-white"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-gray-700">
                        {feedback.user
                          ? `${feedback.user.nom} ${feedback.user.prenom}`
                          : "Membre"}
                      </p>
                      {renderStars(feedback.note, 14)}
                    </div>
                    {feedback.commentaire ? (
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                        {feedback.commentaire}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2 italic">
                        Aucun commentaire.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
