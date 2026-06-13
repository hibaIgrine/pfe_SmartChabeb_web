import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2, X } from "lucide-react";
import api from "../../api/axios";
import { ClubManagementView } from "./management/ClubManagementView";
import { ClubMembersReadOnlyView } from "./management/ClubMembersReadOnlyView";
import { SuspensionModal } from "./management/components/members/SuspensionModal";
import { ClubPageShell } from "./components/ClubPageShell";
import { getAuthHeaders } from "./clubUtils";

export default function ClubRequestsPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();

  const currentRole = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").role ?? ""; }
    catch { return ""; }
  })();
  const isViewer = currentRole === "ADMIN" || currentRole === "RESPONSABLE_CENTRE";
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [memberToSuspend, setMemberToSuspend] = useState<any>(null);
  const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadClub = async () => {
    if (!clubId) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/clubs/${clubId}`, {
        headers: getAuthHeaders(),
      });
      setClub(response.data);
    } catch (err: any) {
      console.error("Erreur chargement du club :", err);
      setError(
        err?.response?.data?.message ||
          "Impossible de charger les informations du club.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClub();
  }, [clubId]);

  const showNotification = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshClub = async () => {
    await loadClub();
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/clubs/inscription/${memberToDelete}`, {
        headers: getAuthHeaders(),
      });
      setMemberToDelete(null);
      showNotification("Membre retiré du club.", "success");
      await refreshClub();
    } catch (err) {
      console.error(err);
      showNotification("Erreur lors de la suppression.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateStatus = async (
    inscriptionId: string,
    nouveauStatut: string,
  ) => {
    try {
      await api.patch(
        `/clubs/inscription/${inscriptionId}/status`,
        { statut: nouveauStatut },
        { headers: getAuthHeaders() },
      );
      showNotification(
        `Demande ${nouveauStatut === "ACCEPTE" ? "acceptée" : "refusée"} avec succès`,
        "success",
      );
      await refreshClub();
    } catch (err) {
      console.error(err);
      showNotification("Erreur lors de la mise à jour du statut.", "error");
    }
  };

  const handleMemberAction = async (
    inscriptionId: string,
    type: string,
    data?: any,
  ) => {
    if (type === "OPEN_SUSPEND_MODAL") {
      const ins = club?.inscriptions?.find((i: any) => i.id === inscriptionId);
      setMemberToSuspend(ins);
      setIsSuspensionModalOpen(true);
      return;
    }

    if (type === "DELETE") {
      setMemberToDelete(inscriptionId);
      return;
    }

    try {
      if (type === "SUSPEND") {
        await api.patch(`/clubs/inscription/${inscriptionId}/suspend`, data, {
          headers: getAuthHeaders(),
        });
        setIsSuspensionModalOpen(false);
        setMemberToSuspend(null);
        showNotification("Membre suspendu avec succès.", "success");
      } else if (type === "REACTIVATE") {
        await api.patch(
          `/clubs/inscription/${inscriptionId}/reactivate`,
          {},
          { headers: getAuthHeaders() },
        );
        showNotification("Membre réactivé avec succès.", "success");
      }
      await refreshClub();
    } catch (err) {
      console.error(err);
      showNotification("Erreur lors de l'action sur le membre.", "error");
    }
  };

  return (
    <>
      <ClubPageShell
        title={isViewer ? "Membres du club" : "Gestion des inscriptions"}
        subtitle={club?.nom ?? "Chargement..."}
        loading={loading}
        error={error}
        notification={notification}
      >
        {isViewer ? (
          <ClubMembersReadOnlyView
            club={club}
            onBack={() => navigate(-1)}
          />
        ) : (
          <ClubManagementView
            club={club}
            onBack={() => navigate(-1)}
            onUpdateStatus={handleUpdateStatus}
            onMemberAction={handleMemberAction}
          />
        )}
      </ClubPageShell>

      {!isViewer && isSuspensionModalOpen && memberToSuspend && (
        <SuspensionModal
          isOpen={isSuspensionModalOpen}
          onClose={() => setIsSuspensionModalOpen(false)}
          memberName={`${memberToSuspend.utilisateur.nom} ${memberToSuspend.utilisateur.prenom}`}
          onConfirm={(data: any) =>
            handleMemberAction(memberToSuspend.id, "SUSPEND", data)
          }
        />
      )}

      {memberToDelete && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto bg-white rounded-[32px] p-8 max-w-sm w-full mx-4 shadow-2xl border border-gray-100">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 className="text-red-500" size={28} />
              </div>
              <h3 className="text-xl font-black text-gray-800">
                Retirer ce membre ?
              </h3>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                Cette action supprimera définitivement l'inscription de ce
                membre du club. Il devra refaire une demande pour rejoindre.
              </p>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setMemberToDelete(null)}
                  disabled={deleteLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
                >
                  <X size={16} />
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500 text-sm font-black text-white hover:bg-red-600 disabled:opacity-50 transition-all"
                >
                  {deleteLoading ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
