/**
 * EditLocalModal.tsx — Modale de modification d'un local existant.
 *
 * RÔLE :
 *   Formulaire pré-rempli pour modifier les données d'un local/salle.
 *   Mêmes champs qu'AddLocalModal mais avec les données actuelles du local.
 *
 * API : PATCH /salles/:id
 */
import {
  X,
  Save,
  Building2,
  Users,
  DollarSign,
  Map,
  Layers,
  Type,
  MapPinned,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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

const DEFAULT_TYPES = ["CULTURE", "SPORT", "INFORMATIQUE", "REUNION"];

export const EditLocalModal = ({
  isOpen,
  onClose,
  local,
  centres,
  onRefresh,
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

  // 🔄 INITIALISATION (Fonctionnalité préservée à 100%)
  useEffect(() => {
    if (isOpen && local) {
      setForm({
        nom: local.nom || "",
        type: local.type || "",
        capacite: local.capacite?.toString() || "0",
        localisation: local.localisation || "",
        prix_heure: local.prix_heure?.toString() || "0",
        id_centre: local.id_centre || "",
      });

      const custom = local.type && !DEFAULT_TYPES.includes(local.type);
      setIsCustomType(custom);

      if (centres && local.id_centre) {
        const centreAssocie = centres.find(
          (c: any) => c.id === local.id_centre,
        );
        if (centreAssocie) setSelectedGouv(centreAssocie.gouvernorat);
      }
      setErrors({});
    }
  }, [isOpen, local, centres]);

  const filteredCentres = useMemo(() => {
    if (!centres) return [];
    return centres.filter(
      (c: any) => !selectedGouv || c.gouvernorat === selectedGouv,
    );
  }, [centres, selectedGouv]);

  const handleNumericInput = (
    value: string,
    field: string,
    isDecimal: boolean = false,
  ) => {
    let sanitized = isDecimal
      ? value.replace(/[^0-9.,]/g, "").replace(",", ".")
      : value.replace(/[^0-9]/g, "");
    setForm({ ...form, [field]: sanitized });
  };

  const handleUpdate = async (e: any) => {
    e.preventDefault();
    if (!form.nom.trim()) return setErrors({ nom: "Obligatoire" });

    try {
      await api.patch(
        `/locaux/${local.id}`,
        {
          ...form,
          capacite: parseInt(form.capacite || "0"),
          prix_heure: parseFloat(form.prix_heure || "0"),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  // Style "Michelle" des inputs
  const inputStyle = (field: string) => `
    w-full p-5 bg-white rounded-[25px] border-none outline-none shadow-sm font-bold text-smart-teal 
    transition-all focus:ring-4 ${errors[field] ? "ring-2 ring-red-400" : "focus:ring-smart-sage/40"}
  `;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#1A1C1E]/85 backdrop-blur-md p-6">
      <div className="bg-[#F7F3E9] rounded-[60px] p-12 w-full max-w-3xl shadow-2xl relative border-4 border-white animate-in zoom-in duration-300 max-h-[95vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-400 hover:text-black bg-white p-2 rounded-full shadow-sm hover:rotate-90 transition-all"
        >
          <X size={24} />
        </button>

        {/* Header Section */}
        <div className="mb-12 flex items-center gap-6">
          <div className="w-20 h-20 bg-smart-teal text-white rounded-[30px] flex items-center justify-center shadow-lg shadow-smart-teal/20 italic font-black text-3xl">
            {form.nom ? form.nom[0].toUpperCase() : "E"}
          </div>
          <div>
            <h2 className="text-5xl font-black text-smart-teal tracking-tighter italic leading-none">
              Mise à jour
            </h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">
              Édition du patrimoine local
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-8">
          {/* Section : Désignation */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 ml-6 uppercase flex items-center gap-2">
              <Layers size={14} /> Désignation de l'espace
            </label>
            <input
              className={inputStyle("nom")}
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Nom du local..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Section : Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-6 uppercase flex items-center gap-2">
                <Type size={14} /> Type d'infrastructure
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
                }}
              >
                {DEFAULT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="AUTRE">✨ AUTRE (DÉFINIR...)</option>
              </select>
            </div>

            {/* Section : Gouvernorat */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-6 uppercase flex items-center gap-2">
                <Map size={14} /> Région administrative
              </label>
              <select
                dir="rtl"
                className={inputStyle("gouv")}
                value={selectedGouv}
                onChange={(e) => setSelectedGouv(e.target.value)}
              >
                {GOUVERNORATS_AR.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Champ dynamique Type Autre */}
          {isCustomType && (
            <div className="animate-in fade-in slide-in-from-top-2">
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

          {/* Section : Institution */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 ml-6 uppercase flex items-center gap-2">
              <Building2 size={14} /> Établissement de rattachement
            </label>
            <select
              className={inputStyle("id_centre")}
              value={form.id_centre}
              onChange={(e) => setForm({ ...form, id_centre: e.target.value })}
            >
              {filteredCentres.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Section : Capacité et Prix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-6 uppercase flex items-center gap-2">
                <Users size={14} /> Capacité d'accueil
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={inputStyle("capacite")}
                  value={form.capacite}
                  onChange={(e) =>
                    handleNumericInput(e.target.value, "capacite", false)
                  }
                  placeholder="0"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase">
                  Pers.
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-6 uppercase flex items-center gap-2">
                <DollarSign size={14} /> Tarif de location / h
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={inputStyle("prix_heure")}
                  value={form.prix_heure}
                  onChange={(e) =>
                    handleNumericInput(e.target.value, "prix_heure", true)
                  }
                  placeholder="0.00"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase">
                  TND
                </span>
              </div>
            </div>
          </div>

          {/* Section : Localisation interne */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 ml-6 uppercase flex items-center gap-2">
              <MapPinned size={14} /> Localisation précise
            </label>
            <input
              className={inputStyle("")}
              value={form.localisation}
              onChange={(e) =>
                setForm({ ...form, localisation: e.target.value })
              }
              placeholder="ex: Bloc Nord, 2ème porte..."
            />
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              className="w-full bg-smart-teal text-white py-6 rounded-[35px] font-black text-xl shadow-xl shadow-smart-teal/30 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
            >
              <Save size={24} />
              ENREGISTRER LES MODIFICATIONS
            </button>
            <p className="text-center mt-6 text-[9px] font-bold text-gray-300 uppercase tracking-widest italic opacity-60">
              Système de gestion du patrimoine national v2.0
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
