import { useState } from "react";

type PasswordValues = {
  newPassword: string;
  confirmPassword: string;
};

type FormUpdateMdpProps = {
  saving: boolean;
  resettingPassword: boolean;
  error: string | null;
  success: string | null;
  onCancel: () => void;
  onSubmit: (values: PasswordValues) => void;
  onResetPassword: () => void;
};

export function FormUpdateMdp({
  saving,
  resettingPassword,
  error,
  success,
  onCancel,
  onSubmit,
  onResetPassword,
}: FormUpdateMdpProps) {
  const [values, setValues] = useState<PasswordValues>({
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl rounded-3xl border border-[#F4D7DE] bg-white p-6 shadow-2xl"
    >
      <h3 className="text-xl font-black italic text-[#8F2F48]">
        Modifier mot de passe
      </h3>
      <p className="mt-1 text-xs font-semibold text-[#A54B63]">
        Saisissez un nouveau mot de passe puis confirmez-le.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Nouveau mot de passe
          </span>
          <input
            type="password"
            value={values.newPassword}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, newPassword: e.target.value }))
            }
            className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8F2F48]/30"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Confirmer mot de passe
          </span>
          <input
            type="password"
            value={values.confirmPassword}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8F2F48]/30"
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

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onResetPassword}
          disabled={resettingPassword}
          className="rounded-xl border border-[#E7B8C5] bg-white px-4 py-2 text-xs font-black text-[#8F2F48] hover:bg-[#FFF0F4] disabled:opacity-60"
        >
          {resettingPassword
            ? "Envoi en cours..."
            : "Reinitialiser mot de passe"}
        </button>
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
          className="rounded-2xl bg-[#8F2F48] px-5 py-2 text-sm font-black text-white hover:bg-[#7a263c] disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "Mettre a jour"}
        </button>
      </div>
    </form>
  );
}
