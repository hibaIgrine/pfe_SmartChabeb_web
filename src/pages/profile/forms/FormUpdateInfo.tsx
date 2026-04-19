import { useEffect, useState } from "react";
import { GOVERNORATES } from "../../../constants/governorates";
import { searchEtablissements } from "../../../api/etablissements.api";

type InfoFormValues = {
  nom: string;
  prenom: string;
  email: string;
  bio: string;
  genre: string;
  date_naissance: string;
  lieu_habite: string;
  etablissement_etude: string;
};

type FormUpdateInfoProps = {
  initialValues: InfoFormValues;
  saving: boolean;
  error: string | null;
  success: string | null;
  onCancel: () => void;
  onSubmit: (values: InfoFormValues) => void;
};

export function FormUpdateInfo({
  initialValues,
  saving,
  error,
  success,
  onCancel,
  onSubmit,
}: FormUpdateInfoProps) {
  const [form, setForm] = useState<InfoFormValues>(initialValues);
  const [etablissementSuggestions, setEtablissementSuggestions] = useState<
    string[]
  >([]);
  const [showEtablissementSuggestions, setShowEtablissementSuggestions] =
    useState(false);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  const onChange = (key: keyof InfoFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEtablissementSearch = async (query: string) => {
    onChange("etablissement_etude", query);

    if (!query.trim()) {
      setEtablissementSuggestions([]);
      setShowEtablissementSuggestions(false);
      return;
    }

    try {
      const results = await searchEtablissements(query);
      setEtablissementSuggestions(
        Array.isArray(results) ? results.map((e: any) => e.nom) : [],
      );
      setShowEtablissementSuggestions(true);
    } catch {
      setEtablissementSuggestions([]);
    }
  };

  const handleSelectEtablissement = (nom: string) => {
    onChange("etablissement_etude", nom);
    setShowEtablissementSuggestions(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl rounded-3xl border border-[#DDE9EC] bg-white p-6 shadow-2xl"
    >
      <h3 className="text-xl font-black italic text-[#203A43]">
        Modifier informations personnelles
      </h3>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Nom
          </span>
          <input
            value={form.nom}
            onChange={(e) => onChange("nom", e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#436D75]/40"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Prenom
          </span>
          <input
            value={form.prenom}
            onChange={(e) => onChange("prenom", e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#436D75]/40"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Email
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#436D75]/40"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Genre
          </span>
          <select
            value={form.genre}
            onChange={(e) => onChange("genre", e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#436D75]/40"
          >
            <option value="">Non renseigne</option>
            <option value="HOMME">Homme</option>
            <option value="FEMME">Femme</option>
          </select>
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Date de naissance
          </span>
          <input
            type="date"
            value={form.date_naissance}
            onChange={(e) => onChange("date_naissance", e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#436D75]/40"
          />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Habite a
          </span>
          <select
            value={form.lieu_habite}
            onChange={(e) => onChange("lieu_habite", e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#436D75]/40"
          >
            <option value="">Choisissez un gouvernorat</option>
            {GOVERNORATES.map((gov) => (
              <option key={gov} value={gov}>
                {gov}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 md:col-span-2 relative">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Etudie a
          </span>
          <input
            type="text"
            value={form.etablissement_etude}
            onChange={(e) => handleEtablissementSearch(e.target.value)}
            onFocus={() =>
              form.etablissement_etude && setShowEtablissementSuggestions(true)
            }
            onBlur={() =>
              setTimeout(() => setShowEtablissementSuggestions(false), 200)
            }
            placeholder="Tapez votre lycee ou universite"
            className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#436D75]/40"
          />
          {showEtablissementSuggestions &&
            etablissementSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-48 overflow-y-auto z-10">
                {etablissementSuggestions.map((nom) => (
                  <button
                    key={nom}
                    type="button"
                    onClick={() => handleSelectEtablissement(nom)}
                    className="w-full text-left px-3 py-2 hover:bg-[#F1F6F8] text-sm"
                  >
                    {nom}
                  </button>
                ))}
              </div>
            )}
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Bio
          </span>
          <textarea
            value={form.bio}
            onChange={(e) => onChange("bio", e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#436D75]/40"
          />
        </label>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-gray-200 px-5 py-2 text-sm font-black text-gray-600 hover:bg-gray-50"
        >
          Fermer
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-gradient-to-r from-[#436D75] to-[#2F525A] px-5 py-2 text-sm font-black text-white hover:from-[#355860] hover:to-[#294A51] disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
