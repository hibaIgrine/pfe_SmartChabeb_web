import {
  X,
  Map,
  Building2,
  ChevronRight,
  CheckCircle,
  Clock3,
} from "lucide-react";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { PlanningInput } from "./PlanningInput";
import api from "../../../api/axios";
import { getCategoryIcon, ALL_CATEGORIES } from "./AddClubModal";

const validateForm = (data: any, lockedCentreId?: string) => {
  const errors: any = {};
  if (!data.nom || data.nom.trim().length < 3) errors.nom = "Nom trop court.";
  if (!data.categorie) errors.categorie = "Catégorie requise.";
  if (!lockedCentreId && !data.id_salle)
    errors.id_salle = "Établissement requis.";
  if (!data.locale) errors.locale = "Veuillez choisir un local.";
  if (data.capacite === "" || parseInt(data.capacite) <= 0)
    errors.capacite = "Invalide.";
  if (!Array.isArray(data.objectifs) || data.objectifs.length === 0)
    errors.objectifs = "Ajoutez au moins un objectif.";

  if (data.planning) {
    try {
      const parsed =
        typeof data.planning === "string"
          ? JSON.parse(data.planning)
          : data.planning;
      const slots = Array.isArray(parsed?.slots) ? parsed.slots : [];

      const hasInvalidRange = slots.some((slot: any) => {
        const start = slot?.startTime;
        const end = slot?.endTime;
        if (!start || !end) return true;
        return start >= end;
      });

      if (hasInvalidRange) {
        errors.planning =
          "Heure invalide: l'heure de fin doit être strictement après l'heure de début.";
      }
    } catch {
      errors.planning = "Planning invalide.";
    }
  }

  return errors;
};

const FR_DAY_TO_INDEX: Record<string, number> = {
  Dimanche: 0,
  Lundi: 1,
  Mardi: 2,
  Mercredi: 3,
  Jeudi: 4,
  Vendredi: 5,
  Samedi: 6,
};

const formatDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getNextDateForFrenchDay = (dayLabel: string) => {
  const targetIndex = FR_DAY_TO_INDEX[dayLabel] ?? 1;
  const nextDate = new Date();
  const currentIndex = nextDate.getDay();
  let daysUntilTarget = (targetIndex - currentIndex + 7) % 7;
  if (daysUntilTarget === 0) daysUntilTarget = 7;
  nextDate.setDate(nextDate.getDate() + daysUntilTarget);
  return nextDate;
};

