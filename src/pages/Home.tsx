import { useNavigate } from "react-router-dom";
import { Smartphone, Zap, MapPin, ArrowRight } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <div className="min-h-screen bg-smart-bg font-sans text-smart-text flex flex-col">
      {/* NAVIGATION */}
      <nav className="px-10 py-6 flex justify-between items-center bg-transparent">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-smart-teal rounded-xl flex items-center justify-center text-white font-black shadow-lg">
            S
          </div>
          <span className="text-xl font-black tracking-tighter text-smart-teal uppercase">
            SmartChabeb
          </span>
        </div>

        <button
          onClick={() => navigate(isLoggedIn ? "/dashboard" : "/auth")}
          className="bg-white px-8 py-3 rounded-full font-black shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer flex items-center space-x-2 text-smart-teal"
        >
          <span>{isLoggedIn ? "Mon Espace Admin" : "Se connecter"}</span>
          <ArrowRight size={18} />
        </button>
      </nav>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 max-w-7xl mx-auto px-10 flex flex-col justify-center py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="inline-flex items-center space-x-2 bg-smart-sage px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-smart-teal">
              <Zap size={14} fill="currentColor" />
              <span>Innovation Étatique</span>
            </div>
            <h1 className="text-8xl font-black leading-[0.85] tracking-tighter text-smart-teal">
              L'énergie au <br />{" "}
              <span className="text-smart-salmon italic">sommet</span>.
            </h1>
            <p className="text-lg text-gray-500 font-medium max-w-md">
              Gérez les centres de jeunesse avec l'intelligence de demain. Une
              plateforme robuste pour les administrateurs et les coaches.
            </p>
          </div>

          <div className="bg-white p-12 rounded-[60px] shadow-2xl flex flex-col items-center text-center space-y-6 border border-white relative overflow-hidden group">
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-smart-sage rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-1000"></div>
            <Smartphone size={80} className="text-smart-teal relative z-10" />
            <h2 className="text-3xl font-black tracking-tight text-smart-teal relative z-10">
              Espace Adhérent
            </h2>
            <p className="font-medium text-gray-400 italic relative z-10">
              L'aventure des jeunes commence sur l'application mobile.
            </p>
            <div className="bg-smart-teal text-white w-full py-5 rounded-3xl font-black shadow-lg shadow-smart-teal/30 cursor-pointer hover:bg-black transition-all relative z-10 active:scale-95">
              Découvrir l'App Android
            </div>
          </div>
        </div>
      </main>

      {/* 🇹🇳 FOOTER OFFICIEL (Correction demandée) */}
      <footer className="px-10 py-12 bg-white/30 backdrop-blur-md border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo République */}
          <div className="flex items-center space-x-5">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg"
              className="h-10 rounded-md shadow-md border-2 border-white"
              alt="Drapeau Tunisie"
            />
            <div className="text-left">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">
                République Tunisienne
              </p>
              <p className="text-sm font-black text-smart-teal">
                Ministère de la Jeunesse et des Sports
              </p>
            </div>
          </div>

          {/* Copyright & Info */}
          <div className="flex flex-col items-center md:items-end">
            <div className="flex space-x-6 mb-2 text-gray-300">
              <MapPin size={20} />
              <Zap size={20} />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              © 2026 SmartChabeb Platform • Développé par Hiba Allah
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
