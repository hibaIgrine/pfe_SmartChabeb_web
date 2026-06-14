/**
 * CertificateModal.tsx — Modale d'aperçu et téléchargement de certificat de participation.
 *
 * RÔLE :
 *   Affiche le certificat généré côté serveur (image base64) et
 *   permet à l'adhérent de le télécharger en PNG.
 *
 * PROPS :
 *   imageBase64    — Image du certificat encodée en base64 (PNG)
 *   filename       — Nom du fichier téléchargé (ex: "certificat_evenement.png")
 *   participantName— Nom du participant affiché dans la modale
 *
 * API : GET /events/:id/certificate (génère le certificat côté serveur)
 */
import { Download, X, Loader2 } from "lucide-react";

type Props = {
  isOpen: boolean;
  isLoading: boolean;
  imageBase64?: string;
  filename?: string;
  participantName?: string;
  eventName?: string;
  onClose: () => void;
};

export default function CertificateModal({
  isOpen,
  isLoading,
  imageBase64,
  filename,
  participantName,
  eventName,
  onClose,
}: Props) {
  if (!isOpen) return null;

  const downloadCertificate = () => {
    if (!imageBase64 || !filename) return;

    // Créer un lien de téléchargement
    const link = document.createElement("a");
    link.href = imageBase64;
    link.download = filename || "certificat.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-[30px] border border-gray-100 shadow-2xl overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-smart-teal to-smart-teal/80">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80">
              🎓 Votre Certificat de Participation
            </p>
            <h3 className="text-xl font-black italic text-white">
              {eventName || "Événement"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition"
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto flex flex-col items-center gap-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-smart-teal" size={48} />
              <p className="text-sm uppercase font-black tracking-widest text-gray-400">
                Génération de votre certificat...
              </p>
              <p className="text-xs text-gray-500">
                Cela peut prendre quelques secondes
              </p>
            </div>
          ) : imageBase64 ? (
            <>
              <div className="w-full max-w-2xl rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                <img
                  src={imageBase64}
                  alt="Certificat de participation"
                  className="w-full h-auto"
                />
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  ✅ Certificat généré pour{" "}
                  <strong className="text-smart-teal">{participantName}</strong>
                </p>
                <p className="text-xs text-gray-500">
                  Événement :{" "}
                  <strong className="text-gray-700">{eventName}</strong>
                </p>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={downloadCertificate}
                  className="flex items-center gap-2 px-6 py-3 bg-smart-teal text-white rounded-xl font-black text-sm hover:bg-smart-teal/90 transition shadow-md"
                >
                  <Download size={18} />
                  Télécharger le certificat
                </button>

                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-black text-sm hover:bg-gray-200 transition"
                >
                  Fermer
                </button>
              </div>
            </>
          ) : (
            <div className="py-16 text-center space-y-3">
              <p className="text-base font-black text-gray-600">
                ⚠️ Erreur de génération
              </p>
              <p className="text-sm text-gray-500">
                Impossible de générer votre certificat. Veuillez réessayer.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-black text-sm hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