export const EditClubModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData = {},
  setFormData = () => {},
  salles = [],
  categories = [],
  lockedCentreId,
  lockedCentreName,
}: any) => {
  const [selectedGouvernorat, setSelectedGouvernorat] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [localList, setLocalList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any[]>([]);
  const [selectedResponsableId, setSelectedResponsableId] = useState("");
  const [objectifInput, setObjectifInput] = useState("");
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const token = localStorage.getItem("token");
  const LOCAL_STORAGE_KEY = "editclub_selected_local";

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

      setSelectedResponsableId(formData.id_coach || "");

      if (formData.id_salle) {
        const salle = salles.find((s: any) => s.id === formData.id_salle);
        if (salle) setSelectedGouvernorat(salle.gouvernorat);
      }
    }
  }, [isOpen, formData, salles]);

  useEffect(() => {
    if (formData.id_salle && isOpen) {
      const headers = { Authorization: `Bearer ${token}` };

      api
        .get(`/users/staff-by-centre/${formData.id_salle}`, { headers })
        .then((res) => setStaffList(res.data))
        .catch(() => setStaffList([]));

      api
        .get(`/locaux?id_centre=${formData.id_salle}`, { headers })
        .then((res) => {
          setLocalList(res.data);
          // Initialiser le local si formData.id_local existe
          if (formData.id_local && !formData.locale) {
            const local = res.data.find((l: any) => l.id === formData.id_local);
            if (local) {
              setFormData((prev: any) => ({
                ...prev,
                locale: local.nom,
              }));
            }
          }
        })
        .catch(() => setLocalList([]));
    } else {
      setStaffList([]);
      setLocalList([]);
      setSelectedStaff([]);
      setSelectedResponsableId("");
    }
  }, [formData.id_salle, isOpen, token]);

  useEffect(() => {
    if (isOpen && lockedCentreId && formData.id_salle !== lockedCentreId) {
      setFormData((prev: any) => ({
        ...prev,
        id_salle: lockedCentreId,
      }));
    }
  }, [isOpen, lockedCentreId, formData.id_salle, setFormData]);

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
    const errs = validateForm(formData, lockedCentreId);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const isAvailable = await checkAvailability();
    if (!isAvailable) {
      return;
    }

    let parsedPlanning: any = {};
    try {
      parsedPlanning = formData.planning
        ? typeof formData.planning === "string"
          ? JSON.parse(formData.planning)
          : formData.planning
        : {};
    } catch {
      parsedPlanning = {};
    }

    const payload = {
      ...formData,
      planning: {
        ...parsedPlanning,
        objectifs: Array.isArray(formData.objectifs) ? formData.objectifs : [],
      },
      staff: selectedStaff.filter(
        (s) => s.id_utilisateur !== selectedResponsableId,
      ),
      id_coach:
        selectedResponsableId ||
        selectedStaff.find((s) => s.role_dans_club === "COACH")
          ?.id_utilisateur ||
        formData.id_coach,
      // S'assurer que le local est sauvegardé
      id_local: formData.id_local,
      locale: formData.locale,
    };
    onSubmit(e, payload);
  };

  const addObjectif = () => {
    const value = objectifInput.trim();
    if (!value) return;
    const current = Array.isArray(formData.objectifs) ? formData.objectifs : [];
    if (current.includes(value)) return;
    setFormData({
      ...formData,
      objectifs: [...current, value],
    });
    setObjectifInput("");
    setErrors({ ...errors, objectifs: null });
  };

  const removeObjectif = (objectifToRemove: string) => {
    const current = Array.isArray(formData.objectifs) ? formData.objectifs : [];
    setFormData({
      ...formData,
      objectifs: current.filter(
        (objectif: string) => objectif !== objectifToRemove,
      ),
    });
  };

  const checkAvailability = async () => {
    const localId = formData.id_local;
    let parsedPlanning: any = {};

    try {
      parsedPlanning = formData.planning
        ? typeof formData.planning === "string"
          ? JSON.parse(formData.planning)
          : formData.planning
        : {};
    } catch {
      setAvailabilityMessage("Planning invalide.");
      return false;
    }

    const slots = Array.isArray(parsedPlanning?.slots)
      ? parsedPlanning.slots
      : [];

    if (!localId || slots.length === 0) {
      setAvailabilityMessage(
        "Choisissez un local et ajoutez au moins un créneau pour vérifier.",
      );
      return false;
    }

    setCheckingAvailability(true);
    setAvailabilityMessage("");

    try {
      for (const slot of slots) {
        if (!slot?.day || !slot?.startTime || !slot?.endTime) {
          setAvailabilityMessage("Complétez tous les créneaux du planning.");
          return false;
        }

        const date = formatDateOnly(getNextDateForFrenchDay(slot.day));
        const response = await api.get(
          `/reservations/check?id_local=${localId}&date=${date}&start=${slot.startTime}&end=${slot.endTime}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!response.data?.available) {
          setAvailabilityMessage(
            `Indisponible: ${slot.day} de ${slot.startTime} à ${slot.endTime}.`,
          );
          return false;
        }
      }

      setAvailabilityMessage("Tous les créneaux sont disponibles.");
      return true;
    } catch {
      setAvailabilityMessage("Vérification de disponibilité indisponible.");
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    setLogoPreview("");
    setSelectedGouvernorat("");
    setSelectedStaff([]);
    setSelectedResponsableId("");
    setObjectifInput("");
    setAvailabilityMessage("");
    setIsCustomCategory(false);
    onClose();
  };

  const planningPreview = useMemo(() => {
    try {
      const parsed = formData.planning
        ? typeof formData.planning === "string"
          ? JSON.parse(formData.planning)
          : formData.planning
        : {};
      const slots = Array.isArray(parsed?.slots) ? parsed.slots : [];

      if (slots.length === 0) {
        return "Ajoutez des créneaux pour afficher la prévisualisation.";
      }

      return slots
        .map((slot: any) => {
          if (!slot?.day || !slot?.startTime || !slot?.endTime) {
            return "Créneau incomplet";
          }
          return `Chaque ${String(slot.day).toLowerCase()} de ${slot.startTime} à ${slot.endTime}`;
        })
        .join(" | ");
    } catch {
      return "Planning invalide.";
    }
  }, [formData.planning]);

  const getFullImageUrl = (url?: string) => {
    if (!url || url.startsWith("data:")) return url || "";
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${api.defaults.baseURL || "http://localhost:3000"}${cleanPath}`;
  };

  if (!isOpen) return null;

  const inputCls = (err?: string) =>
    `w-full p-4 bg-white rounded-[20px] font-bold text-sm outline-none border-none shadow-sm text-smart-teal transition-all ${
      err ? "ring-2 ring-red-400" : "focus:ring-4 focus:ring-smart-sage/50"
    }`;

  const inputWithErrorCls = (err?: string) =>
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
          Modifier le Club
        </h2>

        <form onSubmit={handleSubmit} className="space-y-7" noValidate>
          {/* 📍 SECTION 1 : LOCALISATION (Gouvernorat & Centre) */}
          {lockedCentreId ? (
            <div className="bg-white/40 p-6 rounded-[30px] border border-white space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Centre rattaché automatiquement
              </label>
              <div className="rounded-[20px] bg-white px-4 py-3 border border-smart-sage/30">
                <p className="text-sm font-black text-smart-teal">
                  {lockedCentreName || "Mon Centre"}
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                  Le club reste attaché à ce centre
                </p>
              </div>
            </div>
          ) : (
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
                  <div className="flex items-center gap-2">
                    <select
                      className={`${inputWithErrorCls()} pl-11 flex-1`}
                      value={selectedGouvernorat}
                      onChange={(e) => {
                        setSelectedGouvernorat(e.target.value);
                        setFormData({
                          ...formData,
                          id_salle: "",
                          locale: "",
                          id_local: "",
                        });
                      }}
                    >
                      <option value="">Région / Gouvernorat...</option>
                      {gouvernorats.map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                    {errors.gouvernorat && (
                      <p className="text-red-500 text-[10px] font-black ml-2 uppercase">
                        {errors.gouvernorat}
                      </p>
                    )}
                  </div>
                </div>
                <div className="relative group">
                  <Building2
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 z-10"
                    size={16}
                  />
                  <div className="flex items-center gap-2">
                    <select
                      required
                      className={`${inputWithErrorCls(errors.id_salle)} pl-11 flex-1`}
                      value={formData.id_salle || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          id_salle: e.target.value,
                          locale: "",
                          id_local: "",
                        });
                        setSelectedResponsableId("");
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
                    {errors.id_salle && (
                      <p className="text-red-500 text-[10px] font-black ml-2 uppercase">
                        {errors.id_salle}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && handleLogoUpload(e.target.files[0])
                }
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  required
                  placeholder="Nom officiel du club *"
                  className={inputWithErrorCls(errors.nom)}
                  value={formData.nom || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, nom: e.target.value });
                    setErrors({ ...errors, nom: null });
                  }}
                />
                {errors.nom && (
                  <p className="text-red-500 text-[10px] font-black ml-2 uppercase">
                    {errors.nom}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Capacité d'accueil"
                      className={inputWithErrorCls(errors.capacite)}
                      value={formData.capacite || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capacite: e.target.value.replace(/[^0-9]/g, ""),
                        })
                      }
                    />
                    {errors.capacite && (
                      <p className="text-red-500 text-[10px] font-black ml-2 uppercase">
                        {errors.capacite}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-smart-teal/50 uppercase tracking-widest ml-1">
                  Objectifs du club
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <input
                      value={objectifInput}
                      onChange={(e) => setObjectifInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addObjectif();
                        }
                      }}
                      placeholder="Ajouter un objectif"
                      className={inputWithErrorCls(errors.objectifs)}
                    />
                    {errors.objectifs && (
                      <p className="text-red-500 text-[10px] font-black ml-2 uppercase">
                        {errors.objectifs}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={addObjectif}
                    className="px-4 py-3 rounded-2xl bg-smart-teal text-white text-xs font-black uppercase tracking-wide"
                  >
                    Ajouter
                  </button>
                </div>
                {Array.isArray(formData.objectifs) &&
                  formData.objectifs.length > 0 && (
                    <ul className="space-y-2 rounded-2xl bg-white p-4 border border-gray-100">
                      {formData.objectifs.map((objectif: string) => (
                        <li
                          key={objectif}
                          className="flex items-center justify-between text-xs font-bold text-smart-teal"
                        >
                          <span>• {objectif}</span>
                          <button
                            type="button"
                            onClick={() => removeObjectif(objectif)}
                            className="text-red-500"
                          >
                            Retirer
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>

              <div className="flex items-center gap-2">
                <textarea
                  placeholder="Description de l'activité..."
                  className={`${inputWithErrorCls(errors.description)} min-h-[90px] flex-1`}
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
                {errors.description && (
                  <p className="text-red-500 text-[10px] font-black ml-2 uppercase">
                    {errors.description}
                  </p>
                )}
              </div>
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
              <div className="flex items-center gap-2">
                <input
                  required
                  placeholder="Saisissez la catégorie personnalisée..."
                  className={inputWithErrorCls(errors.categorie)}
                  value={formData.categorie || ""}
                  onChange={(e) => {
                    setFormData({ ...formData, categorie: e.target.value });
                    setErrors({ ...errors, categorie: null });
                  }}
                />
                {errors.categorie && (
                  <p className="text-red-500 text-[10px] font-black ml-2 uppercase">
                    {errors.categorie}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 🧑‍🤝‍🧑 SECTION 4 : STAFF */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-smart-teal/50 uppercase tracking-widest ml-1">
              Responsables et Animateurs
            </label>
            <div className="bg-white/70 rounded-2xl border border-white p-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block mb-2 ml-1">
                Responsable du club
              </label>
              <div className="flex items-center gap-2">
                <select
                  disabled={!formData.id_salle || staffList.length === 0}
                  className={inputWithErrorCls()}
                  value={selectedResponsableId}
                  onChange={(e) => setSelectedResponsableId(e.target.value)}
                >
                  <option value="">Aucun responsable sélectionné</option>
                  {staffList.map((s: any) => (
                    <option key={`resp-${s.id}`} value={s.id}>
                      {s.nom} {s.prenom} ({s.role})
                    </option>
                  ))}
                </select>
                {errors.id_coach && (
                  <p className="text-red-500 text-[10px] font-black ml-2 uppercase">
                    {errors.id_coach}
                  </p>
                )}
              </div>
              <p className="text-[9px] text-gray-400 font-bold ml-1 mt-2 uppercase tracking-wide">
                Ce membre sera enregistré comme responsable du club.
              </p>
            </div>
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
          <div className="rounded-[28px] border border-gray-100 bg-[#F7F3E9] p-5 space-y-4">
            <div>
              <h4 className="text-sm font-black text-[#244047]">
                Planning hebdomadaire
              </h4>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Configurez les créneaux du club, puis vérifiez la disponibilité
                du local.
              </p>
            </div>

            <div className="rounded-[24px] bg-white p-4 border border-[#D9E8D1] flex items-start gap-3">
              <Clock3 size={18} className="text-[#436D75] mt-0.5" />
              <div>
                <p className="text-sm font-black text-[#244047]">
                  Prévisualisation
                </p>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  {planningPreview}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <PlanningInput
                value={formData.planning}
                onChange={(val) => {
                  setFormData({ ...formData, planning: val });
                  setErrors((prev: any) => ({ ...prev, planning: null }));
                }}
                className="flex-1"
              />
              {errors.planning && (
                <p className="text-red-500 text-[10px] font-black ml-2 uppercase">
                  {errors.planning}
                </p>
              )}
            </div>
          </div>

          {/* 📍 SECTION 6 : LOCAL */}
          <div className="rounded-[28px] border border-gray-100 bg-white p-5 space-y-4">
            <div>
              <h4 className="text-sm font-black text-[#244047]">
                Local de votre centre
              </h4>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Les locaux affichés ici proviennent uniquement du centre
                sélectionné.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Local souhaité
              </label>
              <div className="flex items-center gap-2">
                <select
                  required
                  disabled={!formData.id_salle}
                  className="w-full rounded-2xl border bg-[#F8FAFC] px-4 py-3 text-sm font-semibold outline-none border-gray-200 flex-1"
                  value={formData.id_local || ""}
                  onChange={(e) => {
                    const selected = localList.find(
                      (l: any) => l.id === e.target.value,
                    );
                    setFormData({
                      ...formData,
                      id_local: e.target.value,
                      locale: selected?.nom || "",
                    });
                    setErrors({ ...errors, locale: null });
                  }}
                >
                  <option value="">
                    {formData.id_salle
                      ? "Choisir la salle / le terrain *"
                      : "En attente du centre..."}
                  </option>
                  {localList.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.nom} ({l.type})
                    </option>
                  ))}
                </select>
                {errors.locale && (
                  <p className="text-red-500 text-[10px] font-black ml-2 uppercase">
                    {errors.locale}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void checkAvailability()}
                disabled={checkingAvailability}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#436D75] px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-sm disabled:opacity-60"
              >
                <ChevronRight size={14} />
                {checkingAvailability
                  ? "Vérification..."
                  : "Vérifier la disponibilité"}
              </button>
              {availabilityMessage && (
                <span className="text-xs font-bold text-gray-600">
                  {availabilityMessage}
                </span>
              )}
            </div>
          </div>

          {/* 🚀 SUBMIT */}
          <button
            type="submit"
            className="w-full bg-smart-teal text-white py-5 rounded-[30px] font-black text-lg shadow-xl shadow-smart-teal/20 hover:bg-black transition-all flex items-center justify-center gap-3"
          >
            <CheckCircle size={22} /> ENREGISTRER LES MODIFICATIONS
          </button>
        </form>
      </div>
    </div>
  );
};
