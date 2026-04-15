import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Loader2, Plus, CheckCircle2, AlertCircle } from "lucide-react";

import { ClubStats } from "./components/ClubStats";
import { ClubCard } from "./components/ClubCard";
import { ClubFilters } from "./components/ClubFilters";
import { AddClubModal, ALL_CATEGORIES } from "./components/AddClubModal";
import { EditClubModal } from "./components/EditClubModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";

const EMPTY_FORM = {
  nom: "",
  description: "",
  categorie: "",
  id_salle: "",
  id_local: "",
  id_coach: "",
  logo_url: "",
  planning: "",
  capacite: "", // 💡 AJOUTÉ
  locale: "",
  objectifs: [] as string[],
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
  const [validatingStartId, setValidatingStartId] = useState<string | null>(
    null,
  );

  const [addFormData, setAddFormData] = useState({ ...EMPTY_FORM });
  const [editFormData, setEditFormData] = useState({ ...EMPTY_FORM });
  const navigate = useNavigate();
  const currentUser = useMemo(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }, []);
  const [resolvedCentreId, setResolvedCentreId] = useState(
    currentUser?.id_centre ?? currentUser?.centre?.id ?? "",
  );
  const [resolvedCentreName, setResolvedCentreName] = useState(
    currentUser?.centre?.nom ?? "",
  );
  const isResponsableCentre = currentUser?.role === "RESPONSABLE_CENTRE";
  const canValidateStart =
    currentUser?.role === "ADMIN" || currentUser?.role === "RESPONSABLE_CENTRE";
  const myCentreId = resolvedCentreId;
  const myCentreName = resolvedCentreName;
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [resC, resS] = await Promise.all([
        api.get("/clubs", { headers }),
        api.get("/centres", { headers }),
      ]);
      setClubs(resC.data);
      setSalles(resS.data);

      try {
        const meRes = await api.get("/users/me/profile", { headers });
        const me = meRes.data;
        setResolvedCentreId(me?.centre?.id ?? me?.id_centre ?? "");
        setResolvedCentreName(me?.centre?.nom ?? "");
      } catch {
        setResolvedCentreId(
          currentUser?.id_centre ?? currentUser?.centre?.id ?? "",
        );
        setResolvedCentreName(currentUser?.centre?.nom ?? "");
      }

      try {
        if (currentUser?.role === "ADMIN") {
          const resU = await api.get("/users", { headers });
          setCoaches(
            (Array.isArray(resU.data) ? resU.data : []).filter(
              (u: any) => u.role === "COACH",
            ),
          );
        } else if (myCentreId) {
          const resStaff = await api.get(
            `/users/staff-by-centre/${myCentreId}`,
            {
              headers,
            },
          );
          setCoaches(Array.isArray(resStaff.data) ? resStaff.data : []);
        } else {
          setCoaches([]);
        }
      } catch {
        // Do not block page rendering if staff/coaches cannot be loaded.
        setCoaches([]);
      }

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
        const shouldUseLocationFilters = !isResponsableCentre;
        const matchGov =
          !shouldUseLocationFilters ||
          !selectedGouvernorat ||
          c.centre?.gouvernorat === selectedGouvernorat;
        const matchCentre =
          !shouldUseLocationFilters ||
          !selectedCentre ||
          c.id_centre === selectedCentre;
        const matchStatus =
          selectedStatus === "ALL" ||
          (selectedStatus === "ACTIVE" ? c.est_actif : !c.est_actif);
        return (
          matchSearch && matchCat && matchGov && matchCentre && matchStatus
        );
      }),
    [
      clubs,
      isResponsableCentre,
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
    const resolvedCentreId = isResponsableCentre
      ? myCentreId
      : payload.id_salle;
    try {
      await api.post(
        "/clubs",
        {
          ...payload,
          id_salle: resolvedCentreId,
          id_centre: resolvedCentreId,
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

  const handleValidateStart = async (club: any) => {
    if (!club?.id) return;

    setValidatingStartId(club.id);
    try {
      await api.patch(`/clubs/${club.id}/start`, {}, { headers });
      await loadAllData();
      showAlert(
        `Le club "${club.nom}" est maintenant validé pour démarrer.`,
        "success",
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Impossible de valider le démarrage du club.";
      showAlert(Array.isArray(message) ? message[0] : message, "error");
    } finally {
      setValidatingStartId(null);
    }
  };

  const handleEditOpen = (club: any) => {
    setEditFormData({
      nom: club.nom ?? "",
      description: club.description ?? "",
      categorie: club.categorie ?? "",
      id_salle: club.id_salle ?? club.id_centre ?? "",
      id_local: "",
      id_coach: club.id_coach ?? "",
      logo_url: club.logo_url ?? "",
      planning: club.planning ?? "",
      capacite: club.capacite ?? "",
      locale: club.locale ?? club.locale_fixe ?? "",
      objectifs: Array.isArray(club?.planning?.objectifs)
        ? club.planning.objectifs
        : [],
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
            if (isResponsableCentre && !myCentreId) {
              showAlert(
                "Aucun centre associé au responsable courant.",
                "error",
              );
              return;
            }
            setAddFormData({ ...EMPTY_FORM });
            setIsAddModalOpen(true);
          }}
          className="bg-smart-teal text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md hover:bg-[#35565d] active:scale-95 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus size={18} /> Nouveau Club
        </button>
      </div>
      <ClubStats
        clubs={clubs}
        salles={salles}
        hideCoverageStat={isResponsableCentre}
      />
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
        showLocationFilters={!isResponsableCentre}
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
              onViewRequests={(c) => navigate(`/clubs/${c.id}/requests`)}
              onViewStaff={(c) => navigate(`/clubs/${c.id}/staff`)}
              onEdit={(c) => handleEditOpen(c)}
              onDelete={(c) => handleToggleActive(c)}
              canValidateStart={canValidateStart}
              onValidateStart={handleValidateStart}
              validatingStartId={validatingStartId}
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
        lockedCentreId={isResponsableCentre ? myCentreId : ""}
        lockedCentreName={isResponsableCentre ? myCentreName : ""}
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
        lockedCentreId={isResponsableCentre ? myCentreId : ""}
        lockedCentreName={isResponsableCentre ? myCentreName : ""}
        onSubmit={handleUpdate}
      />
      <DeleteConfirmModal
        club={deletingClub}
        onClose={() => setDeletingClub(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
