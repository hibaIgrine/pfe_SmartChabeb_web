import {
  X,
  Check,
  AlertCircle,
  Building2,
  Users,
  DollarSign,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import api from "../../../../api/axios";

const GOUVERNORATS_AR = [
  "أريانة",
  "باجة",
  "بن عروس",
  "بنزرت",
  "تطاوين",
  "توزر",
  "تونس",
  "جندوبة",
  "زغوان",
  "سليانة",
  "سوسة",
  "سيدي بوزيد",
  "قبلي",
  "صفاقس",
  "قابس",
  "القصرين",
  "قفصة",
  "القيروان",
  "الكاف",
  "مدنين",
  "المنستير",
  "منوبة",
  "المهدية",
  "نابل",
];

export const AddLocalModal = ({
  isOpen,
  onClose,
  centres,
  onRefresh,
  lockedCentreId,
  lockedCentreName,
}: any) => {
  const [form, setForm] = useState({
    nom: "",
    type: "",
    capacite: "",
    localisation: "",
    prix_heure: "",
    id_centre: "",
  });

  const [selectedGouv, setSelectedGouv] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [isCustomType, setIsCustomType] = useState(false);
  const token = localStorage.getItem("token");
  const isLockedCentre = Boolean(lockedCentreId);

  useEffect(() => {
    if (isOpen && lockedCentreId) {
      setForm((prev) => ({ ...prev, id_centre: lockedCentreId }));
    }
  }, [isOpen, lockedCentreId]);

  const filteredCentres = useMemo(() => {
    return centres.filter(
      (c: any) => !selectedGouv || c.gouvernorat === selectedGouv,
    );
  }, [centres, selectedGouv]);

  // 🛡️ NETTOYAGE NUMÉRIQUE (Empêche les signes négatifs et lettres)
  const handleNumericInput = (
    value: string,
    field: string,
    isDecimal: boolean = false,
  ) => {
    let sanitized = "";
    if (isDecimal) {
      sanitized = value.replace(/[^0-9.,]/g, "").replace(",", ".");
      const parts = sanitized.split(".");
      if (parts.length > 2)
        sanitized = parts[0] + "." + parts.slice(1).join("");
    } else {
      sanitized = value.replace(/[^0-9]/g, "");
    }
    setForm({ ...form, [field]: sanitized });
    // Effacer l'erreur dès que l'utilisateur commence à corriger
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  if (!isOpen) return null;

  // ✅ LOGIQUE DE VALIDATION STRICTE
  const validate = () => {
    let newErrors: any = {};
    if (!form.nom.trim()) newErrors.nom = "Le nom de l'espace est requis";
    if (!form.type.trim()) newErrors.type = "Veuillez définir le type d'espace";
    if (!isLockedCentre && !selectedGouv)
      newErrors.gouv = "Veuillez choisir un gouvernorat";
    if (!isLockedCentre && !form.id_centre)
      newErrors.id_centre = "Veuillez sélectionner un établissement";
    if (form.capacite === "")
      newErrors.capacite = "Indiquez la capacité d'accueil";
    if (form.prix_heure === "")
      newErrors.prix_heure = "Le tarif horaire est obligatoire (0 si gratuit)";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await api.post(
        "/locaux",
        {
          ...form,
          capacite: parseInt(form.capacite),
          prix_heure: parseFloat(form.prix_heure),
          id_centre: lockedCentreId || form.id_centre,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      onRefresh();
      handleClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClose = () => {
    setForm({
      nom: "",
      type: "",
      capacite: "",
      localisation: "",
      prix_heure: "",
      id_centre: "",
    });
    setSelectedGouv("");
    setErrors({});
    setIsCustomType(false);
    onClose();
  };

  // Style dynamique des inputs selon l'erreur
  const inputStyle = (fieldName: string) => `
    w-full p-5 bg-white rounded-[25px] border-none outline-none shadow-sm font-bold text-smart-teal 
    transition-all focus:ring-4 ${errors[fieldName] ? "ring-2 ring-red-400 focus:ring-red-300" : "focus:ring-smart-sage/50"}
  `;

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6">
      <div className="bg-[#F7F3E9] rounded-[60px] p-12 w-full max-w-2xl shadow-2xl relative border-4 border-white animate-in zoom-in max-h-[95vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={handleClose}
          className="absolute top-8 right-8 text-gray-400 hover:text-black bg-white p-2 rounded-full shadow-sm"
        >
          <X size={24} />
        </button>

        <div className="mb-10 text-left">
          <h2 className="text-5xl font-black text-smart-teal tracking-tighter italic leading-none">
            Nouvel Espace
          </h2>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
            Saisie du patrimoine étatique
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isLockedCentre && (
            <div className="bg-white p-5 rounded-[25px] border border-smart-sage/30 shadow-sm">
              <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">
                Centre rattaché automatiquement
              </label>
              <p className="text-sm font-black text-smart-teal mt-2">
                {lockedCentreName || "Mon Centre"}
              </p>
            </div>
          )}

          {/* Nom du local */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 ml-5 uppercase">
              Désignation
            </label>
            <input
              className={inputStyle("nom")}
              placeholder="ex: Grand Théâtre, Salle de réunion..."
              value={form.nom}
              onChange={(e) => {
                setForm({ ...form, nom: e.target.value });
                if (errors.nom) setErrors({ ...errors, nom: null });
              }}
            />
            {errors.nom && <ErrorMsg msg={errors.nom} />}
          </div>

          <div
            className={`grid grid-cols-1 ${isLockedCentre ? "" : "md:grid-cols-2"} gap-6`}
          >
            {/* Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-5 uppercase">
                Catégorie
              </label>
              <select
                className={inputStyle("type")}
                value={isCustomType ? "AUTRE" : form.type}
                onChange={(e) => {
                  if (e.target.value === "AUTRE") {
                    setIsCustomType(true);
                    setForm({ ...form, type: "" });
                  } else {
                    setIsCustomType(false);
                    setForm({ ...form, type: e.target.value });
                  }
                  if (errors.type) setErrors({ ...errors, type: null });
                }}
              >
                <option value="">Sélectionner...</option>
                <option value="CULTURE">🎭 Culture / Théâtre</option>
                <option value="SPORT">⚽ Sport / Terrain</option>
                <option value="INFORMATIQUE">💻 Informatique</option>
                <option value="AUTRE">✨ Autre (Saisir...)</option>
              </select>
              {errors.type && <ErrorMsg msg={errors.type} />}
            </div>

            {!isLockedCentre && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 ml-5 uppercase">
                  Région
                </label>
                <select
                  dir="rtl"
                  className={inputStyle("gouv")}
                  value={selectedGouv}
                  onChange={(e) => {
                    setSelectedGouv(e.target.value);
                    setForm({ ...form, id_centre: "" });
                    if (errors.gouv) setErrors({ ...errors, gouv: null });
                  }}
                >
                  <option value="">كل الولايات...</option>
                  {GOUVERNORATS_AR.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                {errors.gouv && <ErrorMsg msg={errors.gouv} />}
              </div>
            )}
          </div>

          {isCustomType && (
            <div className="animate-in fade-in slide-in-from-top-1">
              <input
                className={inputStyle("type")}
                placeholder="PRÉCISEZ LE TYPE D'ESPACE..."
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value.toUpperCase() })
                }
              />
            </div>
          )}

          {/* Choix du centre */}
          {!isLockedCentre && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-5 uppercase flex items-center gap-2">
                <Building2 size={12} /> Établissement
              </label>
              <select
                className={inputStyle("id_centre")}
                value={form.id_centre}
                onChange={(e) => {
                  setForm({ ...form, id_centre: e.target.value });
                  if (errors.id_centre)
                    setErrors({ ...errors, id_centre: null });
                }}
              >
                <option value="">Sélectionner le centre de jeunesse...</option>
                {filteredCentres.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
              {errors.id_centre && <ErrorMsg msg={errors.id_centre} />}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Capacité */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-5 uppercase flex items-center gap-2">
                <Users size={12} /> Capacité
              </label>
              <input
                type="text"
                className={inputStyle("capacite")}
                placeholder="Pers."
                value={form.capacite}
                onChange={(e) =>
                  handleNumericInput(e.target.value, "capacite", false)
                }
              />
              {errors.capacite && <ErrorMsg msg={errors.capacite} />}
            </div>
            {/* Prix */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-5 uppercase flex items-center gap-2">
                <DollarSign size={12} /> Tarif/Heure (DT)
              </label>
              <input
                type="text"
                className={inputStyle("prix_heure")}
                placeholder="0.00"
                value={form.prix_heure}
                onChange={(e) =>
                  handleNumericInput(e.target.value, "prix_heure", true)
                }
              />
              {errors.prix_heure && <ErrorMsg msg={errors.prix_heure} />}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 ml-5 uppercase">
              Localisation précise
            </label>
            <input
              className={inputStyle("")}
              placeholder="ex: Bâtiment A, 1er étage..."
              value={form.localisation}
              onChange={(e) =>
                setForm({ ...form, localisation: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            className="w-full bg-smart-teal text-white py-6 rounded-[35px] font-black text-xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-smart-teal/20 active:scale-95"
          >
            <Check size={28} /> CONFIRMER L'AJOUT
          </button>
        </form>
      </div>
    </div>
  );
};

// --- COMPOSANT ERREUR DÉDIÉ ---
const ErrorMsg = ({ msg }: { msg: string }) => (
  <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase italic ml-5 animate-in fade-in slide-in-from-left-2">
    <AlertCircle size={12} /> {msg}
  </div>
);
