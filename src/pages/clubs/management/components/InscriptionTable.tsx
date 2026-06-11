import { Check, X, Trash2, User, Calendar, Mail, ShieldAlert, UserSearch } from "lucide-react";

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
                    {/* 💡 SOLUTION : On affiche les initiales par défaut */}
                    <span className="z-0">
                      {ins.utilisateur?.nom[0].toUpperCase()}
                    </span>

                    {/* 💡 On n'affiche l'image QUE si l'URL existe et n'est pas une chaîne vide */}
                    {ins.utilisateur?.photo_profil_url &&
                      ins.utilisateur.photo_profil_url !== "" && (
                        <img
                          src={ins.utilisateur.photo_profil_url}
                          alt="profile"
                          className="absolute inset-0 w-full h-full object-cover z-10"
                          onError={(e: any) =>
                            (e.target.style.display = "none")
                          } // Cache l'image si le lien est mort
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
              {type === "MEMBERS" && (
                <td className="p-8">
                  {ins.est_suspendu ? (
                    <span className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-full uppercase">
                      Suspendu
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-black rounded-full uppercase">
                      Actif
                    </span>
                  )}
                </td>
              )}
              {/* Colonne 4 : Actions dynamiques */}
              {!readOnly && (
                <td className="p-8 text-right">
                  <div className="flex justify-end gap-2">
                    {/* CAS 1 : Déjà membre (Bouton Supprimer) */}
                    {type === "MEMBERS" ? (
                      <>
                        {/* 1. VUE PROFIL (Quick View) */}
                        <button
                          onClick={() =>
                            alert(`Bio: ${ins.utilisateur.bio || "Pas de bio"}`)
                          }
                          className="p-3 bg-smart-sage/20 text-smart-teal rounded-2xl hover:bg-smart-teal hover:text-white transition-all"
                          title="Voir le profil"
                        >
                          <UserSearch size={18} />
                        </button>
                        {/* 2. SUSPENDRE / RÉACTIVER (Local au club) */}
                        <button
                          onClick={() =>
                            onAction(
                              ins.id,
                              ins.est_suspendu
                                ? "REACTIVATE"
                                : "OPEN_SUSPEND_MODAL",
                            )
                          }
                          className={`p-3 rounded-2xl transition-all ${ins.est_suspendu ? "bg-red-500 text-white" : "bg-gray-50 text-gray-400"}`}
                        >
                          <ShieldAlert size={20} />
                        </button>
                        {/* 3. SUPPRIMER DÉFINITIVEMENT */}
                        <button
                          onClick={() => onAction(ins.id, "DELETE")}
                          className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* CAS 2 : Demande, File d'attente ou Refusé (Bouton Accepter toujours visible) */}
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

                        {/* CAS 3 : Uniquement pour Demandes et File d'attente (Bouton Refuser) */}
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
