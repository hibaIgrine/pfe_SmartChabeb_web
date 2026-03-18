import { useEffect, useState } from "react";
import api from "../../api/axios";
import { Check, X, Clock, Calendar, MapPin, User, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const token = localStorage.getItem("token");
  // 1. État pour stocker le message et le type (success ou error)
  const [notification, setNotification] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  // 2. La fonction showAlert qui sera appelée partout dans ton code
  const showAlert = (msg: string, type: "error" | "success") => {
    setNotification({ msg, type });

    // L'alerte disparaît toute seule après 4 secondes
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loadRes = async () => {
    const res = await api.get("/reservations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setReservations(res.data);
  };

  useEffect(() => {
    loadRes();
  }, []);

  // Dans ReservationsPage.tsx, modifie la fonction handleStatus

  const handleStatus = async (id: string, statut: string) => {
    try {
      await api.patch(
        `/reservations/${id}/status`,
        { statut },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Si tu as la fonction showAlert que nous avons créée ensemble :
      showAlert(
        `Réservation ${statut === "VALIDEE" ? "confirmée" : "refusée"}`,
        "success",
      );
      loadRes(); // Recharger le tableau
    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        // 💡 Message spécifique pour le conflit d'horaire
        showAlert(
          "Erreur : Ce créneau est déjà pris par une autre réservation validée.",
          "error",
        );
      } else {
        showAlert("Une erreur est survenue lors de la validation.", "error");
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <h1 className="text-6xl font-black text-smart-teal italic tracking-tighter">
        Planning National
      </h1>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <th className="p-8">Demandeur</th>
              <th className="p-8">Espace / Centre</th>
              <th className="p-8">Date & Heures</th>
              <th className="p-8 text-center">Statut</th>
              <th className="p-8 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {reservations.map((r: any) => (
              <tr key={r.id} className="hover:bg-smart-sage/5 transition-all">
                <td className="p-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-smart-bg rounded-full flex items-center justify-center text-smart-teal">
                      <User size={18} />
                    </div>
                    <span className="font-bold text-smart-teal">
                      {r.utilisateur.nom} {r.utilisateur.prenom}
                    </span>
                  </div>
                </td>
                <td className="p-8">
                  <p className="font-black text-sm text-smart-teal">
                    {r.local.nom}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">
                    {r.local.centre.nom}
                  </p>
                </td>
                <td className="p-8">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <Calendar size={14} />{" "}
                    {new Date(r.date_reservation).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-smart-salmon mt-1">
                    <Clock size={12} />{" "}
                    {new Date(r.heure_debut).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(r.heure_fin).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </td>
                <td className="p-8 text-center">
                  <StatusPill status={r.statut} />
                </td>
                <td className="p-8 text-right">
                  {r.statut === "EN_ATTENTE" && (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleStatus(r.id, "VALIDEE")}
                        className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => handleStatus(r.id, "REFUSEE")}
                        className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 🔔 COMPOSANT DE NOTIFICATION MICHELLE */}
      {notification && (
        <div
          className={`fixed top-10 right-10 z-[1000] flex items-center space-x-4 p-5 rounded-[30px] shadow-2xl animate-in slide-in-from-right-10 border border-white/20 backdrop-blur-md transition-all ${
            notification.type === "error"
              ? "bg-[#E98A7D] text-white" // 🍎 Salmon pour l'Erreur
              : "bg-[#D9E8D1] text-[#436d75]" // 🌿 Sage pour le Succès
          }`}
        >
          {/* Icône dynamique selon le type */}
          <div className="bg-white/20 p-2 rounded-full">
            {notification.type === "error" ? (
              <AlertCircle size={20} />
            ) : (
              <CheckCircle2 size={20} />
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
              Système SmartChabeb
            </p>
            <p className="font-black italic text-sm">{notification.msg}</p>
          </div>

          {/* Petit bouton pour fermer manuellement */}
          <button
            onClick={() => setNotification(null)}
            className="hover:rotate-90 transition-transform pl-2"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

const StatusPill = ({ status }: any) => {
  const colors: any = {
    VALIDEE: "bg-green-100 text-green-600",
    EN_ATTENTE: "bg-orange-100 text-orange-600",
    REFUSEE: "bg-red-100 text-red-600",
  };
  return (
    <span
      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${colors[status]}`}
    >
      {status}
    </span>
  );
};
