import { useEffect, useState, useMemo } from "react";
import api from "../../../api/axios";
import {
  Loader2,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

// Importation des composants découpés
import { CentreCard } from "./components/CentreCard";

import { CentreFilters } from "./components/CentreFilters";
import { AddCentreModal } from "./components/AddCentreModal";
import { EditCentreModal } from "./components/EditCentreModal";
import { CentreQuickView } from "./components/CentreQuickView";
import { DeleteCentreModal } from "./components/DeleteCentreModal"; // 💡 Nouveau
import { CentreStats } from "./components/CentresStats";

const GOUVERNORATS_AR = [
  "أريانة",
  "باجة",
  "بن عروس",
  "بنزرت",
  "تطاوين",
  "توزر",
  "تونس",
  "جندوبة",
  "زغوان",
  "سليانة",
  "سوسة",
  "سيدي بوزيد",
  "قبلي",
  "صفاقس",
  "قابس",
  "القصرين",
  "قفصة",
  "القيروان",
  "الكاف",
  "مدنين",
  "المنستير",
  "منوبة",
  "المهدية",
  "نابل",
];

export default function CentresPage() {
  // --- ÉTATS ---
  const [centres, setCentres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGouv, setSelectedGouv] = useState("");

  // États pour les fenêtres
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCentre, setEditingCentre] = useState<any>(null);
  const [viewingCentre, setViewingCentre] = useState<any>(null);
  const [centreToDelete, setCentreToDelete] = useState<any>(null); // 💡 Pour la suppression

  // État pour les notifications Michelle
  const [notification, setNotification] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  // --- LOGIQUE API ---
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/centres", { headers });
      setCentres(res.data);
    } catch (err) {
      showToast("Erreur de synchronisation", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string, type: "error" | "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 💡 EXECUTION DE LA SUPPRESSION SANS ALERT
  const confirmDelete = async () => {
    if (!centreToDelete) return;
    try {
      await api.delete(`/centres/${centreToDelete.id}`, { headers });
      showToast("Institution retirée du réseau", "success");
      setCentreToDelete(null);
      loadData();
    } catch (err) {
      showToast("Action refusée : centre occupé", "error");
      setCentreToDelete(null);
    }
  };

  // --- FILTRAGE ---
  const filteredCentres = useMemo(() => {
    return centres.filter((c: any) => {
      const q = search.toLowerCase();
      const matchesSearch =
        c.nom.toLowerCase().includes(q) ||
        c.delegation?.toLowerCase().includes(q);
      const matchesGouv = !selectedGouv || c.gouvernorat === selectedGouv;
      return matchesSearch && matchesGouv;
    });
  }, [centres, search, selectedGouv]);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 max-w-7xl mx-auto pb-20 relative">
      {/* 🔔 TOAST NOTIFICATION (Michelle Style) */}
      {notification && (
        <div
          className={`fixed top-10 right-10 z-[2000] flex items-center space-x-4 p-5 rounded-[30px] shadow-2xl animate-in slide-in-from-right-10 border border-white/20 backdrop-blur-md ${notification.type === "error" ? "bg-[#E98A7D] text-white" : "bg-[#D9E8D1] text-[#436d75]"}`}
        >
          {notification.type === "error" ? (
            <AlertCircle size={20} />
          ) : (
            <CheckCircle2 size={20} />
          )}
          <div className="font-black italic text-sm uppercase tracking-widest">
            {notification.msg}
          </div>
        </div>
      )}

      {/* 1. HEADER & ACTION */}
      {/* 1. HEADER INSTITUTIONNEL (Police et Taille minimisées) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4 pb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-smart-teal w-1.5 h-6 rounded-full"></div>
            <h1 className="text-3xl font-bold text-smart-teal tracking-tight italic">
              Réseau des Établissements
            </h1>
          </div>
          <p className="text-gray-400 font-semibold uppercase text-[9px] tracking-[0.3em] ml-4">
            Ministère de la Jeunesse et des Sports • Administration Centrale
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Synchroniser"
            className="p-3.5 bg-white text-smart-teal rounded-2xl shadow-sm border border-gray-100 hover:bg-smart-bg transition-all active:scale-90"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-smart-teal text-white px-8 py-3.5 rounded-2xl font-bold text-xs shadow-lg hover:bg-black transition-all flex items-center gap-2 active:scale-95 shadow-smart-teal/10 uppercase tracking-wider"
          >
            <Plus size={18} /> <span>Inscrire un centre</span>
          </button>
        </div>
      </div>

      {/* 2. STATS */}
      <CentreStats count={centres.length} />

      {/* 3. FILTRES */}
      <CentreFilters
        search={search}
        setSearch={setSearch}
        selectedGouv={selectedGouv}
        setSelectedGouv={setSelectedGouv}
        gouvernorats={GOUVERNORATS_AR}
      />

      {/* 4. TABLEAU */}
      <div className="bg-white rounded-[60px] p-10 shadow-sm border border-gray-50 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-smart-teal" size={50} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-300 text-[10px] uppercase tracking-[0.3em] font-black border-b border-gray-50">
                  <th className="pb-8 pl-4">Nom de l'institution</th>
                  <th className="pb-8">Gouvernorat</th>
                  <th className="pb-8 text-center">Identifiants</th>
                  <th className="pb-8">Adresse</th>
                  <th className="pb-8 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {filteredCentres.map((c: any) => (
                  <CentreCard
                    key={c.id}
                    centre={c}
                    onView={() => setViewingCentre(c)}
                    onEdit={() => setEditingCentre(c)}
                    onDelete={() => setCentreToDelete(c)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- 🛡️ ZONE DES FENÊTRES (ZÉRO ALERT SYSTEM) --- */}

      <AddCentreModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        gouvernorats={GOUVERNORATS_AR}
        onRefresh={loadData}
      />

      {editingCentre && (
        <EditCentreModal
          isOpen={!!editingCentre}
          onClose={() => setEditingCentre(null)}
          centre={editingCentre}
          gouvernorats={GOUVERNORATS_AR}
          onRefresh={loadData}
        />
      )}

      {viewingCentre && (
        <CentreQuickView
          isOpen={!!viewingCentre}
          onClose={() => setViewingCentre(null)}
          centre={viewingCentre}
          onEdit={(c: any) => setEditingCentre(c)}
        />
      )}

      {/* 💡 LA NOUVELLE MODALE DE SUPPRESSION */}
      <DeleteCentreModal
        isOpen={!!centreToDelete}
        onClose={() => setCentreToDelete(null)}
        onConfirm={confirmDelete}
        centreName={centreToDelete?.nom}
      />
    </div>
  );
}
