import { X, FileText, MapPin, Map, User, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useMemo, useRef, useCallback } from "react";
import { PlanningInput } from "./PlanningInput";

// ─── Catégories enrichies ─────────────────────────────────────────────────────
export const ALL_CATEGORIES = [
  { id: "Technologie",  label: "Robotique & IT",       icon: "💻" },
  { id: "Art",          label: "Théâtre & Cinéma",      icon: "🎭" },
  { id: "Musique",      label: "Musique & Chant",        icon: "🎵" },
  { id: "Sport",        label: "Sport & Athlétisme",     icon: "⚽" },
  { id: "Science",      label: "Science & Astronomie",   icon: "🔭" },
  { id: "Litterature",  label: "Lecture & Littérature",  icon: "📚" },
  { id: "Photographie", label: "Photo & Vidéo",          icon: "📷" },
  { id: "EnvironmentClub", label: "Écologie & Nature",  icon: "🌿" },
  { id: "Cuisine",      label: "Cuisine & Gastronomie",  icon: "👨‍🍳" },
  { id: "Numismatique", label: "Patrimoine & Culture",   icon: "🏛️" },
];

export const getCategoryIcon = (categoryId: string, categories: any[]) => {
  const std = ALL_CATEGORIES.find(c => c.id === categoryId);
  if (std) return std.icon;
  
  const custom = categories.find(c => c.id === categoryId);
  if (custom?.icon) return custom.icon;

  const lower = categoryId.toLowerCase();
  if (lower.includes("foot") || lower.includes("sport") || lower.includes("gym")) return "⚽";
  if (lower.includes("code") || lower.includes("web") || lower.includes("dev")) return "💻";
  if (lower.includes("danse") || lower.includes("art")) return "🎭";
  if (lower.includes("livre") || lower.includes("ecole")) return "📚";
  if (lower.includes("nature") || lower.includes("plage")) return "🌿";
  if (lower.includes("photo") || lower.includes("video")) return "📷";
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
  if (!data.categorie)
    errors.categorie = "Veuillez choisir une catégorie.";
  if (!data.id_salle)
    errors.id_salle = "Veuillez choisir un centre d'accueil.";
  return errors;
};

