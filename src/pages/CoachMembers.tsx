import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import {
  Users2,
  Search,
  Loader2,
  Plus,
  Eye,
  Activity,
  Award,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export default function CoachMembers() {
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const userMe = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchEleves();
  }, []);

  const fetchEleves = async () => {
    setLoading(true);
    try {
      // Le backend filtrera auto par salle grâce au rôle COACH du Token
      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEleves(res.data);
    } catch (err) {
      console.error("Erreur chargement élèves");
    } finally {
      setLoading(false);
    }
  };

  const filtered = eleves.filter((m: any) =>
    (m.nom + m.prenom + m.email).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-10">
      {/* 1. HEADER PERSONNALISÉ COACH */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6 pt-6">
        <div>
          <h1 className="text-7xl font-black text-smart-teal tracking-tighter italic leading-none">
            Mes Élèves
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.5em] mt-4 ml-1 italic">
            Coach : {userMe.nom} {userMe.prenom}
          </p>
        </div>

        <div className="relative group">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-smart-teal"
            size={22}
          />
          <input
            type="text"
            placeholder="Rechercher un élève..."
            className="pl-14 pr-8 py-5 bg-white border border-gray-100 rounded-full shadow-sm outline-none w-96 font-bold text-sm focus:ring-4 focus:ring-smart-sage transition-all text-smart-teal"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 2. STATS COACH (Bento Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-smart-sage p-8 rounded-[50px] border border-white flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-black uppercase text-smart-teal/40 tracking-widest">
              Effectif total
            </p>
            <h3 className="text-6xl font-black text-smart-teal tracking-tighter mt-2">
              {eleves.length}
            </h3>
          </div>
          <Users2 size={45} className="text-smart-teal opacity-20" />
        </div>

        <div className="bg-white p-8 rounded-[50px] border border-gray-50 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-black uppercase text-gray-300 tracking-widest leading-none">
              Programmes
            </p>
            <h3 className="text-6xl font-black text-smart-salmon tracking-tighter mt-2">
              {
                eleves.filter(
                  (m: any) =>
                    m._count
                      ?.programmes_sportifs_programmes_sportifs_id_membreToutilisateurs >
                    0,
                ).length
              }
            </h3>
          </div>
          <Award size={45} className="text-smart-salmon opacity-20" />
        </div>

        <div className="bg-white p-8 rounded-[50px] border border-gray-50 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-black uppercase text-gray-300 tracking-widest">
              Activité
            </p>
            <h3 className="text-2xl font-black text-smart-teal tracking-tighter mt-3 italic">
              Salle active
            </h3>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle2 size={24} className="text-green-500" />
          </div>
        </div>
      </div>

      {/* 3. LISTE DES ÉLÈVES (Michelle Design) */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-smart-teal" size={50} />
          </div>
        ) : (
          filtered.map((m: any) => (
            <div
              key={m.id}
              className="bg-white p-8 rounded-[55px] shadow-sm border border-gray-50 flex flex-col lg:flex-row items-center justify-between group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            >
              <div className="flex items-center space-x-8">
                <div className="relative">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.email}`}
                    className="w-20 h-20 rounded-[35px] bg-smart-bg border-4 border-white shadow-lg group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute -top-2 -right-2 bg-smart-salmon text-white p-2 rounded-xl shadow-lg rotate-12">
                    <Activity size={14} />
                  </div>
                </div>
                <div>
                  <h4 className="text-3xl font-black text-smart-teal tracking-tighter italic leading-none">
                    {m.nom} {m.prenom}
                  </h4>
                  <div className="flex items-center space-x-3 mt-3">
                    <div className="bg-smart-bg px-3 py-1 rounded-full text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      {m.email}
                    </div>
                    <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                    <span className="text-[10px] font-black text-smart-salmon">
                      ADHERENT
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Santé de l'élève */}
              <div className="flex space-x-12 my-8 lg:my-0 border-y lg:border-none border-gray-50 py-4 lg:py-0 w-full lg:w-auto justify-center">
                <div className="text-center">
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1 italic">
                    Indice Bio
                  </p>
                  <p className="text-2xl font-black text-smart-teal tracking-tighter italic leading-none">
                    {m.suivi_biometrique?.[0]?.imc || "--"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1 italic">
                    Dernière Séance
                  </p>
                  <p className="text-sm font-black text-smart-teal italic leading-none mt-2 flex items-center justify-center">
                    <Calendar size={14} className="mr-1 opacity-40" /> Récente
                  </p>
                </div>
              </div>

              {/* BOUTON ACTION COACH */}
              <div className="flex items-center space-x-3">
                <button className="p-5 bg-smart-bg text-smart-teal rounded-[25px] hover:bg-smart-teal hover:text-white transition-all shadow-sm">
                  <Eye size={22} />
                </button>
                <button
                  onClick={() => navigate(`/create-program/${m.id}`)}
                  className="bg-smart-teal text-white px-8 py-5 rounded-[30px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-smart-teal/20 flex items-center space-x-3 hover:bg-black transition-all active:scale-95"
                >
                  <Plus size={18} />
                  <span>Créer Programme</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, val, label, color }: any) {
  return (
    <div
      className={`${color} p-7 rounded-[40px] border border-white flex items-center space-x-5 shadow-sm`}
    >
      <div className="bg-white/40 p-4 rounded-2xl text-smart-teal">{icon}</div>
      <div>
        <p className="text-3xl font-black text-smart-teal leading-none tracking-tighter italic">
          {val}
        </p>
        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mt-1">
          {label}
        </p>
      </div>
    </div>
  );
}
