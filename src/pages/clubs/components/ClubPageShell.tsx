import type { ReactNode } from "react";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ClubPageShellProps {
  title: string;
  subtitle: string;
  loading: boolean;
  error?: string;
  notification?: { msg: string; type: "success" | "error" } | null;
  children: ReactNode;
}

export const ClubPageShell = ({
  title,
  subtitle,
  loading,
  error,
  notification,
  children,
}: ClubPageShellProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-4 sm:px-6 lg:px-8">
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

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.35em] text-smart-teal"
      >
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="bg-white border border-gray-100 rounded-[40px] shadow-sm p-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-smart-teal" size={36} />
          </div>
        ) : error ? (
          <div className="text-center py-24 text-sm text-red-500">{error}</div>
        ) : (
          <>
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.45em] text-gray-400 font-black">
                {title}
              </p>
              <h1 className="text-4xl font-black text-smart-teal tracking-tight mt-3">
                {subtitle}
              </h1>
            </div>
            {children}
          </>
        )}
      </div>
    </div>
  );
};
