import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star } from "lucide-react";
import api from "../../api/axios";

export default function ClubFeedbacksPage() {
  const { clubId } = useParams();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);

  useEffect(() => {
    if (!clubId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/presences/clubs/${clubId}/feedbacks`);
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
  }, [clubId]);

  return (
    <div>
      <h1 className="text-2xl font-black text-[#436D75] mb-4">
        Feedbacks des séances
      </h1>

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="space-y-6">
          <section className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="font-bold mb-2">Résumé par séance</h2>
            {summary.length === 0 ? (
              <div className="text-sm text-gray-500">
                Aucun feedback disponible
              </div>
            ) : (
              <div className="space-y-2">
                {summary.map((s) => {
                  const coachStars = Math.round(s.average_coach || 0);
                  const actStars = Math.round(s.average_activities || 0);
                  return (
                    <div
                      key={s.seanceId}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold">Séance {s.seanceId}</div>
                        <div className="text-sm text-gray-600">
                          {s.count} feedback(s)
                        </div>
                      </div>
                      <div className="text-right flex gap-4 items-center">
                        <div className="text-sm">
                          <div className="font-semibold">Coach</div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < coachStars
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }
                              />
                            ))}
                            <span className="ml-2 text-xs text-gray-600">
                              ({s.average_coach})
                            </span>
                          </div>
                        </div>
                        <div className="text-sm">
                          <div className="font-semibold">Activités</div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < actStars
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }
                              />
                            ))}
                            <span className="ml-2 text-xs text-gray-600">
                              ({s.average_activities})
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
            <h2 className="font-bold mb-2">Commentaires récents</h2>
            {feedbacks.length === 0 ? (
              <div className="text-sm text-gray-500">Aucun commentaire</div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((f) => (
                  <div
                    key={f.id}
                    className="border-l-4 border-[#436D75] pl-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                          {f.utilisateur?.photo_profil_url ? (
                            <img
                              src={f.utilisateur.photo_profil_url}
                              alt={`${f.utilisateur.nom}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              U
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold">
                            {f.utilisateur?.prenom} {f.utilisateur?.nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            Séance: {f.seance?.titre || f.id_seance} —{" "}
                            {f.seance?.date_seance
                              ? new Date(
                                  f.seance.date_seance,
                                ).toLocaleDateString()
                              : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(f.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center gap-4">
                        <div className="text-sm flex items-center gap-2">
                          <span className="font-semibold">Coach</span>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={
                                i < (f.note_coach || 0)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                        </div>
                        <div className="text-sm flex items-center gap-2">
                          <span className="font-semibold">Activités</span>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={
                                i < (f.note_activites || 0)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      {f.commentaire && (
                        <div className="mt-2 text-gray-700">
                          {f.commentaire}
                          <div className="mt-2 text-sm text-green-600 font-bold">
                            Merci pour votre retour !
                          </div>
                        </div>
                      )}
                    </div>
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
