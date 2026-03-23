import {
  X,
  Users2,
  Dumbbell,
  MapPin,
  Phone,
  ShieldAlert,
  Building2,
  Calendar,
  Edit3,
} from "lucide-react";

export const CentreQuickView = ({ isOpen, onClose, centre, onEdit }: any) => {
  if (!isOpen || !centre) return null;

  return (
    <div className="fixed inset-0 z-[1500] bg-[#1A1C1E]/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-500">
      {/* Conteneur Principal Full Screen */}
      <div className="bg-[#F7F3E9] w-full h-full max-w-7xl rounded-[60px] shadow-2xl border-4 border-white relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        {/* 1. Header de la Page Detail */}
        <div className="p-8 md:p-12 flex justify-between items-center border-b border-white/50">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-smart-teal text-white rounded-[22px] flex items-center justify-center shadow-lg italic font-black text-3xl">
              {centre.nom[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-4xl font-black text-smart-teal tracking-tighter italic leading-none">
                Fiche Établissement
              </h2>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">
                Registre National SmartChabeb • ID: {centre.id.slice(0, 8)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-4 bg-white text-gray-400 hover:text-black rounded-full shadow-sm hover:rotate-90 transition-all active:scale-90"
          >
            <X size={28} />
          </button>
        </div>

        {/* 2. Corps de la page en 2 colonnes */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Colonne Gauche : Identité & Localisation */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white p-10 rounded-[50px] shadow-sm border border-white">
                <h3 className="text-2xl font-black text-smart-teal mb-6 italic tracking-tight">
                  {centre.nom}
                </h3>

                <div className="space-y-6">
                  <InfoItem
                    icon={<MapPin size={18} />}
                    label="Région / Gouvernorat"
                    value={centre.gouvernorat}
                  />
                  <InfoItem
                    icon={<Building2 size={18} />}
                    label="Délégation"
                    value={centre.delegation || "Non renseignée"}
                  />
                  <InfoItem
                    icon={<Phone size={18} />}
                    label="Contact Téléphonique"
                    value={centre.telephone_centre || "Aucun contact"}
                  />
                  <InfoItem
                    icon={<Calendar size={18} />}
                    label="Date d'affiliation"
                    value={new Date(centre.date_creation).toLocaleDateString()}
                  />
                </div>
              </div>

              {/* Bloc Adresse */}
              <div className="p-8 bg-smart-teal text-white rounded-[40px] shadow-lg shadow-smart-teal/20 relative overflow-hidden">
                <p className="text-[10px] font-black uppercase opacity-50 mb-3 tracking-widest">
                  Localisation Physique
                </p>
                <p className="text-sm font-bold leading-relaxed italic relative z-10">
                  {centre.adresse ||
                    "L'adresse précise n'a pas encore été renseignée dans le système."}
                </p>
                <MapPin className="absolute -bottom-4 -right-4 size-24 opacity-10 rotate-12" />
              </div>
            </div>

            {/* Colonne Droite : Statistiques & Alertes */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                  icon={<Users2 size={28} />}
                  val={centre._count?.utilisateurs || 0}
                  label="Adhérents Rattachés"
                  sub="Citoyens actifs"
                />
                <StatCard
                  icon={<Dumbbell size={28} />}
                  val={centre._count?.equipements || 0}
                  label="Unités de Matériel"
                  sub="Inventaire physique"
                />
              </div>

              {/* Zone Alerte Maintenance */}
              <div className="bg-[#E98A7D]/10 p-10 rounded-[50px] flex flex-col md:flex-row items-center gap-8 border-2 border-dashed border-[#E98A7D]/30">
                <div className="bg-smart-salmon p-6 rounded-3xl text-white shadow-xl animate-pulse">
                  <ShieldAlert size={40} />
                </div>
                <div className="text-center md:text-left">
                  <h4 className="text-xl font-black text-smart-salmon uppercase tracking-tighter italic">
                    Vigilance Infrastructure
                  </h4>
                  <p className="text-sm text-smart-salmon/80 font-medium mt-2 max-w-md">
                    Le dernier audit suggère une vérification périodique des
                    équipements de ce centre. Assurez-vous que les registres de
                    sécurité sont à jour.
                  </p>
                </div>
              </div>

              {/* Boutons d'actions rapides en bas de page */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => {
                    onClose();
                    onEdit(centre);
                  }}
                  className="flex-1 bg-smart-teal text-white py-6 rounded-[30px] font-black text-xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-4"
                >
                  <Edit3 size={24} /> ÉDITER LES INFORMATIONS
                </button>
                <button
                  onClick={onClose}
                  className="px-10 bg-white text-smart-teal border-2 border-smart-teal/10 rounded-[30px] font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer style Registre */}
        <div className="bg-white/50 p-4 text-center border-t border-white">
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[1em]">
            SmartChabeb Management System v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

// --- SOUS-COMPOSANTS POUR LA CLARTÉ ---

const InfoItem = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-4">
    <div className="text-smart-salmon opacity-40">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
        {label}
      </p>
      <p className="text-sm font-black text-smart-teal italic">{value}</p>
    </div>
  </div>
);

const StatCard = ({ icon, val, label, sub }: any) => (
  <div className="bg-white p-8 rounded-[45px] shadow-sm border border-white flex items-center gap-6 group hover:shadow-xl transition-all duration-500">
    <div className="bg-smart-bg p-5 rounded-2xl text-smart-teal shadow-inner group-hover:scale-110 transition-transform duration-500">
      {icon}
    </div>
    <div>
      <div className="flex items-baseline gap-1">
        <p className="text-5xl font-black text-smart-teal italic tracking-tighter">
          {val}
        </p>
        <p className="text-xs font-bold text-gray-300 uppercase">Unités</p>
      </div>
      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">
        {label}
      </p>
      <p className="text-[8px] font-bold text-smart-salmon/60 uppercase italic">
        {sub}
      </p>
    </div>
  </div>
);
