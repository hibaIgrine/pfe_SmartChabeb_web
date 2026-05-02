import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { ChevronLeft, Mail } from "lucide-react";

export default function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Email verification phase
  const [emailVerificationStep, setEmailVerificationStep] = useState<
    "email" | "code"
  >("email");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  // Wizard phase
  const [wizardStep, setWizardStep] = useState(0);
  const [gouvernorats, setGouvernorats] = useState<string[]>([]);
  const [centres, setCentres] = useState<Array<any>>([]);
  const [selectedGouv, setSelectedGouv] = useState("");

  const [form, setForm] = useState({
    email: "",
    mot_de_passe: "",
    nom: "",
    prenom: "",
    genre: "",
    date_naissance: "",
    centreId: "",
  });

  useEffect(() => {
    // Preload gouvernorats
    api
      .get("/centres")
      .then((r) => {
        const items = r.data || [];
        const gouvs: string[] = Array.from(
          new Set(items.map((c: any) => c.gouvernorat).filter(Boolean)),
        ).sort() as string[];
        setGouvernorats(gouvs);
      })
      .catch(() => setGouvernorats([]));
  }, []);

  // If user came from the signup form and we stored pendingSignup, prefill and jump to wizard
  useEffect(() => {
    try {
      const pending = localStorage.getItem("pendingSignup");
      if (pending) {
        const parsed = JSON.parse(pending);
        setForm((f) => ({
          ...f,
          email: parsed.email || "",
          mot_de_passe: parsed.mot_de_passe || "",
          nom: parsed.nom || "",
          prenom: parsed.prenom || "",
        }));
        // Skip email verification and go directly to wizard step 1
        setWizardStep(1);
        setEmailVerificationStep("code");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const fetchCentresByGouv = async (gouv: string) => {
    setCentres([]);
    try {
      const res = await api.get(
        `/centres${gouv ? `?gouvernorat=${encodeURIComponent(gouv)}` : ""}`,
      );
      setCentres(res.data || []);
    } catch (e) {
      setCentres([]);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // ========== EMAIL VERIFICATION ==========
  const handleSendVerificationEmail = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!email.trim()) newErrors.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Email invalide";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // First check if email already exists
      const checkRes = await api.post("/users/check-email", { email });
      if (!checkRes.data.available) {
        setErrors({ email: "Cet email est déjà utilisé" });
        setLoading(false);
        return;
      }

      // Send verification code
      await api.post("/auth/send-verification-code", { email });
      setForm({ ...form, email });
      setEmailVerificationStep("code");
    } catch (err: any) {
      console.error(err);
      setErrors({
        email: err.response?.data?.message || "Erreur lors de l'envoi du code",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!verificationCode.trim())
      newErrors.code = "Le code de vérification est requis";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Verify using users endpoint so DB flag is updated
      await api.post("/users/verify", {
        email: form.email,
        code: verificationCode,
      });
      // Email verified, move to wizard
      setWizardStep(1);
    } catch (err: any) {
      console.error(err);
      setErrors({
        code: err.response?.data?.message || "Code invalide ou expiré",
      });
    } finally {
      setLoading(false);
    }
  };

  // ========== WIZARD ==========
  const handleWizardNext = async () => {
    if (wizardStep === 4) return;

    // Validate step 1
    if (wizardStep === 1) {
      const newErrors: Record<string, string> = {};
      if (!form.mot_de_passe.trim())
        newErrors.mot_de_passe = "Le mot de passe est requis";
      if (form.mot_de_passe.length < 8)
        newErrors.mot_de_passe =
          "Le mot de passe doit contenir au moins 8 caractères";
      if (!form.nom.trim()) newErrors.nom = "Le nom est requis";
      if (!form.prenom.trim()) newErrors.prenom = "Le prénom est requis";
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;
    }

    // Validate step 2
    if (wizardStep === 2) {
      const newErrors: Record<string, string> = {};
      if (!form.genre) newErrors.genre = "Veuillez sélectionner un genre";
      if (!form.date_naissance)
        newErrors.date_naissance =
          "Veuillez sélectionner une date de naissance";
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;
    }

    // Validate step 3
    if (wizardStep === 3) {
      const newErrors: Record<string, string> = {};
      if (!selectedGouv.trim())
        newErrors.gouvernorat = "Veuillez sélectionner un gouvernorat";
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;
      await fetchCentresByGouv(selectedGouv);
    }

    setWizardStep((s) => s + 1);
  };

  const handleWizardBack = () => {
    if (wizardStep === 1) {
      // Go back to email verification
      setWizardStep(0);
      setEmailVerificationStep("email");
      setVerificationCode("");
    } else {
      setWizardStep((s) => Math.max(1, s - 1));
    }
  };

  const handleSignupFinish = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!form.centreId.trim())
      newErrors.centreId = "Veuillez sélectionner un centre";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const dateStr = form.date_naissance;
      const dateToSubmit =
        typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
          ? new Date(dateStr + "T00:00:00Z")
          : new Date(dateStr);

      await api.post("/users", {
        email: form.email,
        mot_de_passe: form.mot_de_passe,
        nom: form.nom,
        prenom: form.prenom,
        genre: form.genre,
        date_naissance: dateToSubmit,
        id_centre: form.centreId,
        role: "ADHERENT",
      });

      // Clear pending signup now that user is created
      try {
        localStorage.removeItem("pendingSignup");
      } catch (e) {
        // ignore
      }

      // Auto-login via auth endpoint to obtain token
      const loginRes = await api.post("/auth/login", {
        email: form.email,
        mot_de_passe: form.mot_de_passe,
      });
      localStorage.setItem("token", loginRes.data.access_token);
      localStorage.setItem("user", JSON.stringify(loginRes.data.user));
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setErrors({
        general: err.response?.data?.message || "Erreur lors de l'inscription",
      });
    } finally {
      setLoading(false);
    }
  };

  // ========== RENDER ==========
  if (wizardStep === 0) {
    // Email verification phase
    return (
      <div className="h-screen w-full bg-[#F7F3E9] flex items-center justify-center p-4 overflow-hidden font-sans relative">
        <button
          onClick={() => navigate("/auth")}
          className="absolute top-6 left-6 z-50 flex items-center space-x-2 text-smart-teal font-black text-[10px] uppercase tracking-widest bg-white p-3 px-5 rounded-full shadow-lg cursor-pointer border border-gray-100"
        >
          <ChevronLeft size={14} /> <span>Retour</span>
        </button>

        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-[#436d75] mb-2">
              {emailVerificationStep === "email"
                ? "Créer un compte"
                : "Vérifier votre email"}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {emailVerificationStep === "email"
                ? "Commencez par entrer votre email"
                : "Entrez le code reçu par email"}
            </p>

            {emailVerificationStep === "email" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Email
                  </label>
                  <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-[#436d75]">
                    <Mail size={20} className="text-gray-400 mr-2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: "" });
                      }}
                      placeholder="ton.email@example.com"
                      className="flex-1 bg-transparent outline-none"
                    />
                  </div>
                  {errors.email && (
                    <div className="text-red-600 text-sm mt-1">
                      {errors.email}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSendVerificationEmail}
                  disabled={loading}
                  className="w-full mt-6 h-12 bg-[#436d75] text-white rounded-lg font-bold hover:bg-[#2f4a50] disabled:opacity-50"
                >
                  {loading ? "Envoi..." : "Envoyer le code"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Code de vérification
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value.toUpperCase());
                      if (errors.code) setErrors({ ...errors, code: "" });
                    }}
                    placeholder="Entrez le code (6 chiffres)"
                    maxLength={6}
                    className="w-full p-3 border border-gray-300 rounded-lg text-center text-2xl font-bold tracking-widest"
                  />
                  {errors.code && (
                    <div className="text-red-600 text-sm mt-1">
                      {errors.code}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleVerifyCode}
                  disabled={loading}
                  className="w-full mt-6 h-12 bg-[#436d75] text-white rounded-lg font-bold hover:bg-[#2f4a50] disabled:opacity-50"
                >
                  {loading ? "Vérification..." : "Vérifier"}
                </button>

                <button
                  onClick={() => {
                    setEmailVerificationStep("email");
                    setVerificationCode("");
                  }}
                  className="w-full text-sm text-[#436d75] hover:underline"
                >
                  Changer d'email
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Wizard phase
  return (
    <div className="h-screen w-full bg-[#F7F3E9] flex items-center justify-center p-4 overflow-hidden font-sans">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-[#436d75]">
              Compléter votre inscription
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Étape {wizardStep} sur 4
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1">
                  <div
                    className={`h-2 rounded ${
                      i <= wizardStep ? "bg-[#436d75]" : "bg-gray-200"
                    }`}
                  />
                  <div className="text-xs text-center mt-2 text-gray-600">
                    {i === 1
                      ? "Accès"
                      : i === 2
                        ? "Personnel"
                        : i === 3
                          ? "Gouvernorat"
                          : "Centre"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            {/* Step 1: Email, Password, Name */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Email
                  </label>
                  <div className="p-3 bg-gray-100 rounded-lg text-gray-700 font-medium">
                    {form.email}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={form.mot_de_passe}
                    onChange={(e) => {
                      setForm({ ...form, mot_de_passe: e.target.value });
                      if (errors.mot_de_passe)
                        setErrors({ ...errors, mot_de_passe: "" });
                    }}
                    placeholder="Minimum 8 caractères"
                    className={`w-full p-3 border rounded-lg ${
                      errors.mot_de_passe
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.mot_de_passe && (
                    <div className="text-red-600 text-sm mt-1">
                      {errors.mot_de_passe}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Prénom
                  </label>
                  <input
                    value={form.prenom}
                    onChange={(e) => {
                      setForm({ ...form, prenom: e.target.value });
                      if (errors.prenom) setErrors({ ...errors, prenom: "" });
                    }}
                    placeholder="Ton prénom"
                    className={`w-full p-3 border rounded-lg ${
                      errors.prenom
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.prenom && (
                    <div className="text-red-600 text-sm mt-1">
                      {errors.prenom}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Nom
                  </label>
                  <input
                    value={form.nom}
                    onChange={(e) => {
                      setForm({ ...form, nom: e.target.value });
                      if (errors.nom) setErrors({ ...errors, nom: "" });
                    }}
                    placeholder="Ton nom"
                    className={`w-full p-3 border rounded-lg ${
                      errors.nom
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.nom && (
                    <div className="text-red-600 text-sm mt-1">
                      {errors.nom}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Genre, Date */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Genre
                  </label>
                  <select
                    value={form.genre}
                    onChange={(e) => {
                      setForm({ ...form, genre: e.target.value });
                      if (errors.genre) setErrors({ ...errors, genre: "" });
                    }}
                    className={`w-full p-3 border rounded-lg ${
                      errors.genre
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Choisir un genre</option>
                    <option value="HOMME">Homme</option>
                    <option value="FEMME">Femme</option>
                  </select>
                  {errors.genre && (
                    <div className="text-red-600 text-sm mt-1">
                      {errors.genre}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    value={form.date_naissance}
                    onChange={(e) => {
                      setForm({ ...form, date_naissance: e.target.value });
                      if (errors.date_naissance)
                        setErrors({ ...errors, date_naissance: "" });
                    }}
                    max={getTodayDate()}
                    className={`w-full p-3 border rounded-lg ${
                      errors.date_naissance
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.date_naissance && (
                    <div className="text-red-600 text-sm mt-1">
                      {errors.date_naissance}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Gouvernorat */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Sélectionnez votre gouvernorat pour afficher les centres
                  disponibles.
                </p>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Gouvernorat
                  </label>
                  <select
                    value={selectedGouv}
                    onChange={(e) => {
                      setSelectedGouv(e.target.value);
                      if (errors.gouvernorat)
                        setErrors({ ...errors, gouvernorat: "" });
                    }}
                    className={`w-full p-3 border rounded-lg ${
                      errors.gouvernorat
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Choisir un gouvernorat</option>
                    {gouvernorats.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  {errors.gouvernorat && (
                    <div className="text-red-600 text-sm mt-1">
                      {errors.gouvernorat}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Centre */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Sélectionnez le centre qui vous concerne.
                </p>
                {errors.centreId && (
                  <div className="text-red-600 text-sm mb-4 p-2 bg-red-50 rounded">
                    {errors.centreId}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {centres.length === 0 && (
                    <div className="text-sm text-gray-500">
                      Aucun centre trouvé pour ce gouvernorat.
                    </div>
                  )}
                  {centres.map((c: any) => (
                    <div
                      key={c.id}
                      className={`p-4 border rounded-lg cursor-pointer hover:shadow transition ${
                        form.centreId === c.id
                          ? "border-[#436d75] bg-[#F7F9F8]"
                          : "border-gray-300"
                      }`}
                      onClick={() => {
                        setForm({ ...form, centreId: c.id });
                        if (errors.centreId)
                          setErrors({ ...errors, centreId: "" });
                      }}
                    >
                      <div className="font-bold text-[#436d75]">{c.nom}</div>
                      <div className="text-sm text-gray-600">
                        {c.adresse || c.ville || c.gouvernorat}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {errors.general}
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              onClick={handleWizardBack}
              disabled={wizardStep === 1}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Retour
            </button>

            {wizardStep < 4 ? (
              <button
                onClick={handleWizardNext}
                disabled={loading}
                className="px-6 py-2 bg-[#436d75] text-white rounded-lg hover:bg-[#2f4a50] disabled:opacity-50"
              >
                {loading ? "Chargement..." : "Suivant"}
              </button>
            ) : (
              <button
                onClick={handleSignupFinish}
                disabled={loading}
                className="px-6 py-2 bg-[#436d75] text-white rounded-lg hover:bg-[#2f4a50] disabled:opacity-50 font-bold"
              >
                {loading ? "Enregistrement..." : "Terminer"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