// ─── Composant ────────────────────────────────────────────────────────────────
export const AddClubModal = ({
  isOpen, onClose, onSubmit, formData, setFormData, salles, coaches, categories,
}: any) => {
  const [selectedGouvernorat, setSelectedGouvernorat] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const gouvernorats = useMemo(
    () => Array.from(new Set(salles.map((s: any) => s.gouvernorat))).filter(Boolean) as string[],
    [salles]
  );
  const filteredSalles = useMemo(
    () => !selectedGouvernorat ? salles : salles.filter((s: any) => s.gouvernorat === selectedGouvernorat),
    [salles, selectedGouvernorat]
  );

  const handleLogoUpload = useCallback((file: File) => {
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
  }, [setFormData]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const errs = validateForm(formData);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onSubmit(e);
  };

  const handleClose = () => {
    setErrors({});
    setLogoPreview("");
    setSelectedGouvernorat("");
    setIsCustomCategory(false);
    onClose();
  };

  if (!isOpen) return null;

  const inputCls = (err?: string) =>
    `w-full p-4 bg-white rounded-[20px] font-bold text-sm outline-none shadow-sm text-smart-teal transition-all placeholder:font-medium placeholder:text-gray-300 ${
      err ? "ring-2 ring-red-300 focus:ring-red-400" : "focus:ring-4 focus:ring-smart-sage/50"
    }`;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#1A1C1E]/65 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#F7F3E9] rounded-[40px] p-8 w-full max-w-3xl shadow-2xl relative border-4 border-white animate-in zoom-in my-8 max-h-[92vh] overflow-y-auto">
        {/* Close */}
        <button onClick={handleClose} type="button"
          className="absolute top-6 right-6 bg-white p-2 rounded-full text-gray-400 hover:text-black shadow-sm z-10 transition-colors">
          <X size={20} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-8 pb-5 border-b-2 border-white/60">
          <div className="w-10 h-10 bg-smart-teal rounded-xl flex items-center justify-center text-white text-lg">＋</div>
          <div>
            <h2 className="text-3xl font-black text-smart-teal tracking-tight">Nouveau Club</h2>
            <p className="text-gray-400 text-xs font-bold mt-0.5">Remplissez tous les champs obligatoires *</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7" noValidate>

          {/* ── Logo Upload ── */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-smart-teal/50 uppercase tracking-widest pl-1">Logo du Club</label>
            <div
              className="flex items-center gap-4 p-4 bg-white rounded-[20px] shadow-sm cursor-pointer border-2 border-dashed border-gray-200 hover:border-smart-teal/40 transition-all group"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleLogoUpload(f); }}
            >
              <div className="w-16 h-16 rounded-2xl bg-smart-sage/20 flex items-center justify-center relative overflow-hidden shadow-sm border-2 border-white group-hover:border-smart-teal/20 transition-all shrink-0">
                <span className="text-2xl">{getCategoryIcon(formData.categorie, categories)}</span>
                {logoPreview && (
                  <img 
                    src={logoPreview} 
                    alt="logo" 
                    className="absolute inset-0 w-full h-full object-cover" 
                    onError={(e: any) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                {uploadLoading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-smart-teal border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-smart-teal text-sm">Glisser-déposer ou cliquer</p>
                <p className="text-gray-400 text-xs mt-0.5">PNG, JPG, SVG — max 2 Mo</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
            </div>
          </div>

          {/* ── Informations générales ── */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-smart-teal/50 uppercase tracking-widest pl-1">Informations Générales *</label>

            <div className="space-y-1">
              <input required placeholder="Nom du club ou de l'activité *" className={inputCls(errors.nom)}
                value={formData.nom || ""} onChange={(e) => { setFormData({ ...formData, nom: e.target.value }); setErrors({ ...errors, nom: undefined }); }} />
              {errors.nom && <p className="text-red-500 text-[10px] font-bold pl-2 flex items-center gap-1"><AlertCircle size={10}/>{errors.nom}</p>}
            </div>

            <div className="relative group">
              <FileText className="absolute left-4 top-4 text-gray-300 group-focus-within:text-smart-teal transition-colors" size={16} />
              <textarea placeholder="Description (optionnel)..." className={`${inputCls()} pl-11 min-h-[90px] resize-y`}
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>

          {/* ── Catégorie ── */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-smart-teal/50 uppercase tracking-widest pl-1">Catégorie *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {categories.map((cat: any) => (
                <button key={cat.id} type="button"
                  onClick={() => { setIsCustomCategory(false); setFormData({ ...formData, categorie: cat.id }); setErrors({ ...errors, categorie: undefined }); }}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1 text-[10px] font-black transition-all border-2 ${
                    !isCustomCategory && formData.categorie === cat.id
                      ? "bg-smart-teal text-white border-smart-teal shadow-lg scale-105"
                      : "bg-white text-smart-teal border-transparent hover:border-smart-teal/30 shadow-sm"
                  }`}
                >
                  <span className="text-lg">{getCategoryIcon(cat.id, categories)}</span>
                  <span className="text-center leading-tight">{cat.label?.split(" ")[0] || cat.id}</span>
                </button>
              ))}
              
              {/* Bouton "Autre" */}
              <button type="button"
                onClick={() => { setIsCustomCategory(true); setFormData({ ...formData, categorie: "" }); }}
                className={`p-3 rounded-2xl flex flex-col items-center gap-1 text-[10px] font-black transition-all border-2 ${
                  isCustomCategory
                    ? "bg-smart-teal text-white border-smart-teal shadow-lg scale-105"
                    : "bg-white text-smart-teal border-transparent hover:border-smart-teal/30 shadow-sm"
                }`}
              >
                <span className="text-lg">✨</span>
                <span className="text-center leading-tight">Autre...</span>
              </button>
            </div>

            {/* Input texte si "Autre" est sélectionné */}
            {isCustomCategory && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                <input required placeholder="Saisissez la nouvelle catégorie... *" className={inputCls(errors.categorie)}
                  value={formData.categorie || ""}
                  onChange={(e) => { setFormData({ ...formData, categorie: e.target.value }); setErrors({ ...errors, categorie: undefined }); }} />
              </div>
            )}
            {errors.categorie && <p className="text-red-500 text-[10px] font-bold pl-2 flex items-center gap-1"><AlertCircle size={10}/>{errors.categorie}</p>}
          </div>

          {/* ── Coach ── */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-smart-teal/50 uppercase tracking-widest pl-1">Coach Animateur (Optionnel)</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-smart-teal transition-colors pointer-events-none" size={16} />
              <select className={`${inputCls()} pl-11 appearance-none cursor-pointer`}
                value={formData.id_coach || ""}
                onChange={(e) => setFormData({ ...formData, id_coach: e.target.value })}>
                <option value="">Aucun coach assigné</option>
                {coaches.map((c: any) => <option key={c.id} value={c.id}>{c.nom} {c.prenom}</option>)}
              </select>
            </div>
          </div>

          <div className="h-px bg-white/60 rounded-full" />

          {/* ── Localisation ── */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-smart-teal/50 uppercase tracking-widest pl-1">Localisation *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gouvernorat */}
              <div className="relative group">
                <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none z-10" size={16} />
                <select className={`${inputCls()} pl-11 appearance-none cursor-pointer`}
                  value={selectedGouvernorat}
                  onChange={(e) => { setSelectedGouvernorat(e.target.value); setFormData({ ...formData, id_salle: "" }); }}>
                  <option value="">🗺️ Filtrer par gouvernorat...</option>
                  {gouvernorats.map((gov) => <option key={gov} value={gov}>{gov}</option>)}
                </select>
              </div>
              {/* Centre */}
              <div className="space-y-1">
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none z-10" size={16} />
                  <select required className={`${inputCls(errors.id_salle)} pl-11 appearance-none cursor-pointer`}
                    value={formData.id_salle || ""}
                    onChange={(e) => { setFormData({ ...formData, id_salle: e.target.value }); setErrors({ ...errors, id_salle: undefined }); }}>
                    <option value="" disabled>Choisir un centre... *</option>
                    {filteredSalles.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.nom}{s.gouvernorat ? ` (${s.gouvernorat})` : ""}</option>
                    ))}
                  </select>
                </div>
                {errors.id_salle && <p className="text-red-500 text-[10px] font-bold pl-2 flex items-center gap-1"><AlertCircle size={10}/>{errors.id_salle}</p>}
              </div>
            </div>
          </div>

          <div className="h-px bg-white/60 rounded-full" />

          {/* ── Planning ── */}
          <div className="space-y-4">
            <PlanningInput 
              value={formData.planning} 
              onChange={(val) => setFormData({ ...formData, planning: val })} 
            />
          </div>

          {/* ── Submit ── */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose}
              className="flex-1 bg-white text-gray-500 border border-gray-200 py-4 rounded-[25px] font-black text-sm hover:bg-gray-50 transition-all">
              Annuler
            </button>
            <button type="submit"
              className="flex-2 flex-grow bg-smart-teal text-white py-4 px-8 rounded-[25px] font-black text-sm shadow-xl hover:bg-[#2f5059] transition-all active:scale-95 flex items-center justify-center gap-2">
              <CheckCircle size={17} />
              Créer le Club
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
