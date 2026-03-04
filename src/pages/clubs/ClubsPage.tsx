import { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  Plus,
  Trash2,
  Edit,
  X,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle2,
  Music,
  Cpu,
  Theater,
  Paintbrush,
  Users,
  Calendar,
  Building2,
  Activity,
} from "lucide-react";

const CATEGORIES = [
  { id: "Technologie", label: "Robotique & IT", icon: <Cpu size={18} /> },
  { id: "Art", label: "Théâtre & Cinéma", icon: <Theater size={18} /> },
  { id: "Musique", label: "Musique & Chant", icon: <Music size={18} /> },
  { id: "Peinture", label: "Arts Plastiques", icon: <Paintbrush size={18} /> },
];

export default function ClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [salles, setSalles] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    categorie: "",
    id_salle: "",
    id_coach: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [resClubs, resSalles, resUsers] = await Promise.all([
        api.get("/clubs", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/salles", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/users", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setClubs(resClubs.data);
      setSalles(resSalles.data);
      setCoaches(resUsers.data.filter((u: any) => u.role === "COACH"));
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (msg: string, type: "error" | "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await api.post("/clubs", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Si on arrive ici, c'est que le serveur a répondu 200 ou 201
      if (res.status === 201 || res.status === 200) {
        setIsModalOpen(false);
        fetchInitialData(); // On recharge la liste
        showAlert("Club créé avec succès ! ✨", "success");
      }
    } catch (err: any) {
      // ICI on attrape l'erreur (400, 500, etc.)
      console.error("Erreur création club:", err);
      showAlert(
        "Erreur : " + (err.response?.data?.message || "Données invalides"),
        "error",
      );
    }
  };

  const filteredClubs = clubs.filter(
    (c: any) =>
      c.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.categorie.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-10 relative pb-10">
      {/* 🔔 NOTIFICATION */}
      {notification && (
        <div
          className={`fixed top-10 right-10 z-[500] p-6 rounded-[30px] shadow-2xl animate-in slide-in-from-right-10 border border-white/20 backdrop-blur-md ${notification.type === "error" ? "bg-[#E98A7D] text-white" : "bg-smart-sage text-smart-teal"}`}
        >
          <div className="flex items-center space-x-3 font-black italic uppercase text-xs tracking-widest">
            {notification.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{notification.msg}</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-6">
        <div>
          <h1 className="text-7xl font-black text-smart-teal tracking-tighter italic leading-none">
            Clubs & Vie
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-4 ml-1">
            Activités socio-culturelles
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search
              className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300"
              size={22}
            />
            <input
              type="text"
              placeholder="Rechercher un club..."
              className="pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[30px] shadow-sm outline-none w-full md:w-[350px] font-bold text-sm focus:ring-4 focus:ring-smart-sage transition-all"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-smart-teal text-white p-5 rounded-[25px] font-black shadow-xl shadow-smart-teal/30 hover:bg-black transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={28} />
          </button>
        </div>
      </div>

      {/* LISTE DES CLUBS (Michelle Design) */}
      {isLoading ? (
        <div className="flex justify-center py-40">
          <Loader2 className="animate-spin text-smart-teal" size={50} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredClubs.map((club: any) => (
            <div
              key={club.id}
              className="bg-white rounded-[50px] p-10 shadow-sm border border-gray-50 flex flex-col justify-between group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-smart-bg p-5 rounded-[25px] text-smart-teal italic font-black text-xl shadow-inner border border-white">
                    {CATEGORIES.find((cat) => cat.id === club.categorie)
                      ?.icon || <Activity />}
                  </div>
                  <button
                    onClick={() => {
                      /* Delete logic */
                    }}
                    className="text-gray-200 hover:text-smart-salmon transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <h3 className="text-3xl font-black text-smart-teal tracking-tighter italic leading-none">
                  {club.nom}
                </h3>
                <span className="inline-block mt-3 bg-smart-sage/30 px-3 py-1 rounded-full text-smart-teal font-black text-[9px] uppercase tracking-widest">
                  {club.categorie}
                </span>

                <p className="text-gray-400 text-sm mt-6 font-medium leading-relaxed italic line-clamp-3">
                  {club.description ||
                    "Aucune description fournie pour ce club."}
                </p>
              </div>

              <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-smart-bg border-2 border-white shadow-sm flex items-center justify-center font-black text-[10px] text-smart-teal">
                    C
                  </div>
                  <span className="text-[10px] font-black text-smart-teal uppercase tracking-tighter">
                    {club.coach
                      ? `Animateur: ${club.coach.nom}`
                      : "Sans animateur"}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <Users size={14} />
                  <span className="text-xs font-black">
                    {club._count?.inscriptions || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🎨 MODAL AJOUT CLUB */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#1A1C1E]/60 backdrop-blur-md p-6">
          <div className="bg-[#F7F3E9] rounded-[60px] w-full max-w-xl p-12 shadow-2xl relative border-4 border-white animate-in zoom-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 text-gray-400 hover:text-black bg-white p-3 rounded-full shadow-sm"
            >
              <X size={20} />
            </button>
            <h2 className="text-4xl font-black text-smart-teal italic mb-2 tracking-tighter italic">
              Nouveau Club
            </h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase mb-8 tracking-widest italic leading-none">
              Création d'activité associative
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* CHAMP NOM */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4">
                  Nom du Club
                </label>
                <input
                  required
                  className="w-full p-5 bg-white rounded-[25px] font-black text-lg text-smart-teal outline-none shadow-sm"
                  placeholder="Ex: Club de Robotique..."
                  value={formData.nom} // 👈 IMPORTANT
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  } // 👈 IMPORTANT
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* CHAMP CATÉGORIE */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4">
                    Catégorie
                  </label>
                  <select
                    required
                    className="w-full p-5 bg-white rounded-[25px] font-bold text-sm text-smart-teal outline-none appearance-none cursor-pointer"
                    value={formData.categorie}
                    onChange={(e) =>
                      setFormData({ ...formData, categorie: e.target.value })
                    }
                  >
                    <option value="">Sélectionner...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CHAMP SALLE (CENTRE) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4">
                    Institution (Centre)
                  </label>
                  <select
                    required
                    className="w-full p-5 bg-white rounded-[25px] font-bold text-sm text-smart-teal outline-none appearance-none cursor-pointer"
                    value={formData.id_salle}
                    onChange={(e) =>
                      setFormData({ ...formData, id_salle: e.target.value })
                    }
                  >
                    <option value="">Choisir un centre...</option>
                    {salles.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CHAMP COACH */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4">
                  Animateur (Coach)
                </label>
                <select
                  className="w-full p-5 bg-white rounded-[25px] font-bold text-sm text-smart-teal outline-none appearance-none cursor-pointer"
                  value={formData.id_coach}
                  onChange={(e) =>
                    setFormData({ ...formData, id_coach: e.target.value })
                  }
                >
                  <option value="">Chercher un coach...</option>
                  {coaches.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.nom} {c.prenom}
                    </option>
                  ))}
                </select>
              </div>

              {/* CHAMP DESCRIPTION */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full p-6 bg-white rounded-[30px] font-bold text-sm text-smart-teal outline-none resize-none"
                  placeholder="Objectifs du club..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                className="w-full bg-smart-teal text-white py-6 rounded-[35px] font-black text-xl shadow-xl hover:bg-black transition-all active:scale-95"
              >
                ENREGISTRER LE CLUB
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
