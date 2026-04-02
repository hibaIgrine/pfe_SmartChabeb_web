import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { Loader2, Plus, CheckCircle2, AlertCircle } from "lucide-react";

import { ClubStats } from "./components/ClubStats";
import { ClubCard } from "./components/ClubCard";
import { ClubFilters } from "./components/ClubFilters";
import { AddClubModal, ALL_CATEGORIES } from "./components/AddClubModal";
import { EditClubModal } from "./components/EditClubModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";

import { ClubManagementView } from "./management/ClubManagementView";
import { SuspensionModal } from "./management/components/members/SuspensionModal";

const EMPTY_FORM = {
  nom: "",
  description: "",
  categorie: "",
  id_salle: "",
  id_coach: "",
  logo_url: "",
  planning: "",
  capacite: "", // 💡 AJOUTÉ
  locale: "",
  staff: [] as any[], // 💡 AJOUTÉ
};

export default function ClubsPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [salles, setSalles] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedGouvernorat, setSelectedGouvernorat] = useState("");
  const [selectedCentre, setSelectedCentre] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [notification, setNotification] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<any>(null);
  const [deletingClub, setDeletingClub] = useState<any>(null);
  const [viewingClubDetails, setViewingClubDetails] = useState<any>(null);

  const [addFormData, setAddFormData] = useState({ ...EMPTY_FORM });
  const [editFormData, setEditFormData] = useState({ ...EMPTY_FORM });
  // Dans ClubsPage.tsx
  const [memberToSuspend, setMemberToSuspend] = useState<any>(null); // Stocke l'inscription à suspendre
  const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [resC, resS, resU] = await Promise.all([
        api.get("/clubs", { headers }),
        api.get("/centres", { headers }),
        api.get("/users", { headers }),
      ]);
      setClubs(resC.data);
      setSalles(resS.data);
      setCoaches(resU.data.filter((u: any) => u.role === "COACH"));
      return resC.data; // 💡 On retourne les nouveaux clubs pour la suite
    } catch {
      showAlert("Erreur de chargement", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const gouvernorats = useMemo(
    () =>
      Array.from(new Set(salles.map((s: any) => s.gouvernorat))).filter(
        Boolean,
      ) as string[],
    [salles],
  );
  const allCategories = useMemo(() => {
    const customCats = clubs
      .map((c: any) => c.categorie)
      .filter(
        (cat: string) => cat && !ALL_CATEGORIES.some((ac) => ac.id === cat),
      );
    const uniqueCustoms = Array.from(new Set(customCats)).map((cat) => ({
      id: cat,
      label: cat,
      icon: "✨",
    }));
    return [...ALL_CATEGORIES, ...uniqueCustoms];
  }, [clubs]);

  const centresPourFiltre = useMemo(
    () =>
      !selectedGouvernorat
        ? []
        : salles.filter((s: any) => s.gouvernorat === selectedGouvernorat),
    [salles, selectedGouvernorat],
  );

  const filteredClubs = useMemo(
    () =>
      clubs.filter((c: any) => {
        const matchSearch = c.nom
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchCat =
          selectedCategory === "ALL" || c.categorie === selectedCategory;
        const matchGov =
          !selectedGouvernorat || c.centre?.gouvernorat === selectedGouvernorat;
        const matchCentre = !selectedCentre || c.id_centre === selectedCentre;
        const matchStatus =
          selectedStatus === "ALL" ||
          (selectedStatus === "ACTIVE" ? c.est_actif : !c.est_actif);
        return (
          matchSearch && matchCat && matchGov && matchCentre && matchStatus
        );
      }),
    [
      clubs,
      searchQuery,
      selectedCategory,
      selectedGouvernorat,
      selectedCentre,
      selectedStatus,
    ],
  );

  const showAlert = (msg: string, type: "error" | "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreate = async (e: any, payload: any) => {
    e.preventDefault();
    try {
      await api.post(
        "/clubs",
        {
          ...payload,
          id_centre: payload.id_salle,
          locale_fixe: payload.locale,
        },
        { headers },
      );
      setIsAddModalOpen(false);
      setAddFormData({ ...EMPTY_FORM });
      await loadAllData();
      showAlert("Club créé avec succès ! 🎉", "success");
    } catch {
      showAlert("Erreur lors de la création du club", "error");
    }
  };

  const handleEditOpen = (club: any) => {
    setEditFormData({
      nom: club.nom ?? "",
      description: club.description ?? "",
      categorie: club.categorie ?? "",
      id_salle: club.id_salle ?? club.id_centre ?? "",
      id_coach: club.id_coach ?? "",
      logo_url: club.logo_url ?? "",
      planning: club.planning ?? "",
      capacite: club.capacite ?? "",
      locale: club.locale ?? club.locale_fixe ?? "",
      staff: club.staff ?? [],
    });
    setEditingClub(club);
  };

  const handleUpdate = async (e: any, updatedData: any) => {
    e.preventDefault();
    try {
      await api.patch(
        `/clubs/${editingClub.id}`,
        {
          ...updatedData,
          id_centre: updatedData.id_salle,
          locale_fixe: updatedData.locale,
        },
        { headers },
      );
      setEditingClub(null);
      setEditFormData({ ...EMPTY_FORM });
      await loadAllData();
      showAlert("Club mis à jour avec succès ! ✅", "success");
    } catch {
      showAlert("Erreur lors de la mise à jour", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/clubs/${deletingClub.id}`, { headers });
      setDeletingClub(null);
      await loadAllData();
      showAlert("Club désactivé avec succès", "success");
    } catch {
      showAlert("Erreur lors de la désactivation", "error");
    }
  };

  const handleReactivate = async (club: any) => {
    try {
      await api.patch(`/clubs/${club.id}/activate`, {}, { headers });
      await loadAllData();
      showAlert("Club réactivé avec succès", "success");
    } catch {
      showAlert("Erreur lors de la réactivation", "error");
    }
  };

  const handleToggleActive = async (club: any) => {
    if (club.est_actif) {
      setDeletingClub(club);
      return;
    }
    await handleReactivate(club);
  };

  const handleUpdateStatus = async (
    inscriptionId: string,
    nouveauStatut: string,
  ) => {
    try {
      await api.patch(
        `/clubs/inscription/${inscriptionId}/status`,
        { statut: nouveauStatut },
        { headers },
      );
      showAlert(
        `Demande ${nouveauStatut === "ACCEPTE" ? "acceptée" : "refusée"} avec succès`,
        "success",
      );
      await loadAllData();
      setViewingClubDetails(null);
    } catch (err: any) {
      // 💡 On intercepte l'erreur du Backend si le club est plein
      if (err.response && err.response.status === 409) {
        showAlert(
          "Impossible : La capacité maximale de ce club est déjà atteinte.",
          "error",
        );
      } else {
        showAlert("Erreur lors du traitement de la demande", "error");
      }
    }
  };

  // Fichier : ClubsPage.tsx

  const handleMemberAction = async (
    inscriptionId: string,
    type: string,
    data?: any,
  ) => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // 💡 CAS 1 : On veut suspendre -> On ouvre juste la modale
    if (type === "OPEN_SUSPEND_MODAL") {
      // On trouve l'inscription dans le club actuel pour avoir le nom de l'utilisateur
      const ins = viewingClubDetails.inscriptions.find(
        (i: any) => i.id === inscriptionId,
      );
      setMemberToSuspend(ins);
      setIsSuspensionModalOpen(true);
      return; // On s'arrête ici, on n'appelle pas l'API tout de suite
    }

    // 💡 CAS 2 : On confirme la suspension depuis la modale
    try {
      if (type === "SUSPEND") {
        await api.patch(`/clubs/inscription/${inscriptionId}/suspend`, data, {
          headers,
        });
        setIsSuspensionModalOpen(false);
        setMemberToSuspend(null);
      } else if (type === "REACTIVATE") {
        await api.patch(
          `/clubs/inscription/${inscriptionId}/reactivate`,
          {},
          { headers },
        );
      } else if (type === "DELETE") {
        if (!window.confirm("Supprimer ce membre ?")) return;
        await api.delete(`/clubs/inscription/${inscriptionId}`, { headers });
      }

      // RAFRAICHISSEMENT SANS QUITTER LA PAGE
      const freshClubs = await loadAllData();
      const updatedClub = freshClubs.find(
        (c: any) => c.id === viewingClubDetails.id,
      );
      setViewingClubDetails(updatedClub);

      showAlert("Action effectuée avec succès", "success");
    } catch (err) {
      showAlert("Erreur lors de l'action", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      {notification && (
        <div
          className={`fixed top-5 right-5 z-[1000] px-5 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 font-bold text-sm transition-all animate-in slide-in-from-right duration-300 ${notification.type === "error" ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"}`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{notification.msg}</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-smart-teal tracking-tight">
            Gestion des Clubs
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">
            Répertoire officiel des activités socio-culturelles du Ministère
          </p>
        </div>
        <button
          onClick={() => {
            setAddFormData({ ...EMPTY_FORM });
            setIsAddModalOpen(true);
          }}
          className="bg-smart-teal text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md hover:bg-[#35565d] active:scale-95 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={18} /> Nouveau Club
        </button>
      </div>
      <ClubStats clubs={clubs} salles={salles} />
      <ClubFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedGouvernorat={selectedGouvernorat}
        setSelectedGouvernorat={setSelectedGouvernorat}
        selectedCentre={selectedCentre}
        setSelectedCentre={setSelectedCentre}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        categories={allCategories}
        gouvernorats={gouvernorats}
        centres={centresPourFiltre}
      />
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="animate-spin text-smart-teal" size={44} />
        </div>
      ) : filteredClubs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club: any) => (
            <ClubCard
              key={club.id}
              club={club}
              onViewMembers={(c) => setViewingClubDetails(c)}
              onEdit={(c) => handleEditOpen(c)}
              onDelete={(c) => handleToggleActive(c)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[28px] py-24 text-center border border-gray-100">
          <span className="text-5xl">🔍</span>
          <p className="text-gray-400 font-bold text-sm mt-3">
            Aucun club ne correspond à vos critères.
          </p>
        </div>
      )}
      <AddClubModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        salles={salles}
        coaches={coaches}
        categories={allCategories}
        formData={addFormData}
        setFormData={setAddFormData}
        onSubmit={handleCreate}
      />
      <EditClubModal
        isOpen={!!editingClub}
        onClose={() => setEditingClub(null)}
        salles={salles}
        coaches={coaches}
        categories={allCategories}
        formData={editFormData}
        setFormData={setEditFormData}
        onSubmit={handleUpdate}
      />
      <DeleteConfirmModal
        club={deletingClub}
        onClose={() => setDeletingClub(null)}
        onConfirm={handleDelete}
      />

      {viewingClubDetails && (
        <ClubManagementView
          club={viewingClubDetails}
          onBack={() => setViewingClubDetails(null)}
          onUpdateStatus={handleUpdateStatus}
          onMemberAction={handleMemberAction}
        />
      )}
      {isSuspensionModalOpen && memberToSuspend && (
        <SuspensionModal
          isOpen={isSuspensionModalOpen}
          onClose={() => setIsSuspensionModalOpen(false)}
          memberName={`${memberToSuspend.utilisateur.nom} ${memberToSuspend.utilisateur.prenom}`}
          onConfirm={(data: any) =>
            handleMemberAction(memberToSuspend.id, "SUSPEND", data)
          }
        />
      )}
    </div>
  );
}
