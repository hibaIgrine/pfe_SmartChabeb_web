import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import {
  ArrowLeft,
  PlusCircle,
  Loader2,
  History,
  Edit3,
  Clock,
} from "lucide-react";

export default function MemberDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMember(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🏆 FONCTION DATE CORRIGÉE (Heure de Tunisie)
  const formatDateTunisie = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Tunis", // 👈 Force l'heure tunisienne
    }).format(date);
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F3E9]">
        <Loader2 className="animate-spin text-smart-teal" size={60} />
      </div>
    );

  const programsHistory =
    member?.programmes_sportifs_programmes_sportifs_id_membreToutilisateurs ||
    [];
  const lastBio = member?.suivi_biometrique?.[0];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20 font-['Inter',sans-serif]">
      {/* HEADER RETOUR */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-400 font-black text-[10px] uppercase tracking-[0.4em] hover:text-smart-teal transition bg-white/50 p-4 px-8 rounded-full border border-white shadow-sm"
      >
        <ArrowLeft size={16} className="mr-3" /> Retour au staff
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="space-y-8">
          <div className="bg-white rounded-[60px] p-12 shadow-sm border border-gray-50 flex flex-col items-center text-center relative overflow-hidden">
            <img
              src={
                member.photo_profil_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.email}`
              }
              className="w-44 h-44 rounded-[55px] border-8 border-[#F7F3E9] shadow-2xl object-cover"
            />
            <h2 className="text-4xl font-black text-smart-teal mt-8 tracking-tighter italic leading-none">
              {member.prenom} <br /> {member.nom}
            </h2>
            <div className="mt-8 bg-smart-bg px-4 py-2 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
              {member.email}
            </div>
          </div>

          <button
            onClick={() => navigate(`/create-program/${member.id}`)}
            className={`w-full py-8 rounded-[45px] font-black text-xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 italic ${programsHistory.length > 0 ? "bg-smart-salmon text-white shadow-smart-salmon/30" : "bg-smart-teal text-white shadow-smart-teal/30"}`}
          >
            {programsHistory.length > 0 ? (
              <Edit3 size={28} />
            ) : (
              <PlusCircle size={28} />
            )}
            <span>
              {programsHistory.length > 0
                ? "AMÉLIORER LE PLAN"
                : "CRÉER UN PLAN"}
            </span>
          </button>
        </div>

        <div className="lg:col-span-2 space-y-10">
          {/* BIOMÉTRIE */}
          <div className="bg-[#1A1C1E] rounded-[60px] p-12 text-white relative overflow-hidden shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-8 italic">
              Facteurs Biométriques
            </p>
            <div className="grid grid-cols-3 gap-6 relative z-10">
              <div className="text-center">
                <p className="text-4xl font-black tracking-tighter">
                  {lastBio?.poids_kg || "--"}
                </p>
                <p className="text-[9px] font-bold uppercase text-white/20 tracking-widest mt-1 italic">
                  Poids
                </p>
              </div>
              <div className="text-center border-x border-white/5">
                <p className="text-4xl font-black tracking-tighter">
                  {lastBio?.taille_cm || "--"}
                </p>
                <p className="text-[9px] font-bold uppercase text-white/20 tracking-widest mt-1 italic">
                  Stature
                </p>
              </div>
              <div className="text-center bg-smart-sage/10 rounded-3xl p-2 border border-white/5">
                <p className="text-4xl font-black text-smart-sage tracking-tighter">
                  {lastBio?.imc || "--"}
                </p>
                <p className="text-[9px] font-black uppercase text-smart-sage/40 tracking-widest mt-1">
                  IMC
                </p>
              </div>
            </div>
          </div>

          {/* --- ⏳ TIMELINE DE TRACABILITÉ --- */}
          <div className="relative pl-12">
            <h3 className="text-3xl font-black text-smart-teal italic mb-12 tracking-tighter flex items-center">
              <History className="mr-4 text-smart-salmon" size={28} />{" "}
              Tracabilité des Entraînements
            </h3>

            <div className="absolute left-[19px] top-24 bottom-10 w-1 bg-gray-100 rounded-full"></div>

            <div className="space-y-12">
              {programsHistory.map((prog: any, index: number) => (
                <div
                  key={prog.id}
                  className="relative animate-in slide-in-from-bottom-4 duration-500"
                >
                  {/* Le Point (Rose pour le tout premier de la liste car c'est le plus récent) */}
                  <div
                    className={`absolute left-[-42px] top-4 w-6 h-6 rounded-full border-[5px] border-[#F7F3E9] z-10 ${index === 0 ? "bg-smart-salmon scale-125 shadow-xl shadow-smart-salmon/40" : "bg-gray-200"}`}
                  ></div>

                  <div
                    className={`bg-white rounded-[50px] p-10 shadow-sm border border-gray-50 transition-all ${index === 0 ? "ring-2 ring-smart-sage" : "opacity-60"}`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                      <div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${index === 0 ? "bg-smart-teal text-white shadow-lg" : "bg-gray-100 text-gray-400"}`}
                          >
                            {index === 0
                              ? "PROGRAMME ACTUEL"
                              : `VERSION ANTÉRIEURE`}
                          </span>
                          <div className="flex items-center text-[10px] font-bold text-smart-salmon space-x-1 uppercase">
                            <Clock size={12} />
                            {/* 🕒 Affiche la date à l'heure locale tunisienne */}
                            <span>{formatDateTunisie(prog.date_creation)}</span>
                          </div>
                        </div>
                        <h4 className="text-2xl font-black text-smart-teal mt-3 italic tracking-tight">
                          {prog.titre_programme}
                        </h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prog.details_exercices.map((exo: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center space-x-4 bg-[#F7F3E9]/40 p-4 rounded-2xl border border-white"
                        >
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-smart-teal shadow-sm">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-bold text-smart-teal text-sm leading-none">
                              {exo.nom}
                            </p>
                            <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-widest">
                              {exo.series} Séries • {exo.reps} Reps
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
