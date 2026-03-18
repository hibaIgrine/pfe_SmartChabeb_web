import { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import { Loader2, Plus } from "lucide-react";

// Components
import { LocalCard } from "./management/components/LocalCard";
import { AddLocalModal } from "./management/components/AddLocalModal";
import { EditLocalModal } from "./management/components/EditLocalModal";
import { LocauxStats } from "./management/components/LocauxStats";
import { LocalFilters } from "./management/components/LocalFilters";
import { DeleteLocalModal } from "./management/components/DeleteLocalModal";
export default function LocauxPage() {
  // --- ÉTATS ---
  const [locaux, setLocaux] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLocal, setEditingLocal] = useState<any>(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [selectedCentre, setSelectedCentre] = useState("");
  const [localToDelete, setLocalToDelete] = useState<any>(null); 
  const [notification, setNotification] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );
  const showAlert = (msg: string, type: "error" | "success") => {
    setNotification({ msg, type });
    // L'alerte disparaît automatiquement après 4 secondes
    setTimeout(() => setNotification(null), 4000);
  };
  // --- CHARGEMENT DES DONNÉES ---
  const loadData = async () => {
    setLoading(true);
    try {
      const [resL, resC] = await Promise.all([
        api.get("/locaux", { headers }),
        api.get("/centres", { headers }),
      ]);
      setLocaux(resL.data);
      setCentres(resC.data);
    } catch (err) {
      console.error("Erreur de chargement des locaux", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- LOGIQUE DE FILTRAGE ---
  const filteredLocaux = locaux.filter((l: any) => {
    const matchesSearch = l.nom.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "ALL" || l.type === filterType;
    const matchesCentre = !selectedCentre || l.id_centre === selectedCentre;
    return matchesSearch && matchesType && matchesCentre;
  });

  // --- ACTIONS ---
  // 💡 État pour la suppression

  const executeDelete = async () => {
    if (!localToDelete) return;
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
    try {
      await api.delete(`/locaux/${localToDelete.id}`, { headers });
      setLocalToDelete(null); // Ferme la modale
      loadData(); // Rafraîchit la liste
      showAlert("Espace supprimé du registre national", "success");
    } catch (err) {
      showAlert("Erreur lors de la suppression", "error");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* 🔔 DESIGN DU TOAST PERSONNALISÉ (Michelle Style) */}
      {notification && (
        <div
          className={`fixed top-10 right-10 z-[1000] flex items-center space-x-4 p-5 rounded-[30px] shadow-2xl animate-in slide-in-from-right-10 border border-white/20 backdrop-blur-md ${
            notification.type === "error"
              ? "bg-[#E98A7D] text-white"
              : "bg-[#D9E8D1] text-[#436d75]"
          }`}
        >
          <div className="font-black italic text-sm uppercase tracking-widest">
            {notification.msg}
          </div>
        </div>
      )}
      {/* 1. HEADER : Titre et Bouton Ajouter */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6">
        <div>
          <h1 className="text-7xl font-black text-smart-teal tracking-tighter italic leading-none">
            Patrimoine
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.5em] mt-4 ml-1 italic">
            Inventaire des locaux et terrains ministériels
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-smart-teal text-white px-10 py-5 rounded-[35px] font-black shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-95 cursor-pointer"
        >
          <Plus size={24} /> <span>Ajouter un espace</span>
        </button>
      </div>

      {/* 2. STATISTIQUES GLOBALES */}
      <LocauxStats locaux={locaux} />

      {/* 3. BARRE DE RECHERCHE ET FILTRES */}
      <LocalFilters
        search={search}
        setSearch={setSearch}
        type={filterType}
        setType={setFilterType}
        centres={centres}
        selectedCentre={selectedCentre}
        setCentre={setSelectedCentre}
      />

      {/* 4. GRILLE DES CARTES (LISTE FILTRÉE) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="animate-spin text-smart-teal" size={50} />
          <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">
            Synchronisation du patrimoine...
          </p>
        </div>
      ) : (
        <>
          {filteredLocaux.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredLocaux.map((l: any) => (
                <LocalCard
                  key={l.id}
                  local={l}
                  onEdit={(item: any) => setEditingLocal(item)}
                  onDelete={(item: any) => setLocalToDelete(item)}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-[50px] border-4 border-dashed border-gray-50">
              <p className="text-gray-300 font-black italic text-2xl">
                Aucun espace trouvé...
              </p>
            </div>
          )}
        </>
      )}

      {/* 5. MODALES (ADD & EDIT) */}
      <AddLocalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        centres={centres}
        onRefresh={loadData}
      />

      {editingLocal && (
        <EditLocalModal
          isOpen={!!editingLocal}
          local={editingLocal}
          centres={centres}
          onClose={() => setEditingLocal(null)}
          onRefresh={loadData}
        />
      )}
      <DeleteLocalModal
        isOpen={!!localToDelete}
        localName={localToDelete?.nom}
        onClose={() => setLocalToDelete(null)}
        onConfirm={executeDelete}
      />
    </div>
  );
}
