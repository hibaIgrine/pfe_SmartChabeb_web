import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../../api/axios";
import { Mail, Lock, ChevronLeft } from "lucide-react";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    mot_de_passe: "",
  });

  const [signupData, setSignupData] = useState({
    email: "",
    mot_de_passe: "",
    nom: "",
    prenom: "",
  });

  const navigate = useNavigate();

  // --- LOGIN HANDLER ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email: loginData.email,
        mot_de_passe: loginData.mot_de_passe,
      });

      const user = res.data.user;
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || "Identifiants incorrects";
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- SIGNUP HANDLER ---
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First check email availability
      const checkRes = await api.post("/users/check-email", {
        email: signupData.email,
      });

      if (!checkRes.data.available) {
        alert("Cet email est déjà utilisé");
        setIsLoading(false);
        return;
      }

      // Send verification code
      await api.post("/auth/send-verification-code", {
        email: signupData.email,
      });

      // Store signup data for wizard
      localStorage.setItem("pendingSignup", JSON.stringify(signupData));
      navigate("/auth/signup");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  // --- GOOGLE LOGIN HANDLER (local) ---
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/google-login", {
        token: credentialResponse.credential,
      });
      const user = res.data.user;
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(user));
      const needsProfile =
        res.data.needs_profile ||
        !user.prenom ||
        !user.id_centre ||
        !user.centreId;
      if (needsProfile) navigate("/auth/complete-google");
      else navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Erreur Google");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#F7F3E9] flex items-center justify-center p-4 overflow-hidden font-sans">
      {/* HOME BUTTON */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 z-50 flex items-center space-x-2 text-[#436d75] font-black text-[10px] uppercase tracking-widest bg-white p-3 px-5 rounded-full shadow-lg cursor-pointer border border-gray-200 hover:bg-gray-50 transition-all"
      >
        <ChevronLeft size={14} /> <span>Accueil</span>
      </button>

      {/* CARD CONTAINER */}
      <div className="relative w-full max-w-6xl h-[82vh] bg-white rounded-[50px] shadow-2xl overflow-hidden">
        {/* GRID LAYOUT - FLIP ANIMATED COLUMNS */}
        <div
          className={`relative w-full h-full flex transition-all duration-500 ${isSignUp ? "flex-row-reverse" : ""}`}
        >
          {/* LEFT COLUMN */}
          <div
            className={`w-1/2 h-full flex flex-col items-center justify-center p-12 relative overflow-hidden transition-all duration-500`}
          >
            {/* Image + button on left for both login and signup */}
            {!isSignUp ? (
              <>
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src="https://images.unsplash.com/photo-1552674605-5defe6aa44bb?q=80&w=1000"
                    className="w-full h-full object-cover"
                    alt="Jeunes culturels"
                  />
                  <div className="absolute inset-0 bg-black/30"></div>
                </div>

                <div className="relative z-10 text-center text-white">
                  <h2 className="text-5xl font-black italic tracking-tighter mb-4">
                    Bienvenue !
                  </h2>
                  <p className="text-white/80 font-medium mb-8 max-w-xs">
                    Rejoignez SmartChabeb et découvrez l'univers des maisons des
                    jeunes
                  </p>
                  <button
                    onClick={() => setIsSignUp(true)}
                    className="px-10 py-4 border-2 border-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-[#436d75] transition-all cursor-pointer"
                  >
                    S'inscrire
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src="https://images.unsplash.com/photo-1517457373614-b7152f800fd1?q=80&w=1000"
                    className="w-full h-full object-cover"
                    alt="Jeunes SmartChabeb"
                  />
                  <div className="absolute inset-0 bg-black/30"></div>
                </div>
                <div className="relative z-10 text-center text-white">
                  <h2 className="text-5xl font-black italic tracking-tighter mb-4">
                    Rejoignez-nous !
                  </h2>
                  <p className="text-white/80 font-medium mb-8 max-w-xs">
                    Connectez-vous à la communauté des maisons des jeunes
                  </p>
                  <button
                    onClick={() => setIsSignUp(false)}
                    className="px-10 py-4 border-2 border-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-[#436d75] transition-all cursor-pointer"
                  >
                    Se connecter
                  </button>
                </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div
            className={`w-1/2 h-full flex flex-col justify-center px-12 transition-all duration-500 items-center`}
          >
            {/* Formulaire on right for both login and signup */}
            {isSignUp ? (
              <div className="relative z-10 w-full max-w-md bg-white rounded-[20px] p-6 shadow-lg">
                <h2 className="text-3xl font-black text-[#436d75] mb-1">
                  Inscription
                </h2>
                <p className="text-sm text-gray-500 mb-3">SmartChabeb • v2.0</p>
                <div className="mb-3 rounded-2xl bg-gray-100 p-4 border border-gray-200 flex flex-col items-center">
                  <p className="text-sm font-semibold leading-6 text-gray-700 text-center">
                    Créez votre compte pour accéder aux activités, aux
                    événements et à la communauté SmartChabeb.
                  </p>
                </div>
                <form onSubmit={handleSignupSubmit} className="space-y-3">
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3">
                    <Mail size={20} className="text-gray-400 mr-3" />
                    <input
                      required
                      type="email"
                      placeholder="Email"
                      className="flex-1 bg-transparent outline-none"
                      value={signupData.email}
                      onChange={(e) =>
                        setSignupData({ ...signupData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3">
                    <Lock size={20} className="text-gray-400 mr-3" />
                    <input
                      required
                      type="password"
                      placeholder="Mot de passe"
                      className="flex-1 bg-transparent outline-none"
                      value={signupData.mot_de_passe}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          mot_de_passe: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      type="text"
                      placeholder="Nom"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3 outline-none"
                      value={signupData.nom}
                      onChange={(e) =>
                        setSignupData({ ...signupData, nom: e.target.value })
                      }
                    />
                    <input
                      required
                      type="text"
                      placeholder="Prénom"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3 outline-none"
                      value={signupData.prenom}
                      onChange={(e) =>
                        setSignupData({ ...signupData, prenom: e.target.value })
                      }
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-[#436d75] text-white rounded-2xl font-bold"
                  >
                    {isLoading ? "Envoi..." : "Continuer"}
                  </button>
                </form>
                <div className="flex items-center my-2">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="px-3 text-xs text-gray-400 uppercase">
                    OU
                  </span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                <div className="flex justify-center mb-1">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => alert("Erreur Google")}
                    text="signup_with"
                  />
                </div>
              </div>
            ) : (
              <div className="relative z-10 w-full max-w-md bg-white rounded-[20px] p-6 shadow-lg">
                <h2 className="text-3xl font-black text-[#436d75] mb-1">
                  Connexion
                </h2>
                <p className="text-sm text-gray-500 mb-3">SmartChabeb • v2.0</p>
                <div className="mb-3 rounded-2xl bg-gray-100 p-4 border border-gray-200 flex flex-col items-center">
                  <p className="text-sm font-semibold leading-6 text-gray-700 text-center">
                    Welcome back, connectez-vous pour continuer votre parcours
                    et retrouver vos activités.
                  </p>
                </div>
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3">
                    <Mail size={20} className="text-gray-400 mr-3" />
                    <input
                      required
                      type="email"
                      placeholder="Email"
                      className="flex-1 bg-transparent outline-none"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-3">
                    <Lock size={20} className="text-gray-400 mr-3" />
                    <input
                      required
                      type="password"
                      placeholder="Mot de passe"
                      className="flex-1 bg-transparent outline-none"
                      value={loginData.mot_de_passe}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          mot_de_passe: e.target.value,
                        })
                      }
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-[#436d75] text-white rounded-2xl font-bold"
                  >
                    {isLoading ? "Vérification..." : "Connexion"}
                  </button>
                </form>
                <div className="flex items-center my-2">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="px-3 text-xs text-gray-400 uppercase">
                    OU
                  </span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                <div className="flex justify-center mb-1">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => alert("Erreur Google")}
                    text="signin_with"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-25 flex items-center space-x-2 grayscale">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg"
          className="h-3"
          alt="TN"
        />
        <span className="text-[7px] font-black uppercase tracking-widest text-gray-700">
          République Tunisienne
        </span>
      </div>
    </div>
  );
}
