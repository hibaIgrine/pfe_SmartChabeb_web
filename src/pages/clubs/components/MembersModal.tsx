import { X, Calendar, Search } from "lucide-react";
import { useState } from "react";

export const MembersModal = ({ club, onClose }: any) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!club) return null;

  const filteredInscriptions = (club.inscriptions || []).filter((ins: any) => {
    const term = searchTerm.toLowerCase();
    const nom = (ins.utilisateur.nom || "").toLowerCase();
    const prenom = (ins.utilisateur.prenom || "").toLowerCase();
    const email = (ins.utilisateur.email || "").toLowerCase();
    return nom.includes(term) || prenom.includes(term) || email.includes(term);
  });

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6">
      <div className="bg-[#F7F3E9] rounded-[60px] p-12 max-w-2xl w-full shadow-2xl border-4 border-white animate-in zoom-in relative flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 bg-white text-gray-400 p-2 rounded-full shadow-sm hover:text-black transition-all"
        >
          <X size={20} />
        </button>

        <h3 className="text-4xl font-black text-smart-teal tracking-tighter italic mb-1">
          Membres Inscrits
        </h3>
        <p className="text-gray-400 text-[10px] font-bold uppercase mb-8 tracking-widest italic">
          {club.nom}
        </p>

        {/* Barre de recherche */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-smart-teal/40" size={16} />
          <input
            type="text"
            placeholder="Rechercher un adhérent (nom, email)..."
            className="w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl outline-none font-bold text-sm text-smart-teal placeholder:text-gray-300 shadow-sm focus:ring-2 focus:ring-smart-teal/20 transition-all border border-gray-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Liste défilante */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {filteredInscriptions.length > 0 ? (
            filteredInscriptions.map((ins: any) => (
              <div
                key={ins.id}
                className="bg-white p-5 rounded-[35px] flex items-center justify-between border border-white shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center space-x-5">
                  <img
                    src={
                      ins.utilisateur.photo_profil_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${ins.utilisateur.email}`
                    }
                    className="w-14 h-14 rounded-[22px] bg-smart-bg border-2 border-white shadow-sm"
                    alt="avatar"
                  />
                  <div>
                    <p className="font-black text-smart-teal text-base leading-none italic">
                      {ins.utilisateur.nom} {ins.utilisateur.prenom}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tight">
                      {ins.utilisateur.email}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="bg-smart-sage/30 p-2 rounded-xl text-smart-teal mb-1">
                    <Calendar size={14} />
                  </div>
                  <span className="text-[9px] font-black text-gray-300 uppercase italic">
                    Depuis le {new Date(ins.date_adhesion).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center bg-white rounded-[35px] border border-dashed border-gray-200">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <Search className="text-gray-300" size={20} />
              </div>
              <p className="text-gray-400 font-bold text-sm">Aucun adhérent ne correspond.</p>
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="text-smart-teal text-xs font-black underline mt-2">
                  Effacer la recherche
                </button>
              )}
            </div>
          )}
        </div>

        {/* Résumé bas de page */}
        <div className="mt-10 p-8 bg-smart-teal rounded-[40px] text-white flex justify-between items-center shadow-xl shadow-smart-teal/20 relative overflow-hidden">
          <div className="z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">
              Capacité Actuelle
            </p>
            <p className="text-2xl font-black italic tracking-tight">
              Total Inscriptions
            </p>
          </div>
          <div className="z-10 bg-smart-salmon px-6 py-3 rounded-3xl font-black text-3xl shadow-lg border-2 border-white/20">
            {club.inscriptions?.length || 0}
          </div>
          <div className="absolute right-[-20px] top-[-20px] w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};
