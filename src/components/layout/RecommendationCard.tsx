import { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { chooseActivity } from "../../api/recommendations";

interface Reco {
  activite: string;
  probabilite: number;
}
interface Props {
  recoId: number;
  recommendations: Reco[];
  onChosen?: () => void;
}

export function RecommendationCard({
  recoId,
  recommendations,
  onChosen,
}: Props) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChoose = async (activite: string) => {
    try {
      setLoading(true);
      setError(null);
      await chooseActivity(recoId, activite);
      setChosen(activite);
      onChosen?.();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Erreur lors du choix de l'activité",
      );
      console.error("Erreur lors du choix de l'activite", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Erreur</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {recommendations.map((reco, idx) => (
        <div
          key={idx}
          className={`p-4 border rounded-lg transition-all ${
            chosen && chosen !== reco.activite
              ? "opacity-50 border-gray-200"
              : chosen === reco.activite
                ? "border-green-300 bg-green-50"
                : "border-gray-300 hover:border-[#E98A7D]"
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                {idx + 1}. {reco.activite}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Probabilité:{" "}
                <span className="font-semibold text-[#E98A7D]">
                  {Math.round(reco.probabilite * 100)}%
                </span>
              </p>
            </div>
            {chosen === reco.activite && (
              <CheckCircle2
                className="text-green-600 flex-shrink-0 mt-1"
                size={24}
              />
            )}
          </div>

          {/* Barre de progression */}
          <div className="mb-4 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#E98A7D] to-[#FF6B4A] rounded-full transition-all"
              style={{
                width: `${Math.round(reco.probabilite * 100)}%`,
              }}
            />
          </div>

          {/* Bouton Choisir */}
          {!chosen && (
            <button
              onClick={() => handleChoose(reco.activite)}
              disabled={loading}
              className="w-full bg-[#436D75] text-white px-4 py-2 rounded font-semibold hover:bg-[#2d4450] disabled:opacity-50 transition"
            >
              {loading ? "Enregistrement..." : "Choisir cette activité"}
            </button>
          )}

          {chosen === reco.activite && (
            <div className="text-center">
              <span className="inline-flex items-center gap-2 text-green-600 font-semibold">
                <CheckCircle2 size={16} />
                Activité sélectionnée
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
