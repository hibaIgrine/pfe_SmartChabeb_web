import { useState, useEffect } from "react";
import { X } from "lucide-react";
import api from "../../../api/axios";

type OccupancySlot = {
  heure_debut: string;
  heure_fin: string;
  objet: string;
};

type RoomOccupancyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  localId: string;
  localNom: string;
  date: string;
};

export default function RoomOccupancyModal({
  isOpen,
  onClose,
  localId,
  localNom,
  date,
}: RoomOccupancyModalProps) {
  const [occupancy, setOccupancy] = useState<OccupancySlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadOccupancy = async () => {
    if (!localId || !date) return;
    
    try {
      setIsLoading(true);
      const res = await api.get(`/reservations/occupied?id_local=${localId}&date=${date}`);
      setOccupancy(res.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement de l'occupation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOccupancy();
    }
  }, [isOpen, localId, date]);

  if (!isOpen) return null;

  return (
    <div className="w-1/3 bg-white rounded-[40px] p-8 shadow-2xl border border-white animate-in slide-in-from-right duration-500 relative self-start">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-gray-300 hover:text-black"
      >
        <X size={20} />
      </button>
      <h3 className="text-xl font-black text-smart-teal mb-6">
        Aide à la validation
      </h3>
      
      <div className="bg-smart-bg p-6 rounded-[30px] border border-smart-sage/30 animate-in fade-in duration-500">
        <h4 className="text-[10px] font-black text-smart-teal uppercase mb-4 tracking-widest text-center">
          Occupation du jour :{" "}
          <span className="text-smart-salmon">{localNom}</span>
        </h4>
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="text-gray-400 text-xs">Chargement...</div>
            </div>
          ) : occupancy.length === 0 ? (
            <p className="text-center text-xs text-gray-400 italic py-4">
              Libre toute la journée
            </p>
          ) : (
            occupancy.map((slot, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-white rounded-xl border-l-4 border-smart-salmon shadow-sm"
              >
                <span className="text-xs font-black text-smart-teal">
                  {new Date(`2000-01-01T${slot.heure_debut}`).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <div className="h-px flex-1 bg-gray-100 mx-3"></div>
                <span className="text-xs font-black text-smart-teal">
                  {new Date(`2000-01-01T${slot.heure_fin}`).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      
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
  );
}
