import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
          {
            headers: getAuthHeaders(),
          },
        );
        showNotification("Membre réactivé avec succès.", "success");
      } else if (type === "DELETE") {
        if (!window.confirm("Supprimer ce membre ?")) return;
        await api.delete(`/clubs/inscription/${inscriptionId}`, {
          headers: getAuthHeaders(),
        });
        showNotification("Membre retiré du club.", "success");
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
    </>
  );
}
