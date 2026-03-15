import { CheckCircle2, XCircle } from "lucide-react";

export const PendingRequests = ({ requests, onAction }: any) => {
  if (requests.length === 0) {
    return (
      <div className="p-6 border-2 border-dashed border-gray-200 rounded-[20px] text-center text-gray-400 font-bold text-xs italic">
        Aucune demande en attente.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req: any) => (
        <div
          key={req.id}
          className="flex justify-between items-center p-4 bg-white rounded-[20px] shadow-sm border border-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-400 font-black text-xs">
              ⏳
            </div>
            <div>
              <p className="text-sm font-black text-smart-teal leading-none">
                {req.utilisateur.nom} {req.utilisateur.prenom}
              </p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                {req.utilisateur.email}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onAction(req.id, "ACCEPTE")}
              className="p-2 bg-green-50 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm"
              title="Accepter"
            >
              <CheckCircle2 size={18} />
            </button>
            <button
              onClick={() => onAction(req.id, "REFUSE")}
              className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
              title="Refuser"
            >
              <XCircle size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
