import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  CalendarDays,
  Clock3,
  Download,
  Loader2,
  MapPin,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import api from "../../api/axios";

type AttendanceCertificate = {
  eventId: string;
  eventName: string;
  clubName: string;
  centerName: string;
  date: string;
  status: string;
  present: boolean;
  pointsAwarded?: boolean;
};

export default function AdherentCertificatesPage() {
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const [certificates, setCertificates] = useState<AttendanceCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCertificates = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.get("/certificates/my-attendance", {
        headers,
      });
      setCertificates(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      const detailedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(" | ")
        : apiMessage;
      setErrorMessage(
        detailedMessage ||
          "Impossible de charger vos certificats pour le moment.",
      );
      setCertificates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCertificates();
  }, []);

  const downloadCertificate = async (eventId: string) => {
    setLoadingEventId(eventId);
    setErrorMessage(null);
    try {
      const response = await api.get(`/certificates/event/${eventId}`, {
        headers,
      });

      const image = response.data?.image;
      const filename = response.data?.filename || "certificat.png";
      if (!image) {
        throw new Error("Certificat introuvable.");
      }

      const link = document.createElement("a");
      link.href = image;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message;
      const detailedMessage = Array.isArray(apiMessage)
        ? apiMessage.join(" | ")
        : apiMessage;
      setErrorMessage(
        detailedMessage ||
          "Impossible de télécharger ce certificat pour le moment.",
      );
    } finally {
      setLoadingEventId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#D9E8D1] px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-[#436D75]">
            <ShieldCheck size={14} />
            Adhérent
          </div>
          <h1 className="mt-3 text-3xl font-black italic text-smart-teal">
            Mes certificats
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Retrouvez ici les certificats pour vos événements
          </p>
        </div>

        <Link
          to="/events"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#436D75] px-5 py-3 text-sm font-black text-white transition hover:bg-[#355963]"
        >
          <Sparkles size={16} />
          Participer aux événements
        </Link>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-[#E98A7D]/30 bg-[#FDE5E1] px-5 py-4 text-sm font-bold text-[#B23A2B]">
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-[30px] border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="animate-spin text-smart-teal" size={42} />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              Chargement de vos certificats...
            </p>
          </div>
        </div>
      ) : certificates.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-[#D6E5E8] bg-white p-8 shadow-sm">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-[#D9E8D1]/60 p-4 text-[#436D75]">
              <Award size={34} />
            </div>
            <h2 className="text-2xl font-black italic text-smart-teal">
              Aucun certificat disponible pour le moment
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Participez aux événements pour gagner vos certificats de
              participation.
            </p>
            <Link
              to="/events"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-black text-white transition hover:from-amber-600 hover:to-orange-600"
            >
              <CalendarDays size={16} />
              Voir les événements
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {certificates.map((certificate) => {
            const eventDate = new Date(certificate.date);
            const formattedDate = Number.isNaN(eventDate.getTime())
              ? certificate.date
              : eventDate.toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                });

            return (
              <div
                key={certificate.eventId}
                className="overflow-hidden rounded-[30px] border border-gray-100 bg-white shadow-sm"
              >
                <div className="bg-gradient-to-r from-smart-teal to-[#5d8b94] px-6 py-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                        Certificat disponible
                      </p>
                      <h3 className="mt-2 text-xl font-black italic">
                        {certificate.eventName}
                      </h3>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-3 py-2 text-right text-[10px] font-black uppercase tracking-widest text-white/80">
                      Présent
                      <div className="mt-1 text-[11px] normal-case tracking-normal text-white">
                        {certificate.present ? "Oui" : "Non"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
                    <div className="flex items-start gap-2 rounded-2xl bg-gray-50 p-3">
                      <Award size={18} className="mt-0.5 text-[#436D75]" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                          Club
                        </p>
                        <p className="font-bold text-gray-800">
                          {certificate.clubName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-2xl bg-gray-50 p-3">
                      <MapPin size={18} className="mt-0.5 text-[#436D75]" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                          Centre
                        </p>
                        <p className="font-bold text-gray-800">
                          {certificate.centerName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-2xl bg-gray-50 p-3">
                      <CalendarDays
                        size={18}
                        className="mt-0.5 text-[#436D75]"
                      />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                          Date de l'événement
                        </p>
                        <p className="font-bold text-gray-800">
                          {formattedDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-2xl bg-gray-50 p-3">
                      <Clock3 size={18} className="mt-0.5 text-[#436D75]" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                          Statut
                        </p>
                        <p className="font-bold text-gray-800">
                          {certificate.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#D6E5E8] bg-[#F8FCFD] p-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Téléchargement
                      </p>
                      <p className="text-sm font-bold text-[#203A43]">
                        Certificat de participation prêt à être téléchargé
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadCertificate(certificate.eventId)}
                      disabled={loadingEventId === certificate.eventId}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#E98A7D] px-4 py-3 text-sm font-black text-white transition hover:bg-[#d97768] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingEventId === certificate.eventId ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      Télécharger
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
