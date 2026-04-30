import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../../api/axios";
import { Mail, Lock, ChevronLeft } from "lucide-react";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

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
  // Forgot password flow state
  const [forgotActive, setForgotActive] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const showNotice = (
    message: string,
    type: "success" | "error" | "info" = "error",
  ) => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    setNotice({ message, type });
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimerRef.current = null;
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

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
      showNotice(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- SIGNUP HANDLER ---
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (signupData.mot_de_passe.length < 8) {
      showNotice(
        "Le mot de passe doit contenir au moins 8 caractères.",
        "error",
      );
      setIsLoading(false);
      return;
    }

    try {
      // First check email availability
      const checkRes = await api.post("/users/check-email", {
        email: signupData.email,
      });

      if (!checkRes.data.available) {
        showNotice("Cet email est déjà utilisé", "error");
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
      showNotice(
        err.response?.data?.message || "Erreur lors de l'inscription",
        "error",
      );
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
      showNotice(err.response?.data?.message || "Erreur Google", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- FORGOT PASSWORD ---
  const handleForgotClick = async () => {
    if (!loginData.email) {
      showNotice(
        "Veuillez saisir votre adresse email pour recevoir le code.",
        "error",
      );
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: loginData.email });
      showNotice(
        "Code de réinitialisation envoyé par email. Vérifiez votre boîte.",
        "success",
      );
      setForgotActive(true);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Erreur lors de la demande";
      showNotice(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resetToken || resetToken.length !== 6) {
      showNotice("Code invalide (6 chiffres requis)", "error");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showNotice(
        "Le mot de passe doit contenir au moins 8 caractères.",
        "error",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotice("Les mots de passe ne correspondent pas.", "error");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: loginData.email,
        token: resetToken,
        newPassword,
      });
      showNotice(
        "Mot de passe réinitialisé avec succès. Connectez-vous.",
        "success",
      );
      setForgotActive(false);
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Code incorrect ou expiré";
      showNotice(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const closeForgotModal = () => {
    setForgotActive(false);
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="h-screen w-full bg-[#F7F3E9] flex items-center justify-center p-4 overflow-hidden font-sans">
      {notice && (
        <div className="fixed top-5 left-1/2 z-[60] w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-white/60 px-4 py-3 shadow-2xl backdrop-blur-md">
          <div
            className={`flex items-start gap-3 rounded-xl px-4 py-3 ${
              notice.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : notice.type === "info"
                  ? "bg-sky-50 text-sky-900 border border-sky-200"
                  : "bg-rose-50 text-rose-900 border border-rose-200"
            }`}
          >
            <div className="min-w-2 mt-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  notice.type === "success"
                    ? "bg-emerald-500"
                    : notice.type === "info"
                      ? "bg-sky-500"
                      : "bg-rose-500"
                }`}
              />
            </div>
            <p className="text-sm font-semibold leading-6">{notice.message}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="ml-auto text-xs font-bold uppercase tracking-widest opacity-70 hover:opacity-100"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
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
                    onError={() => showNotice("Erreur Google", "error")}
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
                  <div className="text-right text-xs mt-1">
                    <button
                      type="button"
                      onClick={handleForgotClick}
                      className="text-[#436d75] font-bold underline"
                    >
                      Mot de passe oublié ?
                    </button>
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
                    onError={() => showNotice("Erreur Google", "error")}
                    text="signin_with"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {forgotActive && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-black text-[#436d75]">
                  Réinitialiser le mot de passe
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Entrez le code reçu par email puis choisissez un nouveau mot
                  de passe.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForgotModal}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
                Le code est envoyé à{" "}
                <span className="font-bold text-[#436d75]">
                  {loginData.email}
                </span>
              </div>
              <input
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Code (6 chiffres)"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 outline-none"
                inputMode="numeric"
                maxLength={6}
              />
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe (8 caractères ou plus)"
                type="password"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 outline-none"
              />
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
                type="password"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 outline-none"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetSubmit}
                  className="flex-1 h-12 bg-[#436d75] text-white rounded-2xl font-bold"
                >
                  {isLoading ? "..." : "Réinitialiser"}
                </button>
                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="flex-1 h-12 border border-gray-200 rounded-2xl font-bold text-gray-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
