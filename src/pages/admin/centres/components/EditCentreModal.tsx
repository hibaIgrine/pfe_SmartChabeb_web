/**
 * EditCentreModal.tsx — Modale de modification d'un centre existant.
 *
 * RÔLE :
 *   Formulaire pré-rempli pour modifier les données d'un centre (admin uniquement).
 *   Mêmes champs qu'AddCentreModal mais avec données initiales du centre.
 *
 * API : PATCH /centres/:id
 */
import {
  X,
  Save,
  Building2,
  Map,
  MapPin,
  Hash,
  Phone,
  AlertCircle,
  Home,
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../../../api/axios";

export const EditCentreModal = ({
  isOpen,
  onClose,
  centre,
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

  // 🔄 ÉTAPE 1 : INITIALISATION (PRÉ-REMPLISSAGE)
  // On remplit les champs dès que la modale s'ouvre ou que l'objet 'centre' change
  useEffect(() => {
    if (centre && isOpen) {
      setForm({
        nom: centre.nom || "",
        gouvernorat: centre.gouvernorat || "",
        delegation: centre.delegation || "",
        code_postal: centre.code_postal || "",
        adresse: centre.adresse || "",
        telephone_centre: centre.telephone_centre || "",
      });
      setErrors({}); // On remet les erreurs à zéro
    }
  }, [centre, isOpen]);

  if (!isOpen || !centre) return null;

  // 🛡️ LOGIQUE DE VALIDATION
  const validate = () => {
    let newErrors: any = {};
    if (!form.nom.trim()) newErrors.nom = "Désignation obligatoire";
    if (!form.gouvernorat)
      newErrors.gouvernorat = "Veuillez choisir une région";
    if (!form.delegation.trim())
      newErrors.delegation = "La délégation est requise";
    if (form.code_postal.length !== 4)
      newErrors.code_postal = "4 chiffres requis";
    if (form.telephone_centre.length !== 8)
      newErrors.telephone_centre = "8 chiffres requis";
    if (!form.adresse.trim()) newErrors.adresse = "L'adresse est obligatoire";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await api.patch(`/centres/${centre.id}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh(); // Recharge le tableau principal
      onClose(); // Ferme la modale
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrors({ nom: "Ce nom est déjà utilisé par un autre centre" });
      }
    }
  };

  const inputStyle = (field: string) => `
    w-full p-4 bg-white rounded-2xl border-none outline-none shadow-sm font-bold text-sm text-smart-teal 
    transition-all focus:ring-4 ${errors[field] ? "ring-2 ring-red-400" : "focus:ring-smart-sage/50"}
  `;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#1A1C1E]/80 backdrop-blur-md p-6">
      <div className="bg-[#F7F3E9] rounded-[60px] p-10 w-full max-w-xl shadow-2xl relative border-4 border-white animate-in zoom-in duration-300 max-h-[95vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-400 hover:text-black bg-white p-2 rounded-full shadow-sm transition-all active:scale-90"
        >
          <X size={20} />
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-black text-smart-teal italic leading-none">
            Mise à jour
          </h2>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3 italic opacity-60">
            ID Institutionnel: #{centre.id.slice(0, 8)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 ml-4 uppercase flex items-center gap-2">
              <Building2 size={12} /> Désignation
            </label>
            <input
              className={inputStyle("nom")}
              value={form.nom}
              onChange={(e) => {
                setForm({ ...form, nom: e.target.value });
                if (errors.nom) setErrors({ ...errors, nom: null });
              }}
            />
            {errors.nom && <ErrorField msg={errors.nom} />}
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  if (errors.gouvernorat)
                    setErrors({ ...errors, gouvernorat: null });
                }}
              >
                {gouvernorats.map((g: string) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {errors.gouvernorat && <ErrorField msg={errors.gouvernorat} />}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-4 uppercase flex items-center gap-2">
                <MapPin size={12} /> Délégation
              </label>
              <input
                className={inputStyle("delegation")}
                value={form.delegation}
                onChange={(e) => {
                  setForm({ ...form, delegation: e.target.value });
                  if (errors.delegation)
                    setErrors({ ...errors, delegation: null });
                }}
              />
              {errors.delegation && <ErrorField msg={errors.delegation} />}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-4 uppercase flex items-center gap-2">
                <Hash size={12} /> CP
              </label>
              <input
                className={inputStyle("code_postal")}
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

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-4 uppercase flex items-center gap-2">
                <Phone size={12} /> Contact
              </label>
              <input
                className={inputStyle("telephone_centre")}
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

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 ml-4 uppercase flex items-center gap-2">
              <Home size={12} /> Adresse Physique
            </label>
            <textarea
              className={`${inputStyle("adresse")} h-24 resize-none`}
              value={form.adresse}
              onChange={(e) => {
                setForm({ ...form, adresse: e.target.value });
                if (errors.adresse) setErrors({ ...errors, adresse: null });
              }}
            />
            {errors.adresse && <ErrorField msg={errors.adresse} />}
          </div>

          <button
            type="submit"
            className="w-full bg-[#1A1C1E] text-white py-5 rounded-[25px] font-black text-sm shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 shadow-[#1A1C1E]/20"
          >
            <Save size={20} /> ENREGISTRER LES MODIFICATIONS
          </button>
        </form>
      </div>
    </div>
  );
};

const ErrorField = ({ msg }: { msg: string }) => (
  <div className="flex items-center gap-1.5 text-[#E98A7D] text-[10px] font-black uppercase italic ml-4 animate-in slide-in-from-left-2">
    <AlertCircle size={12} /> {msg}
  </div>
);
