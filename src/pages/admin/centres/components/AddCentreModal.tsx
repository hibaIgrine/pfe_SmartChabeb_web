import {
  X,
  Check,
  Building2,
  Map,
  MapPin,
  Hash,
  Phone,
  AlertCircle,
  Home,
} from "lucide-react";
import { useState } from "react";
import api from "../../../../api/axios";

export const AddCentreModal = ({
  isOpen,
  onClose,
  onRefresh,
  gouvernorats,
}: any) => {
  const [form, setForm] = useState({
    nom: "",
    gouvernorat: "",
    delegation: "",
    code_postal: "",
    adresse: "",
    telephone_centre: "",
  });

  const [errors, setErrors] = useState<any>({});
  const token = localStorage.getItem("token");

  if (!isOpen) return null;

  // 🛡️ LOGIQUE DE VALIDATION STRICTE
  const validate = () => {
    let newErrors: any = {};

    if (!form.nom.trim()) newErrors.nom = "Désignation obligatoire";
    if (!form.gouvernorat)
      newErrors.gouvernorat = "Veuillez choisir une région";
    if (!form.delegation.trim())
      newErrors.delegation = "La délégation est requise";

    if (form.code_postal.length !== 4) {
      newErrors.code_postal = "Le CP doit comporter exactement 4 chiffres";
    }

    if (form.telephone_centre.length !== 8) {
      newErrors.telephone_centre = "Le numéro doit comporter 8 chiffres";
    }

    if (!form.adresse.trim())
      newErrors.adresse = "L'adresse physique est obligatoire";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await api.post("/centres", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh();
      handleClose();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrors({ nom: "Ce nom d'établissement existe déjà" });
      }
    }
  };

  const handleClose = () => {
    setForm({
      nom: "",
      gouvernorat: "",
      delegation: "",
      code_postal: "",
      adresse: "",
      telephone_centre: "",
    });
    setErrors({});
    onClose();
  };

  // Helper pour le style des inputs avec gestion d'erreur
  const inputStyle = (field: string) => `
    w-full p-4 bg-white rounded-2xl border-none outline-none shadow-sm font-bold text-sm text-smart-teal 
    transition-all focus:ring-4 ${errors[field] ? "ring-2 ring-red-400 focus:ring-red-300" : "focus:ring-smart-sage/50"}
  `;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6">
      <div className="bg-[#F7F3E9] rounded-[60px] p-10 w-full max-w-xl shadow-2xl relative border-4 border-white animate-in zoom-in duration-300 max-h-[95vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={handleClose}
          className="absolute top-8 right-8 text-gray-400 hover:text-black bg-white p-2 rounded-full shadow-sm transition-transform active:scale-90"
        >
          <X size={20} />
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-black text-smart-teal italic leading-none">
            Nouvelle Institution
          </h2>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
            Enregistrement au patrimoine national
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nom du centre */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 ml-4 uppercase flex items-center gap-2">
              <Building2 size={12} /> Nom de l'établissement
            </label>
            <input
              className={inputStyle("nom")}
              placeholder="ex: Maison de Jeunesse..."
              value={form.nom}
              onChange={(e) => {
                setForm({ ...form, nom: e.target.value });
                setErrors({ ...errors, nom: null });
              }}
            />
            {errors.nom && <ErrorField msg={errors.nom} />}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Gouvernorat */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-4 uppercase flex items-center gap-2">
                <Map size={12} /> Région
              </label>
              <select
                dir="rtl"
                className={inputStyle("gouvernorat")}
                value={form.gouvernorat}
                onChange={(e) => {
                  setForm({ ...form, gouvernorat: e.target.value });
                  setErrors({ ...errors, gouvernorat: null });
                }}
              >
                <option value="">اختيار الولاية...</option>
                {gouvernorats.map((g: string) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {errors.gouvernorat && <ErrorField msg={errors.gouvernorat} />}
            </div>

            {/* Délégation */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-4 uppercase flex items-center gap-2">
                <MapPin size={12} /> Délégation
              </label>
              <input
                className={inputStyle("delegation")}
                placeholder="Délégation..."
                value={form.delegation}
                onChange={(e) => {
                  setForm({ ...form, delegation: e.target.value });
                  setErrors({ ...errors, delegation: null });
                }}
              />
              {errors.delegation && <ErrorField msg={errors.delegation} />}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Code Postal */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-4 uppercase flex items-center gap-2">
                <Hash size={12} /> Code Postal
              </label>
              <input
                className={inputStyle("code_postal")}
                placeholder="0000"
                maxLength={4}
                value={form.code_postal}
                onChange={(e) =>
                  setForm({
                    ...form,
                    code_postal: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
              {errors.code_postal && <ErrorField msg={errors.code_postal} />}
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-4 uppercase flex items-center gap-2">
                <Phone size={12} /> Téléphone
              </label>
              <input
                className={inputStyle("telephone_centre")}
                placeholder="00 000 000"
                maxLength={8}
                value={form.telephone_centre}
                onChange={(e) =>
                  setForm({
                    ...form,
                    telephone_centre: e.target.value.replace(/\D/g, ""),
                  })
                }
              />
              {errors.telephone_centre && (
                <ErrorField msg={errors.telephone_centre} />
              )}
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 ml-4 uppercase flex items-center gap-2">
              <Home size={12} /> Adresse Géographique
            </label>
            <textarea
              className={`${inputStyle("adresse")} h-24 resize-none`}
              placeholder="Rue, Quartier, Numéro..."
              value={form.adresse}
              onChange={(e) => {
                setForm({ ...form, adresse: e.target.value });
                setErrors({ ...errors, adresse: null });
              }}
            />
            {errors.adresse && <ErrorField msg={errors.adresse} />}
          </div>

          <button
            type="submit"
            className="w-full bg-smart-teal text-white py-5 rounded-[25px] font-black text-sm shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 shadow-smart-teal/20"
          >
            <Check size={20} /> FINALISER L'INSCRIPTION
          </button>
        </form>
      </div>
    </div>
  );
};

// --- COMPOSANT INTERNE POUR LES ERREURS ---
const ErrorField = ({ msg }: { msg: string }) => (
  <div className="flex items-center gap-1.5 text-[#E98A7D] text-[10px] font-black uppercase italic ml-4 animate-in slide-in-from-left-2">
    <AlertCircle size={12} /> {msg}
  </div>
);
