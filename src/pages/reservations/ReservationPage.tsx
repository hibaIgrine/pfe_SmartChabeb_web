import { useEffect, useState } from "react";
import api from "../../api/axios";
import { Check, X, Clock, Calendar, Eye } from "lucide-react";

// 💡 TON COMPOSANT D'OCCUPATION
const AvailabilityMiniCalendar = ({ occupiedSlots, localName }: any) => {
  return (
    <div className="bg-smart-bg p-6 rounded-[30px] border border-smart-sage/30 animate-in fade-in duration-500">
      <h4 className="text-[10px] font-black text-smart-teal uppercase mb-4 tracking-widest text-center">
        Occupation du jour :{" "}
        <span className="text-smart-salmon">{localName}</span>
      </h4>
      <div className="space-y-2">
        {occupiedSlots.length === 0 ? (
          <p className="text-center text-xs text-gray-400 italic py-4">
            Libre toute la journée
          </p>
        ) : (
          occupiedSlots.map((slot: any, i: number) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-white rounded-xl border-l-4 border-smart-salmon shadow-sm"
            >
              <span className="text-xs font-black text-smart-teal">
                {new Date(slot.heure_debut).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <div className="h-px flex-1 bg-gray-100 mx-3"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                {slot.objet}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [showScheduleFor, setShowScheduleFor] = useState<any>(null); // 💡 Pour le Drawer
  const [notification, setNotification] = useState<any>(null);
  const token = localStorage.getItem("token");

  const showAlert = (msg: string, type: "error" | "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadRes = async () => {
    const res = await api.get("/reservations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setReservations(res.data);
  };

  // 💡 CHARGER LES OCCUPATIONS POUR UNE SALLE ET UNE DATE PRÉCISE
  const checkOccupancy = async (
    localId: string,
    date: string,
    localName: string,
  ) => {
    try {
      const res = await api.get(
        `/reservations/occupied?id_local=${localId}&date=${date}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setOccupiedSlots(res.data);
      setShowScheduleFor({ localName, date });
    } catch (err) {
      showAlert("Erreur de chargement du planning", "error");
    }
  };

  useEffect(() => {
    loadRes();
  }, []);

  const handleStatus = async (id: string, statut: string) => {
    try {
      await api.patch(
        `/reservations/${id}/status`,
        { statut },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showAlert(
        `Réservation ${statut === "VALIDEE" ? "confirmée" : "refusée"}`,
        "success",
      );
      loadRes();
    } catch (err: any) {
      const msg =
        err.response?.status === 409
          ? "Erreur : Conflit d'horaire avec une résa déjà validée."
          : "Erreur de validation.";
      showAlert(msg, "error");
    }
  };

  return (
    <div className="flex gap-6 h-full relative overflow-hidden">
      {/* 🏛️ TABLEAU PRINCIPAL (Occupant plus de place) */}
      <div
        className={`transition-all duration-500 space-y-10 ${showScheduleFor ? "w-2/3" : "w-full"}`}
      >
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
                <th className="p-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reservations.map((r: any) => (
                <tr
                  key={r.id}
                  className="hover:bg-smart-sage/5 transition-all group"
                >
                  <td className="p-8">
                    <span className="font-bold text-smart-teal">
                      {r.utilisateur.nom} {r.utilisateur.prenom}
                    </span>
                  </td>
                  <td className="p-8">
                    <p className="font-black text-sm text-smart-teal">
                      {r.local.nom}
                    </p>
                    <p className="text-[9px] font-bold text-gray-400">
                      {r.local.centre.nom}
                    </p>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <Calendar size={12} />{" "}
                      {new Date(r.date_reservation).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-smart-salmon mt-1">
                      <Clock size={12} />
                      {new Date(r.heure_debut).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -
                      {new Date(r.heure_fin).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex justify-end gap-2">
                      {/* 💡 BOUTON POUR VOIR L'OCCUPATION DU JOUR */}
                      <button
                        onClick={() =>
                          checkOccupancy(
                            r.id_local,
                            r.date_reservation.split("T")[0],
                            r.local.nom,
                          )
                        }
                        className="p-3 bg-smart-sage/20 text-smart-teal rounded-2xl hover:bg-smart-teal hover:text-white transition-all"
                        title="Vérifier planning"
                      >
                        <Eye size={18} />
                      </button>

                      {r.statut === "EN_ATTENTE" && (
                        <>
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
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📅 DRAWER LATÉRAL (Calendrier d'aide à la décision) */}
      {showScheduleFor && (
        <div className="w-1/3 bg-white rounded-[40px] p-8 shadow-2xl border border-white animate-in slide-in-from-right duration-500 relative self-start">
          <button
            onClick={() => setShowScheduleFor(null)}
            className="absolute top-6 right-6 text-gray-300 hover:text-black"
          >
            <X size={20} />
          </button>
          <h3 className="text-xl font-black text-smart-teal mb-6">
            Aide à la validation
          </h3>
          <AvailabilityMiniCalendar
            occupiedSlots={occupiedSlots}
            localName={showScheduleFor.localName}
          />
          <div className="mt-8 p-4 bg-smart-salmon/10 rounded-2xl">
            <p className="text-[10px] font-bold text-smart-salmon">
              💡 CONSEIL
            </p>
            <p className="text-xs text-gray-600 italic">
              Vérifiez s'il y a un espace vide d'au moins 30 min entre deux
              réservations pour le nettoyage.
            </p>
          </div>
        </div>
      )}

      {/* 🔔 TOAST NOTIFICATION MICHELLE */}
      {notification && (
        <div
          className={`fixed top-10 right-10 z-[1000] p-5 rounded-[30px] shadow-2xl animate-in slide-in-from-right border border-white/20 backdrop-blur-md ${notification.type === "error" ? "bg-[#E98A7D] text-white" : "bg-[#D9E8D1] text-[#436d75]"}`}
        >
          <p className="font-black italic text-sm">{notification.msg}</p>
        </div>
      )}
    </div>
  );
}
