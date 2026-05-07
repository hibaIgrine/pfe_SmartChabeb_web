import { useEffect, useState } from "react";
import { Check, X, Calendar, MapPin, User, Clock, Filter, Search, Eye } from "lucide-react";
import api from "../../api/axios";
import { AvailabilityMiniCalendar } from "./components/AvailabilityMiniCalendar";

type ReservationItem = {
  id: string;
  statut: string;
  objet: string;
  date_reservation: string;
  heure_debut: string;
  heure_fin: string;
  prix_total?: number;
  utilisateur: {
    nom: string;
    prenom: string;
    email: string;
  };
  local: {
    id: string;
    nom: string;
    centre?: {
      nom: string;
    };
  };
};

function statusClass(status: string): string {
  if (status === "VALIDEE") return "bg-emerald-100 text-emerald-700";
  if (status === "REFUSEE") return "bg-rose-100 text-rose-700";
  if (status === "ANNULEE") return "bg-slate-100 text-slate-600";
  return "bg-amber-100 text-amber-700";
}

export default function CentreManagerReservationsPage() {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [occupancyModal, setOccupancyModal] = useState<{
    isOpen: boolean;
    localId: string;
    localNom: string;
    date: string;
    isLoadingOccupancy: number;
    occupancy: Array<{
      heure_debut: string;
      heure_fin: string;
      objet: string;
    }>;
  }>({
    isOpen: false,
    localId: "",
    localNom: "",
    date: "",
    isLoadingOccupancy: 0,
    occupancy: [],
  });

  const loadReservations = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/reservations");
      // Filtrer pour n'afficher que les réservations de location par les adhérents (pas les créneaux)
      const memberReservations = (res.data || []).filter((reservation: any) => {
        // Vérifier si c'est une réservation par un adhérent (pas un créneau)
        return reservation.utilisateur && 
               reservation.utilisateur.role !== 'CRENEAU' && 
               reservation.statut !== 'CRENEAU';
      });
      setReservations(memberReservations);
    } catch {
      setFeedback({
        type: "error",
        message: "Impossible de charger les réservations.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptReservation = async (reservationId: string) => {
    try {
      await api.patch(`/reservations/${reservationId}/status`, { statut: "VALIDEE" });
      setFeedback({ type: "success", message: "Réservation acceptée avec succès." });
      await loadReservations();
    } catch {
      setFeedback({ type: "error", message: "Impossible d'accepter cette réservation." });
    }
  };

  const handleRejectReservation = async (reservationId: string) => {
    try {
      await api.patch(`/reservations/${reservationId}/status`, { statut: "REFUSEE" });
      setFeedback({ type: "success", message: "Réservation refusée avec succès." });
      await loadReservations();
    } catch {
      setFeedback({ type: "error", message: "Impossible de refuser cette réservation." });
    }
  };

  const handleViewOccupancy = (localId: string, localNom: string, date: string) => {
    setOccupancyModal({
      isOpen: true,
      localId,
      localNom,
      date,
      isLoadingOccupancy: 0,
      occupancy: [],
    });
  };

  const handleCloseOccupancyModal = () => {
    setOccupancyModal({
      isOpen: false,
      localId: "",
      localNom: "",
      date: "",
      isLoadingOccupancy: 0,
      occupancy: [],
    });
  };

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch = 
      reservation.utilisateur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.utilisateur.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.local.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.objet.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || reservation.statut === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    loadReservations();
  }, []);

  return (
    <div className="flex gap-6 h-full relative">
      {/* 🏛️ TABLEAU PRINCIPAL */}
      <div
        className={`transition-all duration-500 space-y-10 overflow-y-auto ${occupancyModal.isOpen ? "w-2/3" : "w-full"}`}
      >
        <div>
          <h1 className="text-4xl font-black text-[#436D75] tracking-tight">
            Gestion des Réservations
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Gérez les demandes de réservation des locaux de votre centre.
          </p>
        </div>

        {feedback && (
          <div
            className={`rounded-2xl px-5 py-4 text-sm font-bold ${
              feedback.type === "success"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-[30px] border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher par demandeur, local ou objet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#436D75]/20"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#436D75]/20"
              >
                <option value="all">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="VALIDEE">Validées</option>
                <option value="REFUSEE">Refusées</option>
                <option value="ANNULEE">Annulées</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tableau des réservations */}
        <div className="bg-white rounded-[30px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#436D75]">Liste des réservations</h2>
            <span className="text-xs text-gray-400 font-bold">
              {filteredReservations.length} réservation{filteredReservations.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/70">
                <tr className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
                  <th className="px-6 py-3 text-left">Demandeur</th>
                  <th className="px-6 py-3 text-left">Local</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Horaire</th>
                  <th className="px-6 py-3 text-left">Objet</th>
                  <th className="px-6 py-3 text-left">Montant</th>
                  <th className="px-6 py-3 text-left">Statut</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td className="px-6 py-5 text-sm text-gray-400" colSpan={8}>
                      Chargement...
                    </td>
                  </tr>
                ) : filteredReservations.length === 0 ? (
                  <tr>
                    <td className="px-6 py-5 text-sm text-gray-400" colSpan={8}>
                      {searchTerm || statusFilter !== "all" 
                        ? "Aucune réservation trouvée pour ces filtres." 
                        : "Aucune réservation pour le moment."}
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F7F3E9]/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#436D75]/10 rounded-full flex items-center justify-center">
                            <User size={16} className="text-[#436D75]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#436D75]">
                              {item.utilisateur.prenom} {item.utilisateur.nom}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.utilisateur.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-bold text-[#436D75]">
                              {item.local.nom}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.local.centre?.nom || "Centre non spécifié"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(item.date_reservation).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-gray-400" />
                          {new Date(item.heure_debut).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" - "}
                          {new Date(item.heure_fin).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="inline-flex items-center px-3 py-1 bg-gray-50 rounded-lg text-xs">
                          {item.objet}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[#436D75]">
                        {item.prix_total ? `${item.prix_total} TND` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase ${statusClass(item.statut)}`}
                        >
                          {item.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {item.statut === "EN_ATTENTE" && (
                            <>
                              <button
                                onClick={() => handleAcceptReservation(item.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-xs font-black text-green-600 hover:bg-green-100"
                                title="Accepter la réservation"
                              >
                                <Check size={14} /> Accepter
                              </button>
                              <button
                                onClick={() => handleRejectReservation(item.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100"
                                title="Refuser la réservation"
                              >
                                <X size={14} /> Refuser
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleViewOccupancy(item.local.id, item.local.nom, item.date_reservation)}
                            className="p-3 bg-[#F7F3E9]/20 text-[#436D75] rounded-2xl hover:bg-[#436D75] hover:text-white transition-all"
                            title="Vérifier planning"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 📅 DRAWER LATÉRAL (Calendrier d'aide à la décision) */}
      {occupancyModal.isOpen && (
        <div className="w-1/3 bg-white rounded-[40px] p-8 shadow-2xl border border-white animate-in slide-in-from-right duration-500 relative self-start">
          <button
            onClick={handleCloseOccupancyModal}
            className="absolute top-6 right-6 text-gray-300 hover:text-black"
          >
            <X size={20} />
          </button>
          <h3 className="text-xl font-black text-smart-teal mb-6">
            Aide à la validation
          </h3>
          <AvailabilityMiniCalendar
            occupiedSlots={occupancyModal.occupancy}
            localName={occupancyModal.localNom}
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
    </div>
  );
}
