import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Mail, Lock, User, ArrowRight, ChevronLeft } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    mot_de_passe: "",
    nom: "",
    prenom: "",
  });
  const navigate = useNavigate();

  // --- LIAISON BACKEND RÉTABLIE ET SÉCURISÉE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Si isLogin est vrai -> /auth/login, sinon -> /users (inscription)
      const url = isLogin ? "/auth/login" : "/users";
      const payload = isLogin
        ? { email: formData.email, mot_de_passe: formData.mot_de_passe }
        : {
            nom: formData.nom,
            email: formData.email,
            mot_de_passe: formData.mot_de_passe,
            role: "ADMIN",
          };

      const res = await api.post(url, payload);

      if (isLogin) {
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      } else {
        alert("Compte créé avec succès ! Connectez-vous maintenant.");
        setIsLogin(true); // Bascule automatiquement vers la connexion
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#F7F3E9] flex items-center justify-center p-4 overflow-hidden font-sans relative">
      {/* BOUTON ACCUEIL */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 z-50 flex items-center space-x-2 text-smart-teal font-black text-[10px] uppercase tracking-widest bg-white p-3 px-5 rounded-full shadow-lg cursor-pointer border border-gray-100"
      >
        <ChevronLeft size={14} /> <span>Accueil</span>
      </button>

      {/* CONTENEUR PRINCIPAL */}
      <div className="relative w-full max-w-6xl h-[80vh] bg-white rounded-[60px] shadow-2xl overflow-hidden flex z-10 border border-white">
        {/* PANNEAU BLEU GLISSANT (Photo + Message) */}
        <div
          className={`absolute top-0 bottom-0 w-1/2 bg-[#436d75] transition-all duration-700 ease-in-out z-40 hidden md:flex flex-col items-center justify-center p-12 text-white
          ${isLogin ? "left-1/2 rounded-tl-[100px] rounded-bl-[100px]" : "left-0 rounded-tr-[100px] rounded-br-[100px]"}`}
        >
          <div className="absolute inset-0 opacity-40">
            <img
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80"
              className="w-full h-full object-cover"
              alt="Gym"
            />
          </div>
          <div className="relative z-10 text-center">
            <h2 className="text-5xl font-black italic tracking-tighter mb-4">
              {isLogin ? "Bienvenue !" : "Bon retour !"}
            </h2>
            <p className="text-white/80 font-medium mb-8">
              {isLogin
                ? "Commencez à gérer vos centres."
                : "Accédez à vos outils administratifs."}
            </p>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="px-10 py-4 border-2 border-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-smart-teal transition-all cursor-pointer"
            >
              {isLogin ? "Créer un compte" : "Se connecter"}
            </button>
          </div>
        </div>

        {/* SECTION FORMULAIRE (CORRIGÉE : LARGE ET VISIBLE) */}
        <div
          className={`w-full md:w-1/2 h-full flex flex-col justify-center px-12 md:px-20 transition-all duration-700 ${isLogin ? "md:mr-[50%]" : "md:ml-[50%]"}`}
        >
          <div className="mb-10">
            <h2 className="text-5xl font-black text-[#436d75] tracking-tighter italic">
              {isLogin ? "Connexion" : "Inscription"}
            </h2>
            <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase mt-1">
              SmartChabeb Admin • v2.0
            </p>
          </div>

          {/* LE FORMULAIRE RECONNECTÉ AU BACKEND */}
          <form onSubmit={handleSubmit} className="space-y-5 w-full">
            {!isLogin && (
              <div className="flex items-center bg-gray-50 border border-gray-100 rounded-[22px] p-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#D9E8D1] transition-all">
                <div className="w-12 h-12 bg-white rounded-[18px] flex items-center justify-center shadow-sm text-gray-300">
                  <User size={20} />
                </div>
                <input
                  required
                  type="text"
                  placeholder="Nom complet"
                  className="flex-1 px-4 bg-transparent outline-none font-bold text-gray-700"
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                />
              </div>
            )}

            <div className="flex items-center bg-gray-50 border border-gray-100 rounded-[22px] p-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#D9E8D1] transition-all">
              <div className="w-12 h-12 bg-white rounded-[18px] flex items-center justify-center shadow-sm text-gray-300">
                <Mail size={20} />
              </div>
              <input
                required
                type="email"
                placeholder="Email institutionnel"
                className="flex-1 px-4 bg-transparent outline-none font-bold text-gray-700"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="flex items-center bg-gray-50 border border-gray-100 rounded-[22px] p-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#D9E8D1] transition-all">
              <div className="w-12 h-12 bg-white rounded-[18px] flex items-center justify-center shadow-sm text-gray-300">
                <Lock size={20} />
              </div>
              <input
                required
                type="password"
                placeholder="Mot de passe"
                className="flex-1 px-4 bg-transparent outline-none font-bold text-gray-700"
                onChange={(e) =>
                  setFormData({ ...formData, mot_de_passe: e.target.value })
                }
              />
            </div>

            {/* BOUTON D'ACTION VISIBLE ET LARGE */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-16 bg-[#436d75] text-white rounded-[22px] font-black text-lg shadow-xl flex items-center justify-center group hover:bg-black transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Vérification..." : "Confirmer l'accès"}
                <ArrowRight
                  className="ml-3 group-hover:translate-x-1 transition-transform"
                  size={20}
                />
              </button>
            </div>
          </form>

          {/* Footer Soft */}
          <div className="mt-12 opacity-20 flex items-center space-x-2 grayscale">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg"
              className="h-3"
              alt="TN"
            />
            <span className="text-[8px] font-black uppercase tracking-widest">
              République Tunisienne
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
