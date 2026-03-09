import {
  X,
  FileText,
  MapPin,
  Map,
  User,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { PlanningInput } from "./PlanningInput";
import api from "../../../api/axios";

// ─── Catégories enrichies ─────────────────────────────────────────────────────
export const ALL_CATEGORIES = [
  { id: "Technologie", label: "Robotique & IT", icon: "💻" },
  { id: "Art", label: "Théâtre & Cinéma", icon: "🎭" },
  { id: "Musique", label: "Musique & Chant", icon: "🎵" },
  { id: "Sport", label: "Sport & Athlétisme", icon: "⚽" },
  { id: "Science", label: "Science & Astronomie", icon: "🔭" },
  { id: "Litterature", label: "Lecture & Littérature", icon: "📚" },
  { id: "Photographie", label: "Photo & Vidéo", icon: "📷" },
  { id: "EnvironmentClub", label: "Écologie & Nature", icon: "🌿" },
  { id: "Cuisine", label: "Cuisine & Gastronomie", icon: "👨‍🍳" },
  { id: "Numismatique", label: "Patrimoine & Culture", icon: "🏛️" },
];

export const getCategoryIcon = (categoryId: string, categories: any[]) => {
  const std = ALL_CATEGORIES.find((c) => c.id === categoryId);
  if (std) return std.icon;
  const custom = categories.find((c) => c.id === categoryId);
  if (custom?.icon) return custom.icon;
  return "✨";
};

// ─── Validation ───────────────────────────────────────────────────────────────
interface FormErrors {
  nom?: string;
  categorie?: string;
  id_salle?: string;
}

const validateForm = (data: any): FormErrors => {
  const errors: FormErrors = {};
  if (!data.nom || data.nom.trim().length < 3)
    errors.nom = "Le nom doit contenir au moins 3 caractères.";
  if (!data.categorie) errors.categorie = "Veuillez choisir une catégorie.";
  if (!data.id_salle) errors.id_salle = "Veuillez choisir un centre d'accueil.";
  return errors;
};

export const AddClubModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  salles,
  coaches,
  categories,
}: any) => {
  const [selectedGouvernorat, setSelectedGouvernorat] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── État du Staff ───
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState<any[]>([]);
  const token = localStorage.getItem("token");

  // 💡 Cet useEffect s'exécute à chaque fois que la salle change
  useEffect(() => {
    if (formData.id_salle && isOpen) {
      // 💡 On appelle la nouvelle route spécifique au staff
      api
        .get(`/users/staff/${formData.id_salle}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setStaffList(res.data);
        })
        .catch((err) => {
          console.error("Erreur chargement staff", err);
          setStaffList([]);
        });
    } else {
      setStaffList([]);
      setSelectedStaff([]);
    }
  }, [formData.id_salle, isOpen, token]);

  const gouvernorats = useMemo(
    () =>
      Array.from(new Set(salles.map((s: any) => s.gouvernorat))).filter(
        Boolean,
      ) as string[],
    [salles],
  );
  const filteredSalles = useMemo(
    () =>
      !selectedGouvernorat
        ? salles
        : salles.filter((s: any) => s.gouvernorat === selectedGouvernorat),
    [salles, selectedGouvernorat],
  );

  const handleLogoUpload = useCallback(
    (file: File) => {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image trop grande (max 2 Mo)");
        return;
      }
      setUploadLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setFormData((prev: any) => ({ ...prev, logo_url: base64 }));
        setUploadLoading(false);
      };
      reader.readAsDataURL(file);
    },
    [setFormData],
  );

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const errs = validateForm(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    // 💡 ON AJOUTE LE STAFF ICI
    const payload = {
      ...formData,
      staff: selectedStaff,
      // On garde id_coach pour ne pas casser l'ancien code
      id_coach:
        selectedStaff.find((s) => s.role_dans_club === "COACH")
          ?.id_utilisateur || formData.id_coach,
    };

    onSubmit(e, payload); // On envoie le payload complet au parent
  };

  const handleClose = () => {
    setErrors({});
    setLogoPreview("");
    setSelectedGouvernorat("");
    setSelectedStaff([]);
    setIsCustomCategory(false);
    onClose();
  };

  if (!isOpen) return null;

  const inputCls = (err?: string) =>
    `w-full p-4 bg-white rounded-[20px] font-bold text-sm outline-none shadow-sm text-smart-teal transition-all ${err ? "ring-2 ring-red-300" : "focus:ring-4 focus:ring-smart-sage/50"}`;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#1A1C1E]/65 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#F7F3E9] rounded-[40px] p-8 w-full max-w-3xl shadow-2xl relative border-4 border-white animate-in zoom-in my-8 max-h-[92vh] overflow-y-auto">
        <button
          onClick={handleClose}
          type="button"
          className="absolute top-6 right-6 bg-white p-2 rounded-full text-gray-400 hover:text-black shadow-sm z-10"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-8 pb-5 border-b-2 border-white/60">
          <div className="w-10 h-10 bg-smart-teal rounded-xl flex items-center justify-center text-white text-lg">
            ＋
          </div>
          <div>
            <h2 className="text-3xl font-black text-smart-teal tracking-tight">
              Nouveau Club
            </h2>
            <p className="text-gray-400 text-xs font-bold mt-0.5">
              Remplissez les informations
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7" noValidate>
          {/* Logo */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-smart-teal/50 uppercase tracking-widest pl-1">
              Logo du Club
            </label>
            <div
              className="flex items-center gap-4 p-4 bg-white rounded-[20px] shadow-sm cursor-pointer border-2 border-dashed border-gray-200"
              onClick={() => fileRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-2xl bg-smart-sage/20 flex items-center justify-center relative overflow-hidden shrink-0">
                <span className="text-2xl">
                  {getCategoryIcon(formData.categorie, categories)}
                </span>
                {logoPreview && (
                  <img
                    src={logoPreview}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>
              <p className="font-bold text-smart-teal text-sm">
                Cliquer pour changer
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleLogoUpload(f);
                }}
              />
            </div>
          </div>

          {/* Général */}
          <div className="space-y-4">
            <input
              required
              placeholder="Nom du club *"
              className={inputCls(errors.nom)}
              value={formData.nom || ""}
              onChange={(e) =>
                setFormData({ ...formData, nom: e.target.value })
              }
            />
            <textarea
              placeholder="Description..."
              className={`${inputCls()} min-h-[90px]`}
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Catégorie */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-smart-teal/50 uppercase tracking-widest pl-1">
              Catégorie *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {categories.map((cat: any) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setFormData({ ...formData, categorie: cat.id });
                  }}
                  className={`p-3 rounded-2xl text-[10px] font-black ${!isCustomCategory && formData.categorie === cat.id ? "bg-smart-teal text-white" : "bg-white"}`}
                >
                  {cat.label?.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Staff */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-smart-teal/50 uppercase tracking-widest pl-1">
              Staff du Club
            </label>
            <div className="grid grid-cols-1 gap-2">
              {formData.id_salle && staffList.length === 0 && (
                <p className="text-[10px] text-red-400 italic">
                  Aucun membre du staff trouvé dans ce centre.
                </p>
              )}
              {staffList.map((s: any) => {
                const isSelected = selectedStaff.find(
                  (item) => item.id_utilisateur === s.id,
                );
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100"
                  >
                    <span className="font-bold text-sm text-smart-teal">
                      {s.nom} {s.prenom} ({s.role})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        isSelected
                          ? setSelectedStaff(
                              selectedStaff.filter(
                                (x) => x.id_utilisateur !== s.id,
                              ),
                            )
                          : setSelectedStaff([
                              ...selectedStaff,
                              { id_utilisateur: s.id, role_dans_club: s.role },
                            ])
                      }
                      className={`text-xs font-black px-4 py-2 rounded-lg ${isSelected ? "bg-red-50 text-red-500" : "bg-smart-sage/20 text-smart-teal"}`}
                    >
                      {isSelected ? "Retirer" : "Ajouter"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Localisation */}
          <div className="grid grid-cols-2 gap-4">
            <select
              className={inputCls()}
              value={selectedGouvernorat}
              onChange={(e) => {
                setSelectedGouvernorat(e.target.value);
                setFormData({ ...formData, id_salle: "" });
              }}
            >
              <option value="">🗺️ Gouvernorat...</option>
              {gouvernorats.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
            <select
              required
              className={inputCls(errors.id_salle)}
              value={formData.id_salle || ""}
              onChange={(e) =>
                setFormData({ ...formData, id_salle: e.target.value })
              }
            >
              <option value="">Choisir un centre *</option>
              {filteredSalles.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </select>
          </div>

          <PlanningInput
            value={formData.planning}
            onChange={(val) => setFormData({ ...formData, planning: val })}
          />

          <button
            type="submit"
            className="w-full bg-smart-teal text-white py-4 rounded-[25px] font-black hover:bg-[#2f5059]"
          >
            Créer le Club
          </button>
        </form>
      </div>
    </div>
  );
};;
