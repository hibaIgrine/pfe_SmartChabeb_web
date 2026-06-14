/**
 * ClubMembersReadOnlyView.tsx — Vue lecture seule des membres d'un club (staff non-responsable).
 *
 * RÔLE :
 *   Affiche la liste des membres actifs (statut=ACCEPTE) du club
 *   pour les membres du staff qui n'ont pas les droits de gestion complets.
 *
 * INFORMATIONS AFFICHÉES :
 *   - Nom, prénom, email, date d'inscription de chaque membre
 *   - Capacité du club et nombre de places restantes
 *   - Compteur total des membres actifs
 *
 * ACCÈS : RESPONSABLE_CLUB (lecture seule) / staff club
 */
import { ArrowLeft, Users, CheckCircle2, Mail, Calendar, User } from "lucide-react";

export const ClubMembersReadOnlyView = ({ club, onBack }: any) => {
  const members =
    club?.inscriptions?.filter((i: any) => i.statut === "ACCEPTE") || [];
  const capacity = club?.capacite ?? null;
  const freePlaces = capacity !== null ? capacity - members.length : null;

  return (
    <div className="animate-in slide-in-from-right duration-700 bg-smart-bg min-h-screen py-6 px-6 absolute inset-0 z-[800] overflow-y-auto custom-scrollbar">
      <div className="space-y-6">
        {/* Retour */}
        <button
          onClick={onBack}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-[#F7F3E9] text-smart-teal hover:bg-smart-teal hover:text-white transition-all"
        >
          <ArrowLeft size={18} />
        </button>

        {/* En-tête club */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-6xl font-black text-smart-teal tracking-tighter italic leading-none">
              {club?.nom}
            </h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] mt-4 tracking-[0.4em] flex items-center gap-2">
              <span className="w-8 h-1 bg-smart-salmon rounded-full" />
              Membres actifs du club
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-3">
            <StatCard
              label="Membres actifs"
              val={members.length}
              icon={<Users size={14} />}
              color="text-smart-teal"
            />
            <StatCard
              label="Capacité"
              val={capacity ?? "∞"}
              icon={<CheckCircle2 size={14} />}
              color="text-purple-500"
            />
            <StatCard
              label="Places libres"
              val={freePlaces !== null ? Math.max(0, freePlaces) : "∞"}
              icon={<CheckCircle2 size={14} />}
              color="text-green-500"
            />
          </div>
        </div>

        {/* Liste des membres */}
        {members.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-[40px] border-4 border-dashed border-gray-50 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4">
              <User size={32} />
            </div>
            <p className="text-gray-300 font-bold italic">
              Aucun membre actif dans ce club.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">
                  <th className="p-8">Membre</th>
                  <th className="p-8">Contact</th>
                  <th className="p-8">Date d'adhésion</th>
                  <th className="p-8">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((ins: any) => (
                  <tr key={ins.id} className="hover:bg-smart-sage/5 transition-all">
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-smart-bg rounded-2xl flex items-center justify-center text-smart-teal font-black shadow-inner border border-white overflow-hidden relative">
                          <span className="z-0">
                            {ins.utilisateur?.nom?.[0]?.toUpperCase() ?? "?"}
                          </span>
                          {ins.utilisateur?.photo_profil_url && (
                            <img
                              src={ins.utilisateur.photo_profil_url}
                              alt="profile"
                              className="absolute inset-0 w-full h-full object-cover z-10"
                              onError={(e: any) => (e.target.style.display = "none")}
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
                    <td className="p-8">
                      <div className="flex items-center gap-2 text-gray-500 text-xs font-bold">
                        <Mail size={12} className="text-smart-salmon" />
                        {ins.utilisateur?.email}
                      </div>
                    </td>
                    <td className="p-8 text-xs text-gray-400 font-medium">
                      <div className="flex items-center gap-2 italic">
                        <Calendar size={14} />
                        {new Date(ins.date_adhesion).toLocaleDateString()}
                      </div>
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

const StatCard = ({ label, val, icon, color }: any) => (
  <div className="bg-white px-6 py-4 rounded-[25px] border border-gray-100 shadow-sm flex flex-col items-center min-w-[110px]">
    <div className={`${color} opacity-30 mb-1`}>{icon}</div>
    <p className={`text-2xl font-black italic ${color}`}>{val}</p>
    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest text-center">
      {label}
    </p>
  </div>
);
