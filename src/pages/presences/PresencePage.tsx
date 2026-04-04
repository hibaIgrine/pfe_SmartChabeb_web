import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Users,
  XCircle,
} from "lucide-react";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function hasArabic(text: string) {
  return /[\u0600-\u06FF]/.test(text);
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
  const [club, setClub] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
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

  const loadAll = async (dateValue: string) => {
    setLoading(true);
    try {
      const myClubsRes = await api.get("/presences/my-clubs");
      const myClubs = Array.isArray(myClubsRes.data) ? myClubsRes.data : [];
      const onlyClub = myClubs[0] || null;
      setClub(onlyClub);

      if (!onlyClub) {
        setMembers([]);
        setHistory([]);
        setStats(null);
        return;
      }

      const [membersRes, historyRes, statsRes] = await Promise.all([
        api.get(`/presences/${onlyClub.id}/members?date=${dateValue}`),
        api.get(`/presences/${onlyClub.id}/history?limit=80`),
        api.get(`/presences/${onlyClub.id}/stats`),
      ]);

      setMembers(membersRes.data?.membres || []);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      setStats(statsRes.data || null);
    } catch (error: any) {
      console.error("Erreur présence:", error);
      showAlert(
        error?.response?.data?.message ||
          "Impossible de charger la gestion de présence.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== "RESPONSABLE_CLUB") {
      setLoading(false);
      return;
    }
    loadAll(selectedDate);
  }, []);

  const markAttendance = async (member: any, statut: "PRESENT" | "ABSENT") => {
    if (!club?.id) return;

    setBusyUserId(member.id_utilisateur);
    try {
      await api.post("/presences/mark", {
        id_club: club.id,
        id_utilisateur: member.id_utilisateur,
        date_presence: selectedDate,
        statut,
        remarque: null,
      });

      await loadAll(selectedDate);
      showAlert(`Statut mis à jour: ${statut}`, "success");
    } catch (error: any) {
      console.error(error);
      showAlert(
        error?.response?.data?.message ||
          "Erreur lors du marquage de présence.",
        "error",
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const exportDailyFile = async () => {
    if (!club?.id) return;

    setIsExporting(true);
    try {
      const response = await api.get(
        `/presences/${club.id}/export?date=${selectedDate}`,
      );
      const fileName =
        response.data?.fileName || `presence-${selectedDate}.csv`;
      const csvContent = response.data?.csv;

      if (!csvContent || typeof csvContent !== "string") {
        throw new Error("Contenu d'export invalide.");
      }

      const blob = new Blob([`\uFEFF${csvContent}`], {
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
      console.error(error);
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

  const exportDailyPdf = async () => {
    if (!club?.id) return;

    setIsExportingPdf(true);
    try {
      const response = await api.get(
        `/presences/${club.id}/export?date=${selectedDate}`,
      );

      const records = Array.isArray(response.data?.records)
        ? response.data.records
        : [];
      const metadata = response.data?.metadata || {};

      if (records.length === 0) {
        throw new Error("Aucune donnée à exporter pour cette date.");
      }

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Bande institutionnelle sur une seule ligne
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

      // Titre centré
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

      // Nom du centre déjà placé dans la bande institutionnelle

      autoTable(doc, {
        startY: 158,
        styles: { fontSize: 8 },
        head: [
          [
            "Nom",
            "Prénom",
            "Email",
            "Rôle",
            "Statut",
            "Remarque",
            "Marqué par",
          ],
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
        {
          align: "right",
        },
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
      doc.text(
        "Document officiel - SmartChabeb",
        pageWidth - 40,
        pageHeight - 22,
        {
          align: "right",
        },
      );

      const safeClubName = String(metadata?.club?.nom || club.nom || "club")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      doc.save(`presence-${safeClubName || "club"}-${selectedDate}.pdf`);
      showAlert("Fichier PDF téléchargé avec succès.", "success");
    } catch (error: any) {
      console.error(error);
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

  const totals = stats?.totals || {};
  const topMembers = useMemo(
    () => (stats?.par_membre || []).slice(0, 8),
    [stats],
  );

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

      <div className="flex flex-col lg:flex-row justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-smart-teal tracking-tight">
            Gestion de Présence
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">
            Responsable club: suivi quotidien des membres de votre club.
          </p>
          {club && (
            <p className="text-xs font-bold text-smart-teal mt-2 uppercase tracking-wider">
              Club: {club.nom}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm flex items-center gap-3 self-start">
          <CalendarDays size={16} className="text-smart-teal" />
          <input
            type="date"
            value={selectedDate}
            onChange={async (e) => {
              const nextDate = e.target.value;
              setSelectedDate(nextDate);
              await loadAll(nextDate);
            }}
            className="text-sm font-bold text-smart-teal outline-none"
          />
          <button
            onClick={exportDailyFile}
            disabled={isExporting || !club}
            className="ml-2 px-3 py-2 rounded-xl bg-smart-teal text-white text-xs font-black hover:bg-[#35565d] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download size={14} />
            {isExporting ? "Export..." : "Exporter"}
          </button>
          <button
            onClick={exportDailyPdf}
            disabled={isExportingPdf || !club}
            className="px-3 py-2 rounded-xl bg-[#E98A7D] text-white text-xs font-black hover:bg-[#d5766a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FileText size={14} />
            {isExportingPdf ? "PDF..." : "Exporter PDF"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center font-bold text-gray-500">
          Chargement des présences...
        </div>
      ) : !club ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <p className="font-black text-gray-500">
            Aucun club trouvé pour ce responsable.
          </p>
        </div>
      ) : (
        <>
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
            <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 p-6">
              <h2 className="text-lg font-black text-smart-teal mb-4">
                Marquage du jour
              </h2>

              <div className="space-y-3">
                {members.length === 0 && (
                  <p className="text-sm text-gray-500 font-medium">
                    Aucun membre actif à afficher.
                  </p>
                )}

                {members.map((member) => {
                  const fullName =
                    `${member.prenom || ""} ${member.nom || ""}`.trim();
                  const status = member.statut_jour || "NON_MARQUE";

                  return (
                    <div
                      key={member.id_utilisateur}
                      className="border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div>
                        <p className="font-black text-smart-teal text-sm">
                          {fullName}
                        </p>
                        <p className="text-xs font-semibold text-gray-500 mt-1">
                          Statut: {status}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          disabled={busyUserId === member.id_utilisateur}
                          onClick={() => markAttendance(member, "PRESENT")}
                          className="px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-black hover:bg-green-700 disabled:opacity-50"
                        >
                          Présent
                        </button>
                        <button
                          disabled={busyUserId === member.id_utilisateur}
                          onClick={() => markAttendance(member, "ABSENT")}
                          className="px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 disabled:opacity-50"
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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
                      Présents: {item.presents} | Absents: {item.absents}
                    </p>
                    <p className="text-xs font-black text-smart-teal mt-1">
                      {item.taux_presence}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6">
            <h2 className="text-lg font-black text-smart-teal mb-4">
              Historique récent
            </h2>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Membre</th>
                    <th className="py-2 pr-4">Statut</th>
                    <th className="py-2 pr-4">Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-3 text-gray-400 font-medium"
                      >
                        Aucun historique.
                      </td>
                    </tr>
                  )}
                  {history.map((row: any) => (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="py-2 pr-4 font-semibold text-gray-600">
                        {String(row.date_presence || "").slice(0, 10)}
                      </td>
                      <td className="py-2 pr-4 font-semibold text-smart-teal">
                        {row?.membre?.prenom} {row?.membre?.nom}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-black ${row.statut === "PRESENT" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                          {row.statut}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-600 font-medium">
                        {row?.responsable?.prenom} {row?.responsable?.nom}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
