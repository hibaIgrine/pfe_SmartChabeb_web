import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap, MapPin, Building2, Users } from "lucide-react";
import { getCurrentRoleLandingPath, ROUTES } from "../../constants/routes";

function YoungPeopleIllustration() {
  return (
    <svg
      viewBox="0 0 520 400"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <style>{`
          .sv-jump  { animation: svJump  2.8s ease-in-out infinite; transform-origin: 260px 380px; }
          .sv-fa    { animation: svFloat 4.2s ease-in-out infinite; }
          .sv-fb    { animation: svFloat 5.1s ease-in-out infinite 0.9s; }
          .sv-fc    { animation: svFloat 3.6s ease-in-out infinite 1.6s; }
          .sv-fd    { animation: svFloat 4.8s ease-in-out infinite 0.4s; }
          .sv-spin  { animation: svSpin  8s linear infinite; transform-box: fill-box; transform-origin: center; }
          @keyframes svJump {
            0%,100%{ transform:translateY(0); }
            45%    { transform:translateY(-18px); }
          }
          @keyframes svFloat {
            0%,100%{ transform:translateY(0); }
            50%    { transform:translateY(-9px); }
          }
          @keyframes svSpin {
            from { transform:rotate(0deg); }
            to   { transform:rotate(360deg); }
          }
        `}</style>
      </defs>

      {/* ── fond cercles ── */}
      <circle cx="260" cy="205" r="220" fill="#436D75" opacity="0.05"/>
      <circle cx="260" cy="205" r="175" fill="#D9E8D1" opacity="0.28"/>

      {/* ══════════════ PERSONNAGE 1 – Gauche – lit un livre ══════════════ */}
      <g transform="translate(105,190)">
        {/* cheveux */}
        <ellipse cx="0" cy="-63" rx="22" ry="12" fill="#3B1F0C" opacity="0.8"/>
        {/* tête */}
        <circle cx="0" cy="-48" r="23" fill="#E8C09A"/>
        {/* corps teal */}
        <path d="M-21,-22 C-23,8 -20,46 -17,52 L17,52 C20,46 23,8 21,-22 Z" fill="#436D75"/>
        {/* bras gauche → livre */}
        <path d="M-21,-12 Q-46,2 -44,24" stroke="#E8C09A" strokeWidth="12" strokeLinecap="round" fill="none"/>
        {/* bras droit */}
        <path d="M21,-12 Q32,4 28,22" stroke="#E8C09A" strokeWidth="12" strokeLinecap="round" fill="none"/>
        {/* livre */}
        <rect x="-59" y="14" width="26" height="32" rx="4" fill="#E98A7D"/>
        <line x1="-46" y1="18" x2="-46" y2="42" stroke="white" strokeWidth="1.5" opacity="0.55"/>
        {/* jambes */}
        <rect x="-15" y="50" width="13" height="35" rx="6" fill="#2B4E55"/>
        <rect x="3"   y="50" width="13" height="35" rx="6" fill="#2B4E55"/>
        {/* ombres pieds */}
        <ellipse cx="0" cy="88" rx="20" ry="5" fill="#436D75" opacity="0.13"/>
      </g>

      {/* ══════════════ PERSONNAGE 2 – Centre – saute ══════════════ */}
      <g className="sv-jump">
        {/* cheveux */}
        <ellipse cx="260" cy="122" rx="25" ry="13" fill="#5C2F10" opacity="0.8"/>
        {/* tête */}
        <circle cx="260" cy="136" r="25" fill="#C8854A"/>
        {/* corps salmon */}
        <path d="M238,162 C236,196 239,234 242,240 L278,240 C281,234 284,196 282,162 Z" fill="#E98A7D"/>
        {/* bras gauche levé */}
        <path d="M238,172 Q212,155 208,130" stroke="#C8854A" strokeWidth="13" strokeLinecap="round" fill="none"/>
        {/* bras droit levé */}
        <path d="M282,172 Q308,155 312,130" stroke="#C8854A" strokeWidth="13" strokeLinecap="round" fill="none"/>
        {/* jambes écartées saut */}
        <path d="M248,238 Q238,262 228,278" stroke="#B5614A" strokeWidth="14" strokeLinecap="round" fill="none"/>
        <path d="M272,238 Q282,262 292,278" stroke="#B5614A" strokeWidth="14" strokeLinecap="round" fill="none"/>
        {/* ombre */}
        <ellipse cx="260" cy="285" rx="25" ry="6" fill="#436D75" opacity="0.12"/>
      </g>

      {/* ══════════════ PERSONNAGE 3 – Droite – sport ══════════════ */}
      <g transform="translate(390,188)">
        {/* cheveux */}
        <ellipse cx="0" cy="-63" rx="21" ry="11" fill="#150606" opacity="0.8"/>
        {/* tête */}
        <circle cx="0" cy="-48" r="22" fill="#D49568"/>
        {/* corps vert sauge */}
        <path d="M-20,-22 C-22,8 -19,46 -16,52 L16,52 C19,46 22,8 20,-22 Z" fill="#7BAF8E"/>
        {/* bras droit vers ballon */}
        <path d="M20,-12 Q44,-2 50,16" stroke="#D49568" strokeWidth="12" strokeLinecap="round" fill="none"/>
        {/* bras gauche */}
        <path d="M-20,-12 Q-34,6 -30,24" stroke="#D49568" strokeWidth="12" strokeLinecap="round" fill="none"/>
        {/* jambes */}
        <rect x="-15" y="50" width="13" height="35" rx="6" fill="#4A6E5A"/>
        <rect x="3"   y="50" width="13" height="35" rx="6" fill="#4A6E5A"/>
        <ellipse cx="0" cy="88" rx="20" ry="5" fill="#436D75" opacity="0.13"/>
      </g>

      {/* ballon de foot (tourne) */}
      <g className="sv-spin">
        <circle cx="395" cy="238" r="16" fill="white" stroke="#333" strokeWidth="1.5"/>
        <path d="M395,222 L388,230 L389,240 L401,240 L402,230 Z" fill="#333" opacity="0.75"/>
        <path d="M382,232 L388,230" stroke="#333" strokeWidth="1.2"/>
        <path d="M402,230 L408,232" stroke="#333" strokeWidth="1.2"/>
        <path d="M389,240 L387,247" stroke="#333" strokeWidth="1.2"/>
        <path d="M401,240 L403,247" stroke="#333" strokeWidth="1.2"/>
      </g>

      {/* ── éléments flottants ── */}

      {/* étoile rose haut gauche */}
      <g className="sv-fa" transform="translate(42,88)">
        <polygon points="12,0 14.5,8.5 23,8.5 16.5,14 19,22.5 12,17 5,22.5 7.5,14 1,8.5 9.5,8.5"
          fill="#E98A7D" opacity="0.9"/>
      </g>
      {/* étoile teal haut droit */}
      <g className="sv-fb" transform="translate(458,65)">
        <polygon points="10,0 12,7 20,7 14,11.5 16,19 10,14.5 4,19 6,11.5 0,7 8,7"
          fill="#436D75" opacity="0.7"/>
      </g>
      {/* cœur gauche milieu */}
      <g className="sv-fc" transform="translate(42,190)">
        <path d="M11,4C11,4 13,0 17,0C21,0 23,4 23,7C23,13 17,19 11,23C5,19 -1,13 -1,7C-1,4 1,0 5,0C9,0 11,4 11,4Z"
          fill="#E98A7D" opacity="0.65"/>
      </g>
      {/* note de musique */}
      <g className="sv-fd" transform="translate(462,168)">
        <text fontSize="30" fill="#436D75" opacity="0.7" fontFamily="serif">♪</text>
      </g>
      {/* trophée */}
      <g className="sv-fb" transform="translate(455,288)">
        <text fontSize="26" opacity="0.8">🏆</text>
      </g>
      {/* sparkle haut centre */}
      <g className="sv-fc" transform="translate(340,40)">
        <line x1="8" y1="0"  x2="8" y2="16" stroke="#436D75" strokeWidth="2.5" strokeLinecap="round" opacity="0.45"/>
        <line x1="0" y1="8"  x2="16" y2="8" stroke="#436D75" strokeWidth="2.5" strokeLinecap="round" opacity="0.45"/>
        <line x1="2" y1="2"  x2="14" y2="14" stroke="#436D75" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
        <line x1="14" y1="2" x2="2"  y2="14" stroke="#436D75" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
      </g>
      {/* petit cercle bas gauche */}
      <g className="sv-fa" transform="translate(30,295)">
        <circle cx="10" cy="10" r="10" fill="#D9E8D1" stroke="#436D75" strokeWidth="2" opacity="0.8"/>
      </g>
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <div className="h-screen w-full font-sans flex flex-col overflow-hidden">
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0    rgba(67,109,117,0.35); }
          70%  { box-shadow: 0 0 0 18px rgba(67,109,117,0);   }
          100% { box-shadow: 0 0 0 0    rgba(67,109,117,0);   }
        }
        .fu0 { animation: fadeUp 0.65s ease-out both; }
        .fu1 { animation: fadeUp 0.65s ease-out 0.15s both; }
        .fu2 { animation: fadeUp 0.65s ease-out 0.30s both; }
        .fu3 { animation: fadeUp 0.65s ease-out 0.45s both; }
        .pulse-ring { animation: pulseRing 2.5s ease-out infinite; }
      `}</style>

      {/* ═══════ NAVBAR ═══════ */}
      <nav className="flex-shrink-0 bg-[#436D75] flex items-center justify-between px-12 xl:px-20 py-4 shadow-lg">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg"
              className="h-8 rounded-md shadow border border-white/25"
              alt="Tunisie"
            />
            <div className="leading-none">
              <p className="text-[8px] font-black uppercase tracking-[0.35em] text-white/45">
                République Tunisienne
              </p>
              <p className="text-[12px] font-black text-white leading-none mt-1">
                Ministère de la Jeunesse et des Sports
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <p className="text-[17px] font-black tracking-tighter uppercase text-white">
            Smart<span className="text-[#E98A7D]">Chabeb</span>
          </p>
        </div>

        <button
          onClick={() =>
            navigate(isLoggedIn ? getCurrentRoleLandingPath() : ROUTES.public.auth)
          }
          className="cursor-pointer flex items-center gap-2 bg-[#E98A7D] hover:bg-white hover:text-[#436D75] text-white px-6 py-2.5 rounded-full font-black text-sm shadow-md transition-all active:scale-95"
        >
          {isLoggedIn ? "Mon Espace" : "Se connecter"}
          <ArrowRight size={15} />
        </button>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <main className="flex-1 bg-[#F7F3E9] relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-[#D9E8D1]/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-[#E98A7D]/10 blur-3xl" />

        <div className="relative z-10 w-full h-full px-12 xl:px-20 grid grid-cols-2 gap-6">

          {/* Gauche — texte, remplit toute la hauteur */}
          <div className="h-full flex flex-col justify-between py-8">

            {/* Haut */}
            <div className="space-y-5">
              <div className="fu0 inline-flex items-center gap-2 bg-[#D9E8D1] rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#436D75]">
                <Zap size={11} fill="currentColor" />
                Plateforme Nationale · 2026
              </div>

              <h1 className="fu1 text-[50px] xl:text-[60px] font-black leading-[0.85] tracking-tighter text-[#436D75]">
                Bienvenue<br />
                dans les<br />
                <span className="text-[#E98A7D] italic">Maisons</span><br />
                des Jeunes.
              </h1>

              <p className="fu2 text-[14px] font-medium text-gray-500 leading-relaxed">
                La plateforme digitale unifiée pour les centres de jeunesse
                tunisiens — clubs, événements, réservations et activités, tout
                en un seul endroit.
              </p>
            </div>

            {/* Milieu — CTA + stats */}
            <div className="fu3 flex flex-col gap-4">
              <button
                onClick={() =>
                  navigate(isLoggedIn ? getCurrentRoleLandingPath() : ROUTES.public.auth)
                }
                className="pulse-ring cursor-pointer w-fit inline-flex items-center gap-3 bg-[#436D75] hover:bg-black text-white px-9 py-4 rounded-full font-black text-[15px] shadow-xl transition-all active:scale-95"
              >
                {isLoggedIn ? "Accéder à mon espace" : "Accéder à la plateforme"}
                <ArrowRight size={18} />
              </button>

              <div className="flex items-center gap-3">
                {[
                  { icon: <MapPin size={12} />,    label: "24 Gouvernorats" },
                  { icon: <Building2 size={12} />, label: "300+ Centres" },
                  { icon: <Users size={12} />,     label: "50 000+ Jeunes" },
                ].map((s) => (
                  <span
                    key={s.label}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3.5 py-2 text-[11px] font-bold text-gray-500 shadow-sm"
                  >
                    <span className="text-[#436D75]">{s.icon}</span>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Bas — activités proposées */}
            <div className="fu3 space-y-2">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                Activités disponibles —
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "⚽ Football",     bg: "bg-emerald-50  text-emerald-700  border-emerald-100" },
                  { label: "🎵 Musique",      bg: "bg-violet-50   text-violet-700   border-violet-100"  },
                  { label: "🎨 Arts plastiques", bg: "bg-[#E98A7D]/10 text-[#B55A50]  border-[#E98A7D]/20" },
                  { label: "💻 Informatique", bg: "bg-[#436D75]/10 text-[#436D75]   border-[#436D75]/20" },
                  { label: "🎭 Théâtre",      bg: "bg-amber-50    text-amber-700    border-amber-100"   },
                  { label: "🤸 Gymnastique",  bg: "bg-pink-50     text-pink-700     border-pink-100"    },
                  { label: "📚 Bibliothèque", bg: "bg-[#D9E8D1]   text-[#436D75]   border-[#D9E8D1]"   },
                ].map((a) => (
                  <span
                    key={a.label}
                    className={`inline-flex items-center border rounded-full px-3 py-1.5 text-[11px] font-bold ${a.bg}`}
                  >
                    {a.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Droite — illustration SVG animée (légèrement réduite) */}
          <div className="h-full w-full flex items-center py-4">
            <div className="w-full h-[88%]">
              <YoungPeopleIllustration />
            </div>
          </div>
        </div>
      </main>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="flex-shrink-0 flex items-center justify-center border-t border-[#E8E0D0]/80 bg-[#F7F3E9] px-12 xl:px-20 py-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-[#436D75]">
          Smart<span className="text-[#E98A7D]">Chabeb</span> · © 2026
        </p>
      </footer>
    </div>
  );
}
