import { X, FileText, MapPin, Map, AlertCircle } from "lucide-react";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import api from "../../../api/axios";
import { getCategoryIcon, ALL_CATEGORIES } from "./AddClubModal";
import { PlanningInput } from "./PlanningInput";

export const EditClubModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  salles,
  categories,
}: any) => {
  const [selectedGouvernorat, setSelectedGouvernorat] = useState("");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any[]>([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (isOpen) {
      setLogoPreview(formData.logo_url || "");
      const isCustom =
        formData.categorie &&
        !ALL_CATEGORIES.some((c: any) => c.id === formData.categorie);
      setIsCustomCategory(isCustom);

      if (formData.staff) {
        setSelectedStaff(
          formData.staff.map((s: any) => ({
            id_utilisateur: s.id_utilisateur || s.utilisateur?.id,
            role_dans_club: s.role_dans_club,
          })),
        );
      }

      if (formData.id_salle) {
        const salle = salles.find((s: any) => s.id === formData.id_salle);
        if (salle) setSelectedGouvernorat(salle.gouvernorat);
      }
    }
  }, [isOpen, formData, salles]);

  useEffect(() => {
    if (formData.id_salle && isOpen) {
      api
        .get(`/users/staff/${formData.id_salle}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setStaffList(res.data))
        .catch(() => setStaffList([]));
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
        setFormData((prev: any) => ({ ...prev, logo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    },
    [setFormData],
  );

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSubmit(e, { ...formData, staff: selectedStaff });
  };

  if (!isOpen) return null;

  const getFullImageUrl = (url?: string) => {
    if (!url || url.startsWith("data:")) return url || "";
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${api.defaults.baseURL || "http://localhost:3000"}${cleanPath}`;
  };

  const inputCls =
    "w-full p-4 bg-white rounded-[20px] font-bold text-sm outline-none border-none shadow-sm text-smart-teal transition-all focus:ring-4 focus:ring-smart-sage/50";

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#1A1C1E]/65 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#F7F3E9] rounded-[40px] p-8 w-full max-w-3xl shadow-2xl relative border-4 border-white my-8 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-black"
        >
          <X size={20} />
        </button>

        <h2 className="text-3xl font-black text-smart-teal mb-8">
          Modifier le Club
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className="flex items-center gap-4 p-4 bg-white rounded-[20px] cursor-pointer border-2 border-dashed border-gray-200"
            onClick={() => fileRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-2xl bg-smart-sage/20 flex items-center justify-center relative overflow-hidden shrink-0">
              <span className="text-2xl">
                {getCategoryIcon(formData.categorie, categories)}
              </span>
              {logoPreview && (
                <img
                  src={
                    logoPreview.startsWith("data:")
                      ? logoPreview
                      : getFullImageUrl(logoPreview)
                  }
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </div>
            <p className="font-bold text-sm text-smart-teal">
              Cliquer pour changer le logo
            </p>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleLogoUpload(e.target.files[0])
              }
            />
          </div>

          {/* 💡 AJOUTS : Capacite et Locale */}
          <input
            className={inputCls}
            value={formData.nom || ""}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            placeholder="Nom du club *"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Capacité maximale"
              className={inputCls}
              value={formData.capacite || ""}
              onChange={(e) =>
                setFormData({ ...formData, capacite: e.target.value })
              }
            />
            <input
              placeholder="Locale (ex: Salle 1)"
              className={inputCls}
              value={formData.locale || ""}
              onChange={(e) =>
                setFormData({ ...formData, locale: e.target.value })
              }
            />
          </div>
          <textarea
            className={`${inputCls} h-24`}
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Description..."
          />

          {/* Catégories */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-smart-teal/50">
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
                className={inputCls}
                placeholder="Saisir la catégorie..."
                value={formData.categorie || ""}
                onChange={(e) =>
                  setFormData({ ...formData, categorie: e.target.value })
                }
              />
            )}
          </div>

          {/* Staff */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-smart-teal/50">
              Staff affecté
            </label>
            {staffList.map((s: any) => {
              const isSelected = selectedStaff.find(
                (item) => item.id_utilisateur === s.id,
              );
              return (
                <div
                  key={s.id}
                  className="flex justify-between items-center p-3 bg-white rounded-2xl border border-gray-100"
                >
                  <span className="text-sm font-bold text-smart-teal">
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
                    className={`text-[10px] font-black px-4 py-2 rounded-lg ${isSelected ? "bg-red-50 text-red-500" : "bg-smart-sage/20 text-smart-teal"}`}
                  >
                    {isSelected ? "Retirer" : "Ajouter"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Localisation */}
          <div className="grid grid-cols-2 gap-4">
            <select
              className={inputCls}
              value={selectedGouvernorat}
              onChange={(e) => {
                setSelectedGouvernorat(e.target.value);
                setFormData({ ...formData, id_salle: "" });
              }}
            >
              <option value="">🗺️ Gouvernorat...</option>
              {gouvernorats.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <select
              className={inputCls}
              value={formData.id_salle}
              onChange={(e) =>
                setFormData({ ...formData, id_salle: e.target.value })
              }
            >
              <option value="">Centre *</option>
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
            className="w-full bg-smart-teal text-white py-4 rounded-[25px] font-black hover:bg-black transition-all"
          >
            Enregistrer les modifications
          </button>
        </form>
      </div>
    </div>
  );
};
