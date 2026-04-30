import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function GoogleCompleteProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [gouvernorats, setGouvernorats] = useState<string[]>([]);
  const [centres, setCentres] = useState<Array<any>>([]);
  const [selectedGouv, setSelectedGouv] = useState("");
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    genre: "",
    date_naissance: "",
    centreId: "",
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/auth");
      return;
    }

    const user = JSON.parse(userStr);
    if (user.nom) {
      const parts = String(user.nom).split(" ");
      setForm((f) => ({
        ...f,
        prenom: parts.slice(1).join(" ") || "",
        nom: parts[0] || "",
      }));
    }

    // Preload list of gouvernorats from centres endpoint (unique)
    api
      .get("/centres")
      .then((r) => {
        const items = r.data || [];
        const gouvs: string[] = Array.from(
          new Set(items.map((c: any) => c.gouvernorat).filter(Boolean)),
        ).sort() as string[];
        setGouvernorats(gouvs);
      })
      .catch(() => setGouvernorats([]))
      .finally(() => setLoading(false));
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

  const handleNext = async () => {
    if (step === 4) return;

    // Validate step 1
    if (step === 1) {
      const newErrors: Record<string, string> = {};
      if (!form.prenom.trim()) newErrors.prenom = "Le prénom est requis";
      if (!form.nom.trim()) newErrors.nom = "Le nom est requis";
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;
    }

    // Validate step 2
    if (step === 2) {
      const newErrors: Record<string, string> = {};
      if (!form.genre) newErrors.genre = "Veuillez sélectionner un genre";
      if (!form.date_naissance)
        newErrors.date_naissance =
          "Veuillez sélectionner une date de naissance";
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;
    }

    // Validate step 3 (Gouvernorat)
    if (step === 3) {
      const newErrors: Record<string, string> = {};
      if (!selectedGouv.trim())
        newErrors.gouvernorat = "Veuillez sélectionner un gouvernorat";
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;
      // Fetch centres for selected gouvernorat before moving to step 4
      await fetchCentresByGouv(selectedGouv);
    }

    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const saveAndFinish = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!form.centreId.trim())
      newErrors.centreId = "Veuillez sélectionner un centre";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Utilisateur non authentifié");
      const user = JSON.parse(userStr);

      await api.patch(`/users/${user.id}`, {
        prenom: form.prenom,
        nom: form.nom,
        genre: form.genre,
        date_naissance: form.date_naissance,
        id_centre: form.centreId,
      });

      const me = await api.get("/users/me/profile");
      localStorage.setItem("user", JSON.stringify(me.data));
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Erreur lors de la mise à jour");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#436d75]">
          Compléter votre profil
        </h2>
        <p className="text-sm text-gray-600">
          Suivez les étapes rapides pour terminer votre inscription.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center space-x-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1">
              <div
                className={`h-2 rounded ${i <= step ? "bg-[#436d75]" : "bg-gray-200"}`}
              />
              <div className="text-xs text-center mt-2">
                {i === 1
                  ? "Identité"
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

      <div>
        {step === 1 && (
          <div className="space-y-4">
            <label className="block text-sm font-semibold">Prénom</label>
            <input
              value={form.prenom}
              onChange={(e) => {
                setForm({ ...form, prenom: e.target.value });
                if (errors.prenom) setErrors({ ...errors, prenom: "" });
              }}
              className={`w-full p-3 border rounded ${errors.prenom ? "border-red-500 bg-red-50" : "border-gray-300"}`}
              placeholder="Ton prénom"
            />
            {errors.prenom && (
              <div className="text-red-600 text-sm">{errors.prenom}</div>
            )}

            <label className="block text-sm font-semibold">Nom</label>
            <input
              value={form.nom}
              onChange={(e) => {
                setForm({ ...form, nom: e.target.value });
                if (errors.nom) setErrors({ ...errors, nom: "" });
              }}
              className={`w-full p-3 border rounded ${errors.nom ? "border-red-500 bg-red-50" : "border-gray-300"}`}
              placeholder="Ton nom"
            />
            {errors.nom && (
              <div className="text-red-600 text-sm">{errors.nom}</div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block text-sm font-semibold">Genre</label>
            <select
              value={form.genre}
              onChange={(e) => {
                setForm({ ...form, genre: e.target.value });
                if (errors.genre) setErrors({ ...errors, genre: "" });
              }}
              className={`w-full p-3 border rounded ${errors.genre ? "border-red-500 bg-red-50" : "border-gray-300"}`}
            >
              <option value="">Choisir un genre</option>
              <option value="H">Homme</option>
              <option value="F">Femme</option>
            </select>
            {errors.genre && (
              <div className="text-red-600 text-sm">{errors.genre}</div>
            )}

            <label className="block text-sm font-semibold">
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
              className={`w-full p-3 border rounded ${errors.date_naissance ? "border-red-500 bg-red-50" : "border-gray-300"}`}
            />
            {errors.date_naissance && (
              <div className="text-red-600 text-sm">
                {errors.date_naissance}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Sélectionnez votre gouvernorat pour afficher les centres
              disponibles.
            </p>
            <label className="block text-sm font-semibold">Gouvernorat</label>
            <select
              value={selectedGouv}
              onChange={async (e) => {
                setSelectedGouv(e.target.value);
                if (errors.gouvernorat)
                  setErrors({ ...errors, gouvernorat: "" });
              }}
              className={`w-full p-3 border rounded ${errors.gouvernorat ? "border-red-500 bg-red-50" : "border-gray-300"}`}
            >
              <option value="">Choisir un gouvernorat</option>
              {gouvernorats.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {errors.gouvernorat && (
              <div className="text-red-600 text-sm">{errors.gouvernorat}</div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Sélectionnez le centre qui vous concerne (filtré par gouvernorat).
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
                  className={`p-4 border rounded cursor-pointer hover:shadow ${form.centreId === c.id ? "border-[#436d75] bg-[#F7F9F8]" : ""}`}
                  onClick={() => {
                    setForm({ ...form, centreId: c.id });
                    if (errors.centreId) setErrors({ ...errors, centreId: "" });
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

      <div className="mt-6 flex justify-between">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className="px-4 py-2 border rounded text-gray-700 disabled:opacity-50"
        >
          Retour
        </button>
        {step < 4 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-[#436d75] text-white rounded hover:bg-[#2f4a50]"
          >
            Suivant
          </button>
        ) : (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setForm({ ...form, centreId: "" });
                setErrors({});
              }}
              className="px-4 py-2 border rounded text-gray-700"
            >
              Réinitialiser
            </button>
            <button
              onClick={saveAndFinish}
              className="px-6 py-2 bg-[#436d75] text-white rounded hover:bg-[#2f4a50] disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Enregistrement..." : "Terminer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
