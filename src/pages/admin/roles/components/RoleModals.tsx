/**
 * RoleModals.tsx — Modales de création, modification et suppression d'un grade.
 *
 * RÔLE :
 *   Composant modal multi-mode pour la gestion des grades de club.
 *
 * MODES (prop `type`) :
 *   'create' — Formulaire de création d'un nouveau grade
 *   'edit'   — Formulaire pré-rempli de modification
 *   'delete' — Popup de confirmation de suppression
 *
 * API :
 *   POST /roles (create) | PATCH /roles/:id (edit) | DELETE /roles/:id (delete)
 */
import { X, ShieldAlert, Save } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../../../api/axios";

export const RoleModals = ({
  type,
  data,
  onClose,
  onRefresh,
  showAlert,
}: any) => {
  const [form, setForm] = useState({ nom: "", description: "" });
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (data && type === "EDIT")
      setForm({ nom: data.nom, description: data.description || "" });
    else setForm({ nom: "", description: "" });
  }, [data, type]);

  if (!type) return null;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (type === "ADD")
        await api.post("/roles", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      else
        await api.patch(`/roles/${data.id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });

      onRefresh();
      onClose();
      showAlert(type === "ADD" ? "Grade créé" : "Grade mis à jour", "success");
    } catch {
      showAlert("Erreur opération", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/roles/${data.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onRefresh();
      onClose();
      showAlert("Grade supprimé", "success");
    } catch {
      showAlert("Action impossible : grade utilisé", "error");
    }
  };

  const inputStyle =
    "w-full p-4 bg-smart-bg rounded-xl outline-none font-bold text-xs text-smart-teal border-none focus:ring-2 focus:ring-smart-sage transition-all";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-[#1A1C1E]/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[40px] p-10 max-w-sm w-full shadow-2xl border-4 border-white animate-in zoom-in">
        {type === "DELETE" ? (
          <div className="text-center">
            <ShieldAlert
              size={40}
              className="text-smart-salmon mx-auto mb-4 animate-bounce"
            />
            <h3 className="text-xl font-black text-[#1A1C1E] mb-2 italic">
              Suppression
            </h3>
            <p className="text-gray-400 text-xs mb-8">
              Retirer définitivement{" "}
              <span className="text-smart-salmon font-bold">"{data.nom}"</span>{" "}
              ?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleDelete}
                className="w-full bg-smart-salmon text-white py-4 rounded-2xl font-black text-xs hover:bg-red-600"
              >
                CONFIRMER
              </button>
              <button
                onClick={onClose}
                className="w-full text-gray-300 font-black text-[10px] uppercase"
              >
                ANNULER
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black text-smart-teal italic">
                {type === "ADD" ? "Nouveau Grade" : "Modifier Grade"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-300 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>
            <input
              required
              placeholder="NOM DU RÔLE..."
              className={inputStyle}
              value={form.nom}
              onChange={(e) =>
                setForm({ ...form, nom: e.target.value.toUpperCase() })
              }
            />
            <textarea
              placeholder="Description des droits..."
              className={`${inputStyle} h-24 resize-none`}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <button
              type="submit"
              className="w-full bg-smart-teal text-white py-4 rounded-2xl font-black text-xs shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all"
            >
              <Save size={16} /> {type === "ADD" ? "CRÉER" : "METTRE À JOUR"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
