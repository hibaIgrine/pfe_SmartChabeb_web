import { X, FileText, MapPin, Map, AlertCircle } from "lucide-react";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { PlanningInput } from "./PlanningInput";
import api from "../../../api/axios";

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

const validateForm = (data: any) => {
  const errors: any = {};
  if (!data.nom || data.nom.trim().length < 3) errors.nom = "Nom trop court.";
  if (!data.categorie) errors.categorie = "Catégorie requise.";
  if (!data.id_salle) errors.id_salle = "Centre requis.";
  if (data.capacite && parseInt(data.capacite) <= 0)
    errors.capacite = "Invalide.";
  return errors;
};

export const AddClubModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  salles,
  categories,
}: any) => {
  const [selectedGouvernorat, setSelectedGouvernorat] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState<any[]>([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (formData.id_salle && isOpen) {
      api
        .get(`/users/staff/${formData.id_salle}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setStaffList(res.data))
        .catch(() => setStaffList([]));
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setFormData((prev: any) => ({
          ...prev,
          logo_url: reader.result as string,
        }));
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

    const payload = {
      ...formData,
      staff: selectedStaff,
      id_coach:
        selectedStaff.find((s) => s.role_dans_club === "COACH")
          ?.id_utilisateur || formData.id_coach,
    };
    onSubmit(e, payload);
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
    `w-full p-4 bg-white rounded-[20px] font-bold text-sm outline-none border-none shadow-sm text-smart-teal transition-all ${err ? "ring-2 ring-red-400" : "focus:ring-4 focus:ring-smart-sage/50"}`;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#1A1C1E]/65 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#F7F3E9] rounded-[40px] p-8 w-full max-w-3xl shadow-2xl relative border-4 border-white animate-in zoom-in my-8 max-h-[92vh] overflow-y-auto">
        <button
          onClick={handleClose}
          type="button"
          className="absolute top-6 right-6 bg-white p-2 rounded-full text-gray-400 hover:text-black"
        >
          <X size={20} />
        </button>

        <h2 className="text-3xl font-black text-smart-teal mb-8">
          Nouveau Club
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Logo */}
          <div
            className="flex items-center gap-4 p-4 bg-white rounded-[20px] cursor-pointer border-2 border-dashed border-gray-200"
            onClick={() => fileRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-2xl bg-smart-sage/20 flex items-center justify-center relative overflow-hidden">
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
            <p className="font-bold text-sm text-smart-teal">
              Cliquer pour ajouter un logo
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

          {/* Nom, Capacité, Locale */}
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
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Capacité maximale"
                className={inputCls(errors.capacite)}
                value={formData.capacite || ""}
                onChange={(e) =>
                  setFormData({ ...formData, capacite: e.target.value })
                }
              />
              <input
                placeholder="Locale (ex: Salle 1)"
                className={inputCls()}
                value={formData.locale || ""}
                onChange={(e) =>
                  setFormData({ ...formData, locale: e.target.value })
                }
              />
            </div>
            <textarea
              placeholder="Description..."
              className={`${inputCls()} min-h-[90px]`}
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Catégories */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-smart-teal/50 uppercase">
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
                  className={`p-3 rounded-2xl flex flex-col items-center text-[10px] font-black border-2 transition ${!isCustomCategory && formData.categorie === cat.id ? "bg-smart-teal text-white border-smart-teal" : "bg-white text-smart-teal border-transparent"}`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  {cat.label?.split(" ")[0]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setIsCustomCategory(true);
                  setFormData({ ...formData, categorie: "" });
                }}
                className={`p-3 rounded-2xl flex flex-col items-center text-[10px] font-black border-2 transition ${isCustomCategory ? "bg-smart-teal text-white border-smart-teal" : "bg-white text-smart-teal border-transparent"}`}
              >
                <span className="text-xl">✨</span>Autre
              </button>
            </div>
            {isCustomCategory && (
              <input
                required
                placeholder="Saisissez la catégorie..."
                className={inputCls(errors.categorie)}
                value={formData.categorie || ""}
                onChange={(e) =>
                  setFormData({ ...formData, categorie: e.target.value })
                }
              />
            )}
          </div>

          {/* Staff */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-smart-teal/50 uppercase">
              Staff du Club
            </label>
            <div className="grid grid-cols-1 gap-2">
              {formData.id_salle && staffList.length === 0 && (
                <p className="text-[10px] text-red-400 italic">
                  Aucun staff dans ce centre.
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
            <div className="relative group">
              <Map
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10"
                size={16}
              />
              <select
                className={`${inputCls()} pl-11`}
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
            </div>
            <div className="relative group">
              <MapPin
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10"
                size={16}
              />
              <select
                required
                className={`${inputCls(errors.id_salle)} pl-11`}
                value={formData.id_salle || ""}
                onChange={(e) =>
                  setFormData({ ...formData, id_salle: e.target.value })
                }
              >
                <option value="" disabled>
                  Choisir un centre... *
                </option>
                {filteredSalles.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <PlanningInput
            value={formData.planning}
            onChange={(val) => setFormData({ ...formData, planning: val })}
          />

          <button
            type="submit"
            className="w-full bg-smart-teal text-white py-4 rounded-[25px] font-black hover:bg-[#2f5059] transition-all"
          >
            Créer le Club
          </button>
        </form>
      </div>
    </div>
  );
};
