/**
 * MyClubLandingPage.tsx — Page d'atterrissage du RESPONSABLE_CLUB.
 *
 * RÔLE :
 *   Redirige automatiquement le RESPONSABLE_CLUB vers le détail de son premier club.
 *   Accessible via /mon-club (ROUTES.club.myClubLanding).
 *
 * LOGIQUE :
 *   GET /presences/my-clubs → liste des clubs gérés par l'utilisateur courant
 *   Si clubs.length > 0 → navigate('/my-clubs/:firstClubId')
 *   Si vide → affiche un message "Aucun club géré"
 *   Si erreur → affiche AlertCircle avec message d'erreur
 *
 * NOTE :
 *   Cette page ne s'affiche jamais visuellement (redirecton immédiate).
 *   Le Loader2 est visible ~200ms max.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import api from "../../api/axios";

export default function MyClubLandingPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    const go = async () => {
      try {
        const res = await api.get("/presences/my-clubs");
        const clubs = Array.isArray(res.data) ? res.data : [];
        if (clubs.length > 0) {
          navigate(`/my-clubs/${clubs[0].id}`, { replace: true });
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };
    void go();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-[26rem] flex-col items-center justify-center gap-4 rounded-[32px] border border-amber-100 bg-amber-50 p-10 text-center text-amber-700">
        <AlertCircle size={38} />
        <p className="text-lg font-black">Aucun club assigné</p>
        <p className="text-sm font-semibold opacity-75">
          Vous n'avez pas encore de club à gérer. Contactez l'administrateur.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[26rem] items-center justify-center">
      <Loader2 className="animate-spin text-[#436D75]" size={44} />
    </div>
  );
}
