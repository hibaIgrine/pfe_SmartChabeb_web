import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  Users,
  X,
  XCircle,
} from "lucide-react";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function hasArabic(text: string) {
  return /[؀-ۿ]/.test(text);
}

function textToImageDataUrl(
  text: string,
  options?: {
    width?: number;
    height?: number;
    fontSize?: number;
    align?: "left" | "center" | "right";
  },
) {
  const width = options?.width ?? 520;
  const height = options?.height ?? 34;
  const fontSize = options?.fontSize ?? 18;
  const align = options?.align ?? "right";

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) return "";

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#1f2937";
  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = "middle";
  ctx.direction = "rtl";

  if (align === "left") {
    ctx.textAlign = "left";
    ctx.fillText(text, 2, height / 2);
  } else if (align === "center") {
    ctx.textAlign = "center";
    ctx.fillText(text, width / 2, height / 2);
  } else {
    ctx.textAlign = "right";
    ctx.fillText(text, width - 2, height / 2);
  }

  return canvas.toDataURL("image/png");
}

export default function PresencePage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role;

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [managedClubs, setManagedClubs] = useState<any[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [club, setClub] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [seances, setSeances] = useState<any[]>([]);
  const [selectedSeance, setSelectedSeance] = useState<any>(null);

  // ── new seance creation mode ──────────────────────────────────────────────
  const [isNewSeanceMode, setIsNewSeanceMode] = useState(false);
  const [newSeanceTitle, setNewSeanceTitle] = useState("");
  const [localAttendance, setLocalAttendance] = useState<
    Record<string, "PRESENT" | "ABSENT" | null>
  >({});
  const [isSavingPresences, setIsSavingPresences] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [notification, setNotification] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showAlert = (msg: string, type: "success" | "error") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const getScrollContainer = () =>
    document.querySelector(
      '[data-layout-scroll-container="true"]',
    ) as HTMLElement | null;

  const keepScrollPosition = (scrollTop: number) => {
    window.requestAnimationFrame(() => {
      const container = getScrollContainer();
      if (container) container.scrollTop = scrollTop;
    });
  };

  const loadClubData = async (
    clubId: string,
    dateValue: string,
    preferredSeanceId?: string,
    options?: { showLoading?: boolean; preserveScroll?: boolean },
  ) => {
    const shouldShowLoading = options?.showLoading ?? true;
    const shouldPreserveScroll = options?.preserveScroll ?? false;
    const scrollTop = shouldPreserveScroll
      ? getScrollContainer()?.scrollTop || 0
      : 0;

    if (shouldShowLoading) setLoading(true);
    try {
      const currentClub =
        managedClubs.find((item) => item.id === clubId) || null;
      setClub(currentClub);

      if (!currentClub) {
        setMembers([]);
        setStats(null);
        setSeances([]);
        setSelectedSeance(null);
        return;
      }

      const seancesRes = await api.get(
        `/presences/clubs/${currentClub.id}/seances`,
      );
      const fetchedSeances = Array.isArray(seancesRes.data)
        ? seancesRes.data
        : [];
      setSeances(fetchedSeances);

      const nextSeance =
        fetchedSeances.find((item: any) => item.id === preferredSeanceId) ||
        fetchedSeances.find(
          (item: any) =>
            String(item.date_seance || "").slice(0, 10) === dateValue,
        ) ||
        fetchedSeances[0] ||
        null;

      setSelectedSeance(nextSeance);

      const query = nextSeance?.id
        ? `?date=${dateValue}&seanceId=${nextSeance.id}`
        : `?date=${dateValue}`;
      const [membersRes, statsRes] = await Promise.all([
        api.get(`/presences/${currentClub.id}/members${query}`),
        api.get(`/presences/${currentClub.id}/stats`),
      ]);

      setMembers(membersRes.data?.membres || []);
      setStats(statsRes.data || null);
    } catch (error: any) {
      console.error("Erreur présence:", error);
      showAlert(
        error?.response?.data?.message ||
          "Impossible de charger la gestion de présence.",
        "error",
      );
    } finally {
      if (shouldShowLoading) setLoading(false);
      if (shouldPreserveScroll) keepScrollPosition(scrollTop);
    }
  };

  const loadManagedClubs = async () => {
    try {
      const myClubsRes = await api.get("/presences/my-clubs");
      const myClubs = Array.isArray(myClubsRes.data) ? myClubsRes.data : [];
      setManagedClubs(myClubs);
      if (myClubs.length === 1) {
        setSelectedClubId(myClubs[0].id);
      }
    } catch (error: any) {
      console.error("Erreur chargement clubs gérés:", error);
      setManagedClubs([]);
    }
  };

  useEffect(() => {
    if (role !== "RESPONSABLE_CLUB" && role !== "RESPONSABLE_CENTRE") {
      setLoading(false);
      return;
    }
    void loadManagedClubs();
  }, []);

  useEffect(() => {
    if (!selectedClubId) {
      setLoading(false);
      setClub(null);
      setMembers([]);
      setStats(null);
      setSeances([]);
      setSelectedSeance(null);
      setIsNewSeanceMode(false);
      return;
    }
    void loadClubData(selectedClubId, selectedDate);
  }, [selectedClubId]);

  // Sync local attendance from API data whenever members change (not in create mode)
  useEffect(() => {
    if (isNewSeanceMode) return;
    const initial: Record<string, "PRESENT" | "ABSENT" | null> = {};
    members.forEach((m) => {
      initial[m.id_utilisateur] =
        m.statut_jour === "PRESENT" || m.statut_jour === "ABSENT"
          ? m.statut_jour
          : null;
    });
    setLocalAttendance(initial);
  }, [members, isNewSeanceMode]);

  // ── local attendance helpers ───────────────────────────────────────────────

  const startNewSeance = () => {
    const initial: Record<string, "PRESENT" | "ABSENT" | null> = {};
    members.forEach((m) => {
      initial[m.id_utilisateur] = null;
    });
    setLocalAttendance(initial);
    setNewSeanceTitle(`Séance ${selectedDate}`);
    setIsNewSeanceMode(true);
  };

  const cancelNewSeance = () => {
    setIsNewSeanceMode(false);
    setNewSeanceTitle("");
    // Restore from members
    const initial: Record<string, "PRESENT" | "ABSENT" | null> = {};
    members.forEach((m) => {
      initial[m.id_utilisateur] =
        m.statut_jour === "PRESENT" || m.statut_jour === "ABSENT"
          ? m.statut_jour
          : null;
    });
    setLocalAttendance(initial);
  };

  const toggleLocalAttendance = (
    userId: string,
    status: "PRESENT" | "ABSENT",
  ) => {
    setLocalAttendance((prev) => ({
      ...prev,
      [userId]: prev[userId] === status ? null : status,
    }));
  };

  const clearLocalAttendance = (userId: string) => {
    setLocalAttendance((prev) => ({ ...prev, [userId]: null }));
  };

  // ── submit new seance + all presences ─────────────────────────────────────

  const submitNewSeance = async () => {
    if (!club?.id || !newSeanceTitle.trim()) return;
    setIsSavingPresences(true);
    try {
      const res = await api.post("/presences/seances", {
        id_club: club.id,
        date_seance: selectedDate,
        titre: newSeanceTitle.trim(),
      });
      const seanceId = res.data?.id;

      const toSave = Object.entries(localAttendance).filter(
        ([, s]) => s !== null,
      );
      if (toSave.length > 0) {
        await Promise.all(
          toSave.map(([userId, status]) =>
            api.post("/presences/mark", {
              id_club: club.id,
              id_utilisateur: userId,
              date_presence: selectedDate,
              statut: status,
              remarque: null,
              id_seance: seanceId,
            }),
          ),
        );
      }

      setIsNewSeanceMode(false);
      setNewSeanceTitle("");
      setLocalAttendance({});
      await loadClubData(selectedClubId, selectedDate, seanceId, {
        showLoading: true,
      });
      showAlert("Séance et présences enregistrées avec succès.", "success");
    } catch (err: any) {
      showAlert(
        err?.response?.data?.message || "Erreur lors de l'enregistrement.",
        "error",
      );
    } finally {
      setIsSavingPresences(false);
    }
  };

  // ── submit presence changes for an existing seance ────────────────────────

  const submitExistingPresences = async () => {
    if (!club?.id || !selectedSeance?.id) return;
    setIsSavingPresences(true);
    try {
      const saves: Promise<any>[] = [];

      Object.entries(localAttendance).forEach(([userId, status]) => {
        const original = members.find((m) => m.id_utilisateur === userId);
        const originalStatus =
          original?.statut_jour === "PRESENT" ||
          original?.statut_jour === "ABSENT"
            ? original.statut_jour
            : null;

        if (status === originalStatus) return;

        if (status === null) {
          saves.push(
            api.post("/presences/unmark", {
              id_club: club.id,
              id_utilisateur: userId,
              id_seance: selectedSeance.id,
            }),
          );
        } else {
          saves.push(
            api.post("/presences/mark", {
              id_club: club.id,
              id_utilisateur: userId,
              date_presence: selectedDate,
              statut: status,
              remarque: null,
              id_seance: selectedSeance.id,
            }),
          );
        }
      });

      if (saves.length > 0) await Promise.all(saves);

      await loadClubData(selectedClubId, selectedDate, selectedSeance.id, {
        showLoading: false,
        preserveScroll: true,
      });
      showAlert("Présences enregistrées.", "success");
    } catch (err: any) {
      showAlert(
        err?.response?.data?.message || "Erreur lors de l'enregistrement.",
        "error",
      );
    } finally {
      setIsSavingPresences(false);
    }
  };

  // ── exports ───────────────────────────────────────────────────────────────

  const exportDailyFile = async (targetSeance?: any) => {
    if (!club?.id) return;
    const seance = targetSeance ?? selectedSeance;
    if (!seance?.id) return;

    setIsExporting(true);
    try {
      const response = await api.get(
        `/presences/${club.id}/export?seanceId=${seance.id}`,
      );
      const fileName = response.data?.fileName || `presence-${seance.id}.csv`;
      const csvContent = response.data?.csv;

      if (!csvContent || typeof csvContent !== "string") {
        throw new Error("Contenu d'export invalide.");
      }

      const blob = new Blob([`﻿${csvContent}`], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showAlert("Fichier d'export téléchargé avec succès.", "success");
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message ||
          error?.message ||
          "Impossible de télécharger le fichier d'export.",
        "error",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const exportDailyPdf = async (targetSeance?: any) => {
    if (!club?.id) return;
    const seance = targetSeance ?? selectedSeance;
    if (!seance?.id) return;

    setIsExportingPdf(true);
    try {
      const response = await api.get(
        `/presences/${club.id}/export?seanceId=${seance.id}`,
      );
      const records = Array.isArray(response.data?.records)
        ? response.data.records
        : [];
      const metadata = response.data?.metadata || {};

      if (records.length === 0) {
        throw new Error("Aucune donnée à exporter pour cette date.");
      }

      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(14);
      doc.text("République Tunisienne", 40, 46);
      doc.setFontSize(11);
      doc.text("Ministère de la Jeunesse et des Sports", 40, 62);

      const centreName = String(metadata?.centre?.nom || "-");
      if (centreName !== "-") {
        if (hasArabic(centreName)) {
          const centreImage = textToImageDataUrl(centreName, {
            width: 280,
            height: 30,
            fontSize: 14,
            align: "right",
          });
          if (centreImage) {
            doc.addImage(centreImage, "PNG", pageWidth - 305, 35, 265, 22);
          } else {
            doc.text(centreName, pageWidth - 40, 52, { align: "right" });
          }
        } else {
          doc.setFontSize(13);
          doc.text(centreName, pageWidth - 40, 52, { align: "right" });
        }
      }

      doc.setDrawColor(67, 109, 117);
      doc.setLineWidth(1.2);
      doc.line(40, 82, pageWidth - 40, 82);

      doc.setFontSize(16);
      doc.setTextColor(67, 109, 117);
      doc.text("Fiche Journalière de Présence", pageWidth / 2, 104, {
        align: "center",
      });

      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.text(
        `Date de la fiche: ${metadata?.datePresence || selectedDate}`,
        40,
        124,
      );
      doc.text(`Club: ${metadata?.club?.nom || club.nom || "-"}`, 40, 138);

      autoTable(doc, {
        startY: 158,
        styles: { fontSize: 8 },
        head: [
          ["Nom", "Prénom", "Email", "Rôle", "Statut", "Remarque", "Marqué par"],
        ],
        body: records.map((row: any) => [
          row.utilisateurNom || "",
          row.utilisateurPrenom || "",
          row.utilisateurEmail || "",
          row.utilisateurRole || "",
          row.statutPresence || "",
          row.remarque || "",
          `${row.marqueParPrenom || ""} ${row.marqueParNom || ""}`.trim(),
        ]),
      });

      const finalY = ((doc as any).lastAutoTable?.finalY || 158) + 22;
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.text(
        `Date de la fiche: ${metadata?.datePresence || selectedDate}`,
        pageWidth - 40,
        finalY,
        { align: "right" },
      );

      const presentsCount = records.filter(
        (r: any) => r.statutPresence === "PRESENT",
      ).length;
      const absentsCount = records.filter(
        (r: any) => r.statutPresence === "ABSENT",
      ).length;
      const nonMarquesCount = records.filter(
        (r: any) => r.statutPresence === "NON_MARQUE",
      ).length;
      doc.text(
        `Synthèse: Présents ${presentsCount} | Absents ${absentsCount} | Non marqués ${nonMarquesCount}`,
        40,
        finalY,
      );

      doc.setDrawColor(229, 231, 235);
      doc.line(40, pageHeight - 38, pageWidth - 40, pageHeight - 38);
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Date d'exportation: ${new Date().toLocaleString("fr-FR")}`,
        40,
        pageHeight - 22,
      );
      doc.text("Document officiel - SmartChabeb", pageWidth - 40, pageHeight - 22, {
        align: "right",
      });

      const safeClubName = String(metadata?.club?.nom || club.nom || "club")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      doc.save(`presence-${safeClubName || "club"}-${selectedDate}.pdf`);
      showAlert("Fichier PDF téléchargé avec succès.", "success");
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message ||
          error?.message ||
          "Impossible de télécharger le fichier PDF.",
        "error",
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  // ── derived values ─────────────────────────────────────────────────────────

  const totals = stats?.totals || {};
  const topMembers = useMemo(() => (stats?.par_membre || []).slice(0, 8), [stats]);

  const presentCount = Object.values(localAttendance).filter(
    (s) => s === "PRESENT",
  ).length;
  const absentCount = Object.values(localAttendance).filter(
    (s) => s === "ABSENT",
  ).length;
  const unmarkedCount = Object.values(localAttendance).filter(
    (s) => s === null,
  ).length;

  // ── access guard ──────────────────────────────────────────────────────────

  if (role !== "RESPONSABLE_CLUB") {
    return (
      <div className="max-w-3xl mx-auto mt-8 bg-red-50 border border-red-100 rounded-3xl p-8">
        <h1 className="text-2xl font-black text-red-700">Accès refusé</h1>
        <p className="text-red-600 mt-2 font-medium">
          Cette page est réservée au responsable de club.
        </p>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      {notification && (
        <div
          className={`fixed top-5 right-5 z-[1000] px-5 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 font-bold text-sm transition-all animate-in slide-in-from-right duration-300 ${
            notification.type === "error"
              ? "bg-red-50 text-red-600 border-red-100"
              : "bg-green-50 text-green-600 border-green-100"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Club selector header */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-smart-teal tracking-tight">
            Gestion de Présence
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">
            Responsable club : sélectionnez d'abord le club à gérer.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Club à gérer
            </label>
            <select
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              className="min-w-[240px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-smart-teal outline-none shadow-sm"
            >
              <option value="">Choisir un club...</option>
              {managedClubs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nom}
                </option>
              ))}
            </select>
          </div>
          {club && (
            <p className="text-xs font-bold text-smart-teal mt-2 uppercase tracking-wider">
              Club sélectionné : {club.nom}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center font-bold text-gray-500">
          Chargement des présences...
        </div>
      ) : !selectedClubId ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <p className="font-black text-gray-500">
            Choisissez un club dans la liste déroulante pour charger les séances
            et les membres.
          </p>
        </div>
      ) : !club ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <p className="font-black text-gray-500">
            Aucun club trouvé pour ce responsable.
          </p>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Users size={18} />}
              label="Membres actifs"
              value={totals.membres_actifs || 0}
            />
            <StatCard
              icon={<CheckCircle2 size={18} />}
              label="Présents"
              value={totals.presents || 0}
            />
            <StatCard
              icon={<XCircle size={18} />}
              label="Absents"
              value={totals.absents || 0}
            />
            <StatCard
              icon={<BarChart3 size={18} />}
              label="Taux global"
              value={`${totals.taux_presence_global || 0}%`}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* ── Left column: marking panel ─────────────────────────── */}
            <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 p-6">

              {isNewSeanceMode ? (
                /* ── NEW SEANCE MODE ──────────────────────────────────── */
                <>
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-black text-smart-teal">
                        Nouvelle Séance
                      </h2>
                      <p className="text-xs text-gray-400 font-medium mt-1">
                        Marquez les présences puis enregistrez pour créer la séance.
                      </p>
                    </div>
                    <button
                      onClick={cancelNewSeance}
                      className="px-3 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs font-black hover:bg-gray-200 transition"
                    >
                      Annuler
                    </button>
                  </div>

                  {/* Title input */}
                  <div className="mb-5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-2">
                      Titre de la séance
                    </label>
                    <input
                      autoFocus
                      value={newSeanceTitle}
                      onChange={(e) => setNewSeanceTitle(e.target.value)}
                      placeholder={`Séance ${selectedDate}`}
                      className="w-full rounded-2xl border border-gray-200 bg-[#F7F3E9] px-4 py-3 text-sm font-bold text-smart-teal outline-none focus:ring-4 focus:ring-smart-sage/20"
                    />
                  </div>

                  {/* Member list */}
                  <div className="space-y-2">
                    {members.length === 0 && (
                      <p className="text-sm text-gray-500 font-medium">
                        Aucun membre actif à afficher.
                      </p>
                    )}
                    {members.map((member) => {
                      const fullName =
                        `${member.prenom || ""} ${member.nom || ""}`.trim();
                      const status =
                        localAttendance[member.id_utilisateur] ?? null;
                      return (
                        <div
                          key={member.id_utilisateur}
                          className="border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        >
                          <div>
                            <p className="font-black text-smart-teal text-sm">
                              {fullName}
                            </p>
                            <p
                              className={`text-xs font-semibold mt-0.5 ${
                                status === "PRESENT"
                                  ? "text-green-600"
                                  : status === "ABSENT"
                                    ? "text-red-500"
                                    : "text-gray-400"
                              }`}
                            >
                              {status ?? "Non marqué"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                toggleLocalAttendance(
                                  member.id_utilisateur,
                                  "PRESENT",
                                )
                              }
                              className={`px-3 py-2 rounded-xl text-xs font-black border transition ${
                                status === "PRESENT"
                                  ? "bg-green-600 text-white border-green-600"
                                  : "bg-white text-gray-500 border-gray-200 hover:border-green-400 hover:text-green-600"
                              }`}
                            >
                              Présent
                            </button>
                            <button
                              onClick={() =>
                                toggleLocalAttendance(
                                  member.id_utilisateur,
                                  "ABSENT",
                                )
                              }
                              className={`px-3 py-2 rounded-xl text-xs font-black border transition ${
                                status === "ABSENT"
                                  ? "bg-red-500 text-white border-red-500"
                                  : "bg-white text-gray-500 border-gray-200 hover:border-red-400 hover:text-red-500"
                              }`}
                            >
                              Absent
                            </button>
                            {status !== null && (
                              <button
                                onClick={() =>
                                  clearLocalAttendance(member.id_utilisateur)
                                }
                                className="w-9 h-9 rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center transition"
                                title="Effacer"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary + submit */}
                  <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-xs text-gray-400 font-bold">
                      <span className="text-green-600">{presentCount} présents</span>
                      {" · "}
                      <span className="text-red-500">{absentCount} absents</span>
                      {" · "}
                      <span>{unmarkedCount} non marqués</span>
                    </p>
                    <button
                      onClick={submitNewSeance}
                      disabled={isSavingPresences || !newSeanceTitle.trim()}
                      className="px-6 py-2.5 rounded-xl bg-smart-teal text-white text-xs font-black disabled:opacity-60 hover:bg-[#35565d] transition"
                    >
                      {isSavingPresences
                        ? "Enregistrement..."
                        : "Enregistrer la séance"}
                    </button>
                  </div>
                </>
              ) : (
                /* ── EXISTING SEANCE / DAILY MARKING MODE ─────────────── */
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black text-smart-teal">
                      Marquage du jour
                    </h2>
                    <button
                      onClick={startNewSeance}
                      className="px-3 py-1.5 rounded-xl bg-smart-teal text-white text-xs font-black hover:bg-[#35565d] transition"
                    >
                      + Nouvelle séance
                    </button>
                  </div>

                  {/* Seance selector */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <p className="text-sm font-bold text-gray-500 shrink-0">
                      Séance :
                    </p>
                    {seances.length === 0 ? (
                      <span className="text-xs text-gray-400">
                        Aucune séance — créez-en une pour commencer.
                      </span>
                    ) : (
                      seances.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedSeance(s);
                            void loadClubData(
                              selectedClubId,
                              selectedDate,
                              s.id,
                            );
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-black transition ${
                            selectedSeance?.id === s.id
                              ? "bg-smart-teal text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {s.titre || s.date_seance?.slice(0, 10)}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Member list */}
                  <div className="space-y-2">
                    {members.length === 0 && (
                      <p className="text-sm text-gray-500 font-medium">
                        Aucun membre actif à afficher.
                      </p>
                    )}
                    {members.map((member) => {
                      const fullName =
                        `${member.prenom || ""} ${member.nom || ""}`.trim();
                      const status =
                        localAttendance[member.id_utilisateur] ?? null;
                      return (
                        <div
                          key={member.id_utilisateur}
                          className="border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        >
                          <div>
                            <p className="font-black text-smart-teal text-sm">
                              {fullName}
                            </p>
                            <p
                              className={`text-xs font-semibold mt-0.5 ${
                                status === "PRESENT"
                                  ? "text-green-600"
                                  : status === "ABSENT"
                                    ? "text-red-500"
                                    : "text-gray-400"
                              }`}
                            >
                              {status ?? "Non marqué"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                toggleLocalAttendance(
                                  member.id_utilisateur,
                                  "PRESENT",
                                )
                              }
                              className={`px-3 py-2 rounded-xl text-xs font-black border transition ${
                                status === "PRESENT"
                                  ? "bg-green-600 text-white border-green-600"
                                  : "bg-white text-gray-500 border-gray-200 hover:border-green-400 hover:text-green-600"
                              }`}
                            >
                              Présent
                            </button>
                            <button
                              onClick={() =>
                                toggleLocalAttendance(
                                  member.id_utilisateur,
                                  "ABSENT",
                                )
                              }
                              className={`px-3 py-2 rounded-xl text-xs font-black border transition ${
                                status === "ABSENT"
                                  ? "bg-red-500 text-white border-red-500"
                                  : "bg-white text-gray-500 border-gray-200 hover:border-red-400 hover:text-red-500"
                              }`}
                            >
                              Absent
                            </button>
                            {status !== null && (
                              <button
                                onClick={() =>
                                  clearLocalAttendance(member.id_utilisateur)
                                }
                                className="w-9 h-9 rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center transition"
                                title="Effacer"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit button for existing seance */}
                  {selectedSeance && members.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <p className="text-xs text-gray-400 font-bold">
                        <span className="text-green-600">{presentCount} présents</span>
                        {" · "}
                        <span className="text-red-500">{absentCount} absents</span>
                        {" · "}
                        <span>{unmarkedCount} non marqués</span>
                      </p>
                      <button
                        onClick={submitExistingPresences}
                        disabled={isSavingPresences}
                        className="px-6 py-2.5 rounded-xl bg-smart-teal text-white text-xs font-black disabled:opacity-60 hover:bg-[#35565d] transition"
                      >
                        {isSavingPresences
                          ? "Enregistrement..."
                          : "Enregistrer les présences"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Right column: top attendance ───────────────────────── */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6">
              <h2 className="text-lg font-black text-smart-teal mb-4">
                Top assiduité
              </h2>
              <div className="space-y-2">
                {topMembers.length === 0 && (
                  <p className="text-sm text-gray-500 font-medium">
                    Pas de statistiques disponibles.
                  </p>
                )}
                {topMembers.map((item: any) => (
                  <div
                    key={item.id_utilisateur}
                    className="rounded-xl bg-[#F7F3E9] p-3"
                  >
                    <p className="text-sm font-black text-smart-teal">
                      {item.nom_complet}
                    </p>
                    <p className="text-xs font-semibold text-gray-500 mt-1">
                      Présents : {item.presents} | Absents : {item.absents}
                    </p>
                    <p className="text-xs font-black text-smart-teal mt-1">
                      {item.taux_presence}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Seances history ────────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-black text-smart-teal">
                  Historique des séances
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Chaque séance peut être ouverte, exportée en CSV ou en PDF.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                {seances.length} séance(s)
              </span>
            </div>

            <div className="space-y-3">
              {seances.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 font-medium">
                  Aucune séance enregistrée pour ce club.
                </div>
              ) : (
                seances.map((session: any) => {
                  const isActive = selectedSeance?.id === session.id;
                  return (
                    <div
                      key={session.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        isActive
                          ? "border-smart-teal bg-[#F7F3E9]"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSeance(session);
                            void loadClubData(
                              selectedClubId,
                              selectedDate,
                              session.id,
                            );
                          }}
                          className="text-left"
                        >
                          <p className="font-black text-smart-teal text-sm">
                            {session.titre ||
                              `Séance du ${String(session.date_seance || "").slice(0, 10)}`}
                          </p>
                          <p className="text-xs text-gray-500 font-medium mt-1">
                            Date :{" "}
                            {String(session.date_seance || "").slice(0, 10)}
                            {session.heure_debut
                              ? ` • ${String(session.heure_debut).slice(11, 16)}`
                              : ""}
                            {session.heure_fin
                              ? ` - ${String(session.heure_fin).slice(11, 16)}`
                              : ""}
                          </p>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSeance(session);
                              void exportDailyFile(session);
                            }}
                            disabled={isExporting}
                            className="px-3 py-2 rounded-xl bg-smart-teal text-white text-xs font-black hover:bg-[#35565d] flex items-center gap-2 disabled:opacity-60 transition"
                          >
                            <Download size={14} /> Exporter
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSeance(session);
                              void exportDailyPdf(session);
                            }}
                            disabled={isExportingPdf}
                            className="px-3 py-2 rounded-xl bg-[#E98A7D] text-white text-xs font-black hover:bg-[#d5766a] flex items-center gap-2 disabled:opacity-60 transition"
                          >
                            <FileText size={14} /> PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#F7F3E9] text-smart-teal flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xl font-black text-smart-teal leading-none mt-1">
          {value}
        </p>
      </div>
    </div>
  );
}
