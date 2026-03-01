import { useEffect, useState } from "react";
import api from "../api/axios";
import { User, Activity, PlusCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CoachMembers() {
  const [eleves, setEleves] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchEleves();
  }, []);

  const fetchEleves = async () => {
    try {
      // On va créer cette route dans le backend
      const res = await api.get("/users/coach/my-members", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEleves(res.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <h1 className="text-5xl font-black text-smart-teal italic tracking-tighter">
        Mes Élèves
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          eleves.map((m: any) => (
            <div
              key={m.id}
              className="bg-white p-8 rounded-[50px] shadow-sm border border-gray-50 flex items-center justify-between group hover:shadow-xl transition-all"
            >
              <div className="flex items-center space-x-6">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.email}`}
                  className="w-20 h-20 rounded-[30px] bg-smart-bg border-4 border-white shadow-md"
                />
                <div>
                  <h4 className="text-xl font-black text-smart-teal">
                    {m.nom} {m.prenom}
                  </h4>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    IMC : {m.suivi_biometrique?.[0]?.imc || "N/A"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/create-program/${m.id}`)}
                className="p-4 bg-smart-sage text-smart-teal rounded-[25px] hover:bg-smart-teal hover:text-white transition-all flex items-center space-x-2 font-black text-xs"
              >
                <PlusCircle size={20} />
                <span>CRÉER PROGRAMME</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
