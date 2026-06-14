/**
 * ClubPageShell.tsx — Enveloppe de mise en page commune à toutes les pages club.
 *
 * RÔLE :
 *   Layout wrapper partagé entre les pages du module clubs :
 *   bouton retour, titre, sous-titre, spinner chargement, notification toast.
 *
 * PROPS :
 *   title, subtitle  — Entête de la page
 *   loading          — Affiche un Loader2 spinner centré
 *   error            — Message d'erreur rouge (AlertCircle)
 *   notification     — Toast succès/erreur (disparaît après 3s)
 *   children         — Contenu principal de la page
 */
import type { ReactNode } from "react";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ClubPageShellProps {
  title: string;
  subtitle: string;
  loading: boolean;
  error?: string;
  notification?: { msg: string; type: "success" | "error" } | null;
  hideLabel?: boolean;
  children: ReactNode;
}

export const ClubPageShell = ({
  title,
  subtitle,
  loading,
  error,
  notification,
  hideLabel = false,
  children,
}: ClubPageShellProps) => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col">
      {notification && (
        <div
          className={`fixed top-6 right-6 z-[1000] rounded-2xl border px-5 py-4 font-black text-sm shadow-2xl ${
            notification.type === "success"
              ? "bg-green-50 text-green-700 border-green-100"
              : "bg-red-50 text-red-700 border-red-100"
          }`}
        >
          <span className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            {notification.msg}
          </span>
        </div>
      )}

      <div className="flex-1 bg-white border border-gray-100 rounded-[40px] shadow-sm p-6 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-smart-teal" size={36} />
          </div>
        ) : error ? (
          <div className="text-center py-24 text-sm text-red-500">{error}</div>
        ) : (
          <>
            <div className="mb-8 flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-[#F7F3E9] text-smart-teal hover:bg-smart-teal hover:text-white transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                {!hideLabel && (
                  <p className="text-sm uppercase tracking-[0.45em] text-gray-400 font-black">
                    {title}
                  </p>
                )}
                <h1 className={`text-4xl font-black text-smart-teal tracking-tight ${!hideLabel ? "mt-3" : ""}`}>
                  {subtitle}
                </h1>
              </div>
            </div>
            {children}
          </>
        )}
      </div>
    </div>
  );
};
