import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { ROUTES, getLandingPathForRole } from "../../constants/routes";
import { getStoredRole } from "../../utils/authSession";

function getAuthorizedHome(role: string | null) {
  return getLandingPathForRole(role) || ROUTES.club.home;
}

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const role = getStoredRole();
  const homePath = getAuthorizedHome(role);

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden p-8">
      {/* Blobs décoratifs */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#D9E8D1] opacity-70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#E98A7D] opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-10 h-40 w-40 rounded-full bg-[#436D75] opacity-5 blur-2xl" />

      {/* Points flottants */}
      <span className="pointer-events-none absolute left-[12%] top-[18%] h-3 w-3 rounded-full bg-[#E98A7D] opacity-50" />
      <span className="pointer-events-none absolute left-[30%] top-[8%] h-2 w-2 rounded-full bg-[#436D75] opacity-30" />
      <span className="pointer-events-none absolute bottom-[15%] right-[12%] h-4 w-4 rounded-full bg-[#D9E8D1] opacity-60" />
      <span className="pointer-events-none absolute bottom-[25%] left-[8%] h-2 w-2 rounded-full bg-[#436D75] opacity-20" />
      <span className="pointer-events-none absolute right-[20%] top-[30%] h-3 w-3 rounded-full bg-[#E98A7D] opacity-40" />

      {/* Contenu centré */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">

        {/* Illustration cadenas */}
        <div className="relative mb-8 flex flex-col items-center">
          {/* Anneau du cadenas */}
          <div className="mb-[-6px] h-14 w-20 rounded-t-full border-[10px] border-[#436D75] border-b-transparent" />
          {/* Corps du cadenas */}
          <div className="relative flex h-24 w-32 items-center justify-center rounded-[24px] bg-[#436D75] shadow-2xl shadow-[#436D75]/40">
            {/* Trou de serrure */}
            <div className="flex flex-col items-center">
              <div className="h-7 w-7 rounded-full bg-white/20" />
              <div className="-mt-2 h-5 w-3.5 rounded-b-xl bg-white/20" />
            </div>
            {/* Brillance */}
            <div className="absolute left-3 top-3 h-2 w-6 rounded-full bg-white/15" />
          </div>

          {/* Étoiles décoratives */}
          <span className="absolute -right-5 -top-2 text-2xl text-[#E98A7D]">✦</span>
          <span className="absolute -left-7 bottom-4 text-xl text-[#D9E8D1]">✦</span>
          <span className="absolute -right-8 bottom-0 text-sm text-[#436D75]/30">✦</span>
        </div>

        {/* Badge */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#E98A7D]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.35em] text-[#E98A7D]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E98A7D]" />
          Accès restreint
        </div>

        {/* Titre */}
        <h1 className="mb-4 text-4xl font-black leading-tight tracking-tight text-[#436D75] sm:text-5xl">
          Oups !<br />
          <span className="text-[#E98A7D]">Zone réservée</span>
        </h1>

        {/* Message friendly */}
        <p className="mb-8 max-w-xs text-sm leading-7 text-slate-400">
          Tu t'es aventuré dans un espace qui ne t'est pas destiné. Retourne vers ton espace habituel !
        </p>

        {/* Boutons */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#436D75]/15 bg-white px-6 py-3 text-sm font-black text-[#436D75] shadow-sm transition-all hover:border-[#436D75]/30 hover:shadow-md active:scale-[0.97]"
          >
            <ArrowLeft size={15} />
            Retour
          </button>
          <button
            type="button"
            onClick={() => navigate(homePath, { replace: true })}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#436D75] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#436D75]/25 transition-all hover:bg-[#E98A7D] active:scale-[0.97]"
          >
            <Home size={15} />
            Mon espace
          </button>
        </div>

        {/* Branding discret */}
        <p className="mt-10 text-[9px] font-black uppercase tracking-[0.5em] text-[#436D75]/20">
          Smart<span className="text-[#E98A7D]/30">Chabeb</span>
        </p>
      </div>
    </div>
  );
}
