import { Check, X, Trash2, User, Calendar, Mail, ShieldAlert } from "lucide-react";

export const InscriptionTable = ({ data, type, readOnly = false, onAction }: any) => {
  if (data.length === 0)
    return (
      <div className="py-24 text-center bg-white rounded-[40px] border-4 border-dashed border-gray-50 flex flex-col items-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4">
          <User size={32} />
        </div>
        <p className="text-gray-300 font-bold italic">
          Aucun membre trouvé dans cette section.
        </p>
      </div>
    );

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">
            <th className="p-8">Adhérent</th>
            <th className="p-8">Contact</th>
            <th className="p-8">Date de demande</th>
            {type === "MEMBERS" && <th className="p-8">Statut</th>}
            {!readOnly && <th className="p-8 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((ins: any) => (
            <tr
              key={ins.id}
              className="group hover:bg-smart-sage/5 transition-all"
            >
              {/* Colonne 1 : Identité */}
              <td className="p-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-smart-bg rounded-2xl flex items-center justify-center text-smart-teal font-black shadow-inner border border-white overflow-hidden relative">
                    <span className="z-0">
                      {ins.utilisateur?.nom[0].toUpperCase()}
                    </span>
                    {ins.utilisateur?.photo_profil_url &&
                      ins.utilisateur.photo_profil_url !== "" && (
                        <img
                          src={ins.utilisateur.photo_profil_url}
                          alt="profile"
                          className="absolute inset-0 w-full h-full object-cover z-10"
                          onError={(e: any) =>
                            (e.target.style.display = "none")
                          }
                        />
                      )}
                  </div>
                  <div>
                    <p className="text-lg font-black text-smart-teal leading-none">
                      {ins.utilisateur?.nom} {ins.utilisateur?.prenom}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                      ID: #{ins.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
              </td>

              {/* Colonne 2 : Email */}
              <td className="p-8">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-bold">
                    <Mail size={12} className="text-smart-salmon" />
                    {ins.utilisateur?.email}
                  </div>
                </div>
              </td>

              {/* Colonne 3 : Date */}
              <td className="p-8 text-xs text-gray-400 font-medium">
                <div className="flex items-center gap-2 italic">
                  <Calendar size={14} />
                  {new Date(ins.date_adhesion).toLocaleDateString()}
                </div>
              </td>

              {/* Colonne 4 : Statut (MEMBERS uniquement) */}
              {type === "MEMBERS" && (
                <td className="p-8">
                  {ins.est_suspendu ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-full uppercase">
                        <ShieldAlert size={11} />
                        Suspendu
                      </span>
                      {ins.motif_suspension && (
                        <p className="text-xs text-red-500 font-medium max-w-[220px] leading-snug">
                          {ins.motif_suspension}
                        </p>
                      )}
                      {ins.date_fin_suspension && (
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Calendar size={10} />
                          Jusqu'au{" "}
                          {new Date(
                            ins.date_fin_suspension,
                          ).toLocaleDateString("fr-TN")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-black rounded-full uppercase">
                      Actif
                    </span>
                  )}
                </td>
              )}

              {/* Colonne 5 : Actions dynamiques */}
              {!readOnly && (
                <td className="p-8 text-right">
                  <div className="flex justify-end gap-2">
                    {type === "MEMBERS" ? (
                      <>
                        {/* SUSPENDRE / RÉACTIVER */}
                        <button
                          onClick={() =>
                            onAction(
                              ins.id,
                              ins.est_suspendu
                                ? "REACTIVATE"
                                : "OPEN_SUSPEND_MODAL",
                            )
                          }
                          title={
                            ins.est_suspendu ? "Réactiver" : "Suspendre"
                          }
                          className={`p-3 rounded-2xl transition-all ${ins.est_suspendu ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-600"}`}
                        >
                          <ShieldAlert size={20} />
                        </button>

                        {/* SUPPRIMER DÉFINITIVEMENT */}
                        <button
                          onClick={() => onAction(ins.id, "DELETE")}
                          title="Retirer du club"
                          className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onAction(ins.id, "ACCEPTE")}
                          className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-90"
                          title={
                            type === "REJECTED"
                              ? "Accepter finalement"
                              : "Accepter l'adhésion"
                          }
                        >
                          <Check size={20} />
                        </button>

                        {type !== "REJECTED" && (
                          <button
                            onClick={() => onAction(ins.id, "REFUSE")}
                            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90"
                            title="Refuser la demande"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
