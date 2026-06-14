/**
 * NotFound.tsx — Page 404 "Page introuvable".
 *
 * RÔLE :
 *   Affichée par la route wildcard `*` dans App.tsx quand aucune route ne correspond.
 *   Design animé avec fantôme Ghost (lucide) et blobs décoratifs.
 *
 * NAVIGATION :
 *   Bouton "Retour"   → navigate(-1)
 *   Bouton "Accueil"  → navigate("/")
 */
import { useNavigate } from "react-router-dom";
import { Home, Ghost, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full bg-smart-bg flex items-center justify-center p-6 overflow-hidden font-sans relative">
      {/* ÉLÉMENTS DÉCORATIFS FLOTTANTS */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-smart-sage rounded-full blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-64 h-64 bg-smart-salmon rounded-full blur-3xl opacity-30 animate-bounce duration-[3000ms]"></div>

      <main className="relative z-10 text-center space-y-8 max-w-lg">
        {/* L'ILLUSTRATION CUTE */}
        <div className="relative inline-block">
          <div className="text-[180px] font-black text-smart-teal/10 leading-none tracking-tighter">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Ghost size={100} className="text-smart-teal animate-bounce" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black text-smart-teal tracking-tighter">
            Oups ! Le centre est{" "}
            <span className="text-smart-salmon italic">introuvable</span>.
          </h1>
          <p className="text-gray-500 font-medium italic px-10">
            Il semble que cette route n'existe pas dans le réseau SmartChabeb.
            Peut-être que le coach l'a déplacée ?
          </p>
        </div>

        {/* BOUTON RETOUR DESIGN */}
        <div className="pt-6">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center space-x-3 bg-smart-teal text-white px-10 py-5 rounded-[30px] font-black text-lg shadow-2xl shadow-smart-teal/20 hover:bg-black transition-all active:scale-95 group"
          >
            <Home size={20} />
            <span>Retourner à l'accueil</span>
          </button>
        </div>

        {/* PETIT LIEN DISCRET */}
        <div className="pt-4">
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-smart-salmon transition-colors flex items-center justify-center mx-auto space-x-2"
          >
            <ArrowLeft size={14} />
            <span>Page précédente</span>
          </button>
        </div>
      </main>

      {/* FOOTER DISCRET */}
      <div className="absolute bottom-10 opacity-20 flex items-center space-x-2 grayscale">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg"
          className="h-4"
          alt="TN"
        />
        <span className="text-[9px] font-black uppercase tracking-widest">
          SmartChabeb Platform
        </span>
      </div>
    </div>
  );
}
