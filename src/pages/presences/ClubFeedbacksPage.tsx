/**
 * ClubFeedbacksPage.tsx — Feedbacks des séances reçus par le responsable de club.
 *
 * RÔLE :
 *   Vue des évaluations soumises par les adhérents après chaque séance.
 *   Accessible via /my-clubs/:clubId/feedbacks.
 *
 * CONTENU :
 *   - Sélection de la séance (liste des séances passées)
 *   - Feedbacks reçus : note 1-5 étoiles + commentaire + auteur
 *   - Note moyenne calculée + distribution des notes (histogramme)
 *   - Filtre par séance + par note
 *
 * ACCÈS : ADMIN + RESPONSABLE_CLUB (ADMIN_OR_CLUB dans App.tsx)
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, Filter } from "lucide-react";
import api from "../../api/axios";

interface Seance {
  id: string;
  titre?: string;
  date_seance: string;
}

export default function ClubFeedbacksPage() {
  const { clubId } = useParams();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [selectedSeanceId, setSelectedSeanceId] = useState<string>("");

  useEffect(() => {
    if (!clubId) return;
    api
      .get(`/presences/clubs/${clubId}/seances`)
      .then((res) => setSeances(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSeances([]));
  }, [clubId]);

  useEffect(() => {
    if (!clubId) return;
    const load = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (selectedSeanceId) params.seanceId = selectedSeanceId;
        const res = await api.get(`/presences/clubs/${clubId}/feedbacks`, {
          params,
        });
        setFeedbacks(
          Array.isArray(res.data.feedbacks) ? res.data.feedbacks : [],
        );
        setSummary(Array.isArray(res.data.summary) ? res.data.summary : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [clubId, selectedSeanceId]);

  const getSeanceLabel = (seanceId: string) => {
    const s = seances.find((x) => x.id === seanceId);
    if (!s) return `Séance ${seanceId.slice(0, 8)}...`;
    const date = new Date(s.date_seance).toLocaleDateString("fr-TN");
    return s.titre ? `${s.titre} — ${date}` : `Séance du ${date}`;
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-[#436D75] mb-4">
        Feedbacks des séances
      </h1>

      <div className="flex items-center gap-2 mb-6">
        <Filter size={16} className="text-[#436D75]" />
        <label className="text-sm font-semibold text-gray-700">
          Filtrer par séance :
        </label>
        <select
          value={selectedSeanceId}
          onChange={(e) => setSelectedSeanceId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#436D75] bg-white"
        >
          <option value="">Toutes les séances</option>
          {seances.map((s) => (
            <option key={s.id} value={s.id}>
              {s.titre
                ? `${s.titre} — ${new Date(s.date_seance).toLocaleDateString("fr-TN")}`
                : `Séance du ${new Date(s.date_seance).toLocaleDateString("fr-TN")}`}
            </option>
          ))}
        </select>
        {selectedSeanceId && (
          <button
            onClick={() => setSelectedSeanceId("")}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="space-y-6">
          <section className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="font-bold mb-3">Résumé par séance</h2>
            {summary.length === 0 ? (
              <div className="text-sm text-gray-500">
                Aucun feedback{selectedSeanceId ? " pour cette séance" : ""}
              </div>
            ) : (
              <div className="space-y-3">
                {summary.map((s) => {
                  const coachStars = Math.round(s.average_coach || 0);
                  const actStars = Math.round(s.average_activities || 0);
                  return (
                    <div
                      key={s.seanceId}
                      onClick={() => setSelectedSeanceId(s.seanceId)}
                      className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSeanceId === s.seanceId
                          ? "border-[#436D75] bg-[#436D75]/5"
                          : "border-gray-100 hover:border-[#436D75]/40 hover:bg-gray-50"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm">
                          {getSeanceLabel(s.seanceId)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {s.count} feedback(s)
                        </div>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="text-sm text-right">
                          <div className="font-semibold text-xs text-gray-500 mb-0.5">
                            Coach
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={13}
                                className={
                                  i < coachStars
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-200 fill-gray-200"
                                }
                              />
                            ))}
                            <span className="ml-1 text-xs text-gray-500">
                              {Number(s.average_coach).toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-right">
                          <div className="font-semibold text-xs text-gray-500 mb-0.5">
                            Activités
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={13}
                                className={
                                  i < actStars
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-200 fill-gray-200"
                                }
                              />
                            ))}
                            <span className="ml-1 text-xs text-gray-500">
                              {Number(s.average_activities).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="font-bold mb-3">
              Commentaires
              {selectedSeanceId && (
                <span className="ml-2 text-sm font-normal text-[#436D75]">
                  — {getSeanceLabel(selectedSeanceId)}
                </span>
              )}
            </h2>
            {feedbacks.length === 0 ? (
              <div className="text-sm text-gray-500">
                Aucun commentaire{selectedSeanceId ? " pour cette séance" : ""}
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((f) => (
                  <div
                    key={f.id}
                    className="border-l-4 border-[#436D75] pl-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                          {f.utilisateur?.photo_profil_url ? (
                            <img
                              src={f.utilisateur.photo_profil_url}
                              alt={f.utilisateur.nom}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                              {f.utilisateur?.prenom?.[0] ?? "U"}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm">
                            {f.utilisateur?.prenom} {f.utilisateur?.nom}
                          </div>
                          <div className="text-xs text-gray-500">
                            {f.seance?.titre
                              ? f.seance.titre
                              : "Séance"}{" "}
                            —{" "}
                            {f.seance?.date_seance
                              ? new Date(
                                  f.seance.date_seance,
                                ).toLocaleDateString("fr-TN")
                              : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(f.created_at).toLocaleString("fr-TN")}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="text-sm flex items-center gap-1">
                        <span className="text-xs font-semibold text-gray-500">
                          Coach
                        </span>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={
                              i < (f.note_coach || 0)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-200 fill-gray-200"
                            }
                          />
                        ))}
                      </div>
                      <div className="text-sm flex items-center gap-1">
                        <span className="text-xs font-semibold text-gray-500">
                          Activités
                        </span>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={
                              i < (f.note_activites || 0)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-200 fill-gray-200"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    {f.commentaire && (
                      <div className="mt-2 text-sm text-gray-700">
                        {f.commentaire}
                        <div className="mt-1 text-xs text-green-600 font-semibold">
                          Merci pour votre retour !
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
