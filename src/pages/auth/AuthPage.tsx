import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../../api/axios";
import { Mail, Lock, ChevronLeft, Eye, EyeOff } from "lucide-react";

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
  const [signupErrors, setSignupErrors] = useState({
    nom: "",
    prenom: "",
    email: "",
    mot_de_passe: "",
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Forgot password flow state
  const [forgotActive, setForgotActive] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Verification modal for signup
  const [verifyActive, setVerifyActive] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

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

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateSignupField = (
    field: keyof typeof signupData,
    value: string,
  ) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return "Champ obligatoire";
    }

    if (field === "email" && !emailPattern.test(trimmed)) {
      return "Format email invalide";
    }

    if (field === "mot_de_passe" && value.length < 8) {
      return "8 caractères minimum";
    }

    return "";
  };

  const updateSignupField = (field: keyof typeof signupData, value: string) => {
    setSignupData((previous) => ({ ...previous, [field]: value }));
    setSignupErrors((previous) => ({
      ...previous,
      [field]: validateSignupField(field, value),
    }));
  };

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

    const nextErrors = {
      nom: validateSignupField("nom", signupData.nom),
      prenom: validateSignupField("prenom", signupData.prenom),
      email: validateSignupField("email", signupData.email),
      mot_de_passe: validateSignupField(
        "mot_de_passe",
        signupData.mot_de_passe,
      ),
    };

    setSignupErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      showNotice("Veuillez corriger les champs en rouge.", "error");
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

      // Send verification code and open verification modal
      const sendRes = await api.post("/auth/send-verification-code", {
        email: signupData.email,
        nom: signupData.nom,
        prenom: signupData.prenom,
        mot_de_passe: signupData.mot_de_passe,
      });

      // Persist pending signup for the wizard
      localStorage.setItem("pendingSignup", JSON.stringify(signupData));

      // Open verification modal pre-filled with the email from the form
      setVerificationEmail(signupData.email);
      setVerifyActive(true);

      // In development the backend returns the code and also logs it; we optionally log it client-side too
      if (sendRes?.data?._code) {
        if (import.meta.env.DEV) {
          console.log(
            "[dev] verification code (server response):",
            sendRes.data._code,
          );
        }
      }
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
  const handleGoogleSuccess = async (
    credentialResponse: any,
    mode: "signin" | "signup",
  ) => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/google-login", {
        token: credentialResponse.credential,
      });
      const user = res.data.user;
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(user));

      if (mode === "signup" && res.data.needs_profile) {
        navigate("/auth/complete-google");
        return;
      }

      navigate("/dashboard");
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
    setShowResetPassword(false);
    setShowConfirmPassword(false);
  };

  const closeVerifyModal = () => {
    setVerifyActive(false);
    setVerificationToken("");
    setVerificationEmail("");
  };

  const handleVerifySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verificationToken || verificationToken.length !== 6) {
      showNotice("Code invalide (6 chiffres requis)", "error");
      return;
    }
    setIsLoading(true);
    try {
      // Verify against users endpoint so the DB gets updated (est_verifie)
      await api.post("/users/verify", {
        email: verificationEmail,
        code: verificationToken,
      });
      showNotice("Email vérifié — complétez votre profil.", "success");
      setVerifyActive(false);
      // Proceed to the signup wizard where pendingSignup is stored
      navigate("/auth/signup");
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Code incorrect";
      showNotice(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const inputErrorClass = (hasError: boolean) =>
    hasError
      ? "border-rose-500 bg-rose-50 focus-within:border-rose-600"
      : "border-gray-200 bg-gray-50";

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
            className={`w-1/2 h-full flex flex-col items-center justify-center p-12 relative overflow-hidden transition-all duration-500 bg-gradient-to-br from-[#436d75] via-[#3b6168] to-[#2f4a50]`}
          >
            {/* Image + button on left for both login and signup */}
            {!isSignUp ? (
              <>
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,232,209,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_30%)]" />
                  <div className="absolute inset-0 bg-black/10" />
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
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,232,209,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_30%)]" />
                  <div className="absolute inset-0 bg-black/10" />
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <input
                        required
                        type="text"
                        placeholder="Nom"
                        className={`w-full rounded-2xl border p-3 outline-none transition-colors ${inputErrorClass(Boolean(signupErrors.nom))}`}
                        value={signupData.nom}
                        onChange={(e) =>
                          updateSignupField("nom", e.target.value)
                        }
                      />
                      {signupErrors.nom && (
                        <p className="text-xs font-semibold text-rose-600">
                          {signupErrors.nom}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <input
                        required
                        type="text"
                        placeholder="Prénom"
                        className={`w-full rounded-2xl border p-3 outline-none transition-colors ${inputErrorClass(Boolean(signupErrors.prenom))}`}
                        value={signupData.prenom}
                        onChange={(e) =>
                          updateSignupField("prenom", e.target.value)
                        }
                      />
                      {signupErrors.prenom && (
                        <p className="text-xs font-semibold text-rose-600">
                          {signupErrors.prenom}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div
                      className={`flex items-center rounded-2xl border p-3 transition-colors ${inputErrorClass(Boolean(signupErrors.email))}`}
                    >
                      <Mail size={20} className="text-gray-400 mr-3" />
                      <input
                        required
                        type="email"
                        placeholder="Email"
                        className="flex-1 bg-transparent outline-none"
                        value={signupData.email}
                        onChange={(e) =>
                          updateSignupField("email", e.target.value)
                        }
                      />
                    </div>
                    {signupErrors.email && (
                      <p className="text-xs font-semibold text-rose-600">
                        {signupErrors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div
                      className={`flex items-center rounded-2xl border p-3 transition-colors ${inputErrorClass(Boolean(signupErrors.mot_de_passe))}`}
                    >
                      <Lock size={20} className="text-gray-400 mr-3" />
                      <input
                        required
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Mot de passe"
                        className="flex-1 bg-transparent outline-none"
                        value={signupData.mot_de_passe}
                        onChange={(e) =>
                          updateSignupField("mot_de_passe", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword((value) => !value)}
                        className="ml-3 text-gray-400 hover:text-gray-700"
                        aria-label={
                          showSignupPassword
                            ? "Masquer le mot de passe"
                            : "Afficher le mot de passe"
                        }
                      >
                        {showSignupPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    {signupErrors.mot_de_passe && (
                      <p className="text-xs font-semibold text-rose-600">
                        {signupErrors.mot_de_passe}
                      </p>
                    )}
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
                    onSuccess={(credentialResponse) =>
                      handleGoogleSuccess(credentialResponse, "signup")
                    }
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
                      type={showLoginPassword ? "text" : "password"}
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
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((value) => !value)}
                      className="ml-3 text-gray-400 hover:text-gray-700"
                      aria-label={
                        showLoginPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                    >
                      {showLoginPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
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
                    onSuccess={(credentialResponse) =>
                      handleGoogleSuccess(credentialResponse, "signin")
                    }
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
                type={showResetPassword ? "text" : "password"}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 outline-none"
              />
              <div className="flex items-center justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => setShowResetPassword((value) => !value)}
                  className="text-xs font-bold text-[#436d75] underline"
                >
                  {showResetPassword ? "Masquer" : "Afficher"} le mot de passe
                </button>
              </div>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
                type={showConfirmPassword ? "text" : "password"}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 outline-none"
              />
              <div className="flex items-center justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="text-xs font-bold text-[#436d75] underline"
                >
                  {showConfirmPassword ? "Masquer" : "Afficher"} la confirmation
                </button>
              </div>
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

      {verifyActive && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-black text-[#436d75]">
                  Vérifier votre email
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Nous avons envoyé un code à votre adresse. Entrez-le ici pour
                  continuer.
                </p>
              </div>
              <button
                type="button"
                onClick={closeVerifyModal}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
                Le code est envoyé à{" "}
                <span className="font-bold text-[#436d75]">
                  {verificationEmail}
                </span>
              </div>
              <input
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                placeholder="Code de vérification (6 chiffres)"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 outline-none"
                inputMode="numeric"
                maxLength={6}
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleVerifySubmit}
                  className="flex-1 h-12 bg-[#436d75] text-white rounded-2xl font-bold"
                >
                  {isLoading ? "..." : "Vérifier"}
                </button>
                <button
                  type="button"
                  onClick={closeVerifyModal}
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
