import {
  X,
  FileText,
  MapPin,
  Map,
  AlertCircle,
  Building2,
  Users,
  CheckCircle,
} from "lucide-react";
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
  if (!data.id_salle) errors.id_salle = "Établissement requis.";
  if (!data.locale) errors.locale = "Veuillez choisir un local.";
  if (data.capacite === "" || parseInt(data.capacite) < 0)
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
  const [localList, setLocalList] = useState([]); // 💡 Liste des salles/terrains du centre
  const [selectedStaff, setSelectedStaff] = useState<any[]>([]);
  const token = localStorage.getItem("token");

  // 🔄 Charger le Staff ET les Locaux dès que le centre change
  useEffect(() => {
    if (formData.id_salle && isOpen) {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Charger le staff
      api
        .get(`/users/staff/${formData.id_salle}`, { headers })
        .then((res) => setStaffList(res.data))
        .catch(() => setStaffList([]));

      // 2. Charger les locaux (espaces) du centre choisi
      api
        .get(`/locaux?id_centre=${formData.id_salle}`, { headers })
        .then((res) => setLocalList(res.data))
        .catch(() => setLocalList([]));
    } else {
      setStaffList([]);
      setLocalList([]);
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
    `w-full p-4 bg-white rounded-[20px] font-bold text-sm outline-none border-none shadow-sm text-smart-teal transition-all ${
      err ? "ring-2 ring-red-400" : "focus:ring-4 focus:ring-smart-sage/50"
    }`;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#1A1C1E]/65 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#F7F3E9] rounded-[60px] p-8 w-full max-w-3xl shadow-2xl relative border-4 border-white animate-in zoom-in my-8 max-h-[92vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={handleClose}
          type="button"
          className="absolute top-6 right-6 bg-white p-2 rounded-full text-gray-400 hover:text-black"
        >
          <X size={20} />
        </button>

        <h2 className="text-3xl font-black text-smart-teal mb-8 italic tracking-tighter">
          Nouveau Club
        </h2>

        <form onSubmit={handleSubmit} className="space-y-7" noValidate>
          {/* 📍 SECTION 1 : LOCALISATION (Gouvernorat & Centre) */}
          <div className="bg-white/40 p-6 rounded-[30px] border border-white space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Étape 1 : Localisation de l'activité
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    setFormData({ ...formData, id_salle: "", locale: "" });
                  }}
                >
                  <option value="">Région / Gouvernorat...</option>
                  {gouvernorats.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative group">
                <Building2
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10"
                  size={16}
                />
                <select
                  required
                  className={`${inputCls(errors.id_salle)} pl-11`}
                  value={formData.id_salle || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      id_salle: e.target.value,
                      locale: "",
                    });
                    setErrors({ ...errors, id_salle: null });
                  }}
                >
                  <option value="" disabled>
                    Choisir un établissement... *
                  </option>
                  {filteredSalles.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 🖼️ SECTION 2 : LOGO ET INFOS GÉNÉRALES */}
          <div className="space-y-6">
            <div
              className="flex items-center gap-4 p-4 bg-white rounded-[25px] cursor-pointer border-2 border-dashed border-gray-200"
              onClick={() => fileRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-2xl bg-smart-sage/20 flex items-center justify-center relative overflow-hidden shrink-0 shadow-inner">
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
                onChange={(e) =>
                  e.target.files?.[0] && handleLogoUpload(e.target.files[0])
                }
              />
            </div>

            <div className="space-y-4">
              <input
                required
                placeholder="Nom officiel du club *"
                className={inputCls(errors.nom)}
                value={formData.nom || ""}
                onChange={(e) => {
                  setFormData({ ...formData, nom: e.target.value });
                  setErrors({ ...errors, nom: null });
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 💡 CAPACITÉ BLOQUÉE (Pas de négatif) */}
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Capacité d'accueil"
                    className={inputCls(errors.capacite)}
                    value={formData.capacite || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacite: e.target.value.replace(/[^0-9]/g, ""),
                      })
                    }
                  />
                  {errors.capacite && (
                    <p className="text-red-500 text-[9px] font-black ml-4 uppercase">
                      {errors.capacite}
                    </p>
                  )}
                </div>

                {/* 💡 CHOIX DU LOCAL (SELON LE CENTRE) */}
                <div className="space-y-1">
                  <select
                    required
                    disabled={!formData.id_salle}
                    className={inputCls(errors.locale)}
                    value={formData.locale || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, locale: e.target.value });
                      setErrors({ ...errors, locale: null });
                    }}
                  >
                    <option value="">
                      {formData.id_salle
                        ? "Choisir la salle / le terrain *"
                        : "En attente du centre..."}
                    </option>
                    {localList.map((l: any) => (
                      <option key={l.id} value={l.nom}>
                        {l.nom} ({l.type})
                      </option>
                    ))}
                    <option value="Autre">Extérieur / Hors centre</option>
                  </select>
                  {errors.locale && (
                    <p className="text-red-500 text-[9px] font-black ml-4 uppercase">
                      {errors.locale}
                    </p>
                  )}
                </div>
              </div>

              <textarea
                placeholder="Description de l'activité..."
                className={`${inputCls()} min-h-[90px]`}
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>

          {/* 🏷️ SECTION 3 : CATÉGORIES */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-smart-teal/50 uppercase tracking-widest ml-1">
              Catégorie
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {categories.map((cat: any) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(false);
                    setFormData({ ...formData, categorie: cat.id });
                    setErrors({ ...errors, categorie: null });
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
                placeholder="Saisissez la catégorie personnalisée..."
                className={inputCls(errors.categorie)}
                value={formData.categorie || ""}
                onChange={(e) => {
                  setFormData({ ...formData, categorie: e.target.value });
                  setErrors({ ...errors, categorie: null });
                }}
              />
            )}
          </div>

          {/* 🧑‍🤝‍🧑 SECTION 4 : STAFF */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-smart-teal/50 uppercase tracking-widest ml-1">
              Responsables et Animateurs
            </label>
            <div className="grid grid-cols-1 gap-2">
              {formData.id_salle && staffList.length === 0 && (
                <p className="text-[10px] text-red-400 italic ml-2">
                  Aucun staff trouvé dans ce centre.
                </p>
              )}
              {staffList.map((s: any) => {
                const isSelected = selectedStaff.find(
                  (item) => item.id_utilisateur === s.id,
                );
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <span className="font-bold text-xs text-smart-teal ml-2">
                      {s.nom} {s.prenom}{" "}
                      <small className="opacity-40 ml-1">({s.role})</small>
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
                      className={`text-[9px] font-black px-4 py-2 rounded-xl transition ${isSelected ? "bg-red-50 text-red-500" : "bg-smart-sage/20 text-smart-teal"}`}
                    >
                      {isSelected ? "RETIRER" : "AFFECTER"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 📅 SECTION 5 : PLANNING */}
          <PlanningInput
            value={formData.planning}
            onChange={(val) => setFormData({ ...formData, planning: val })}
          />

          {/* 🚀 SUBMIT */}
          <button
            type="submit"
            className="w-full bg-smart-teal text-white py-5 rounded-[30px] font-black text-lg shadow-xl shadow-smart-teal/20 hover:bg-black transition-all flex items-center justify-center gap-3"
          >
            <CheckCircle size={22} /> CRÉER LE CLUB
          </button>
        </form>
      </div>
    </div>
  );
};
