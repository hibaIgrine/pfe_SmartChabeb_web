import { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Dumbbell,
  Timer,
  Repeat,
  Loader2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

interface Exercise {
  nom: string;
  series: string;
  reps: string;
}

export default function CreateProgram() {
  const { idMember } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userMe = JSON.parse(localStorage.getItem("user") || "{}");

  const [exercises, setExercises] = useState<Exercise[]>([
    { nom: "", series: "", reps: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);

  // --- LOGIQUE DE NOTIFICATION RÉPARÉE ---
  // On ajoute "shouldNavigate" qui est faux (false) par défaut
  const showAlert = (
    msg: string,
    type: "error" | "success",
    shouldNavigate: boolean = false,
  ) => {
    setNotification({ msg, type });

    if (type === "success" && shouldNavigate) {
      // Redirige SEULEMENT si on a cliqué sur le bouton Publier
      setTimeout(
        () => navigate(userMe.role === "COACH" ? "/coach-members" : "/membres"),
        2500,
      );
    } else {
      // Sinon, on fait juste disparaître le message après 3 secondes
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // --- CHARGEMENT DU PROGRAMME EXISTANT (CORRIGÉ) ---
  // Dans src/pages/CreateProgram.tsx

  // src/pages/CreateProgram.tsx

  useEffect(() => {
    const fetchLatestProgram = async () => {
      try {
        const res = await api.get(`/users/${idMember}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // On récupère la liste (qui est triée DESC par le backend)
        const history =
          res.data
            .programmes_sportifs_programmes_sportifs_id_membreToutilisateurs;

        if (history && history.length > 0) {
          // 🏆 On prend TOUJOURS l'élément 0 (le plus récent)
          const latestProg = history[0];
          setExercises(latestProg.details_exercices);
          showAlert(
            `Version du ${new Date(latestProg.date_creation).toLocaleDateString()} chargée`,
            "success",
            false,
          );
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchLatestProgram();
  }, [idMember, token]);
  // --- GESTION DES EXERCICES ---
  const addExercise = () => {
    setExercises([...exercises, { nom: "", series: "", reps: "" }]);
  };

  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      const newEx = exercises.filter((_, i) => i !== index);
      setExercises(newEx);
    }
  };

  const updateExercise = (
    index: number,
    field: keyof Exercise,
    value: string,
  ) => {
    const newEx = [...exercises];
    newEx[index][field] = value;
    setExercises(newEx);
  };

  // --- SAUVEGARDE BACKEND ---
  const saveProgram = async () => {
    if (exercises.some((ex) => ex.nom.trim() === "")) {
      showAlert("Veuillez remplir tous les noms d'exercices", "error");
      return;
    }

    setIsLoading(true);
    try {
      await api.post(
        "/programmes",
        {
          id_membre: idMember,
          id_coach: userMe.id,
          titre_programme: `Plan optimisé - Coach ${userMe.nom}`,
          details_exercices: exercises,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // ICI on met "true" pour déclencher la redirection après le succès
      showAlert("Programme publié avec succès ! 🚀", "success", true);
    } catch (err) {
      setIsLoading(false);
      showAlert("Erreur lors de la publication", "error");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 relative font-['Inter',sans-serif]">
      {/* 🔔 NOTIFICATION TOAST MICHELLE */}
      {notification && (
        <div
          className={`fixed top-10 right-10 z-[500] flex items-center space-x-4 p-6 rounded-[30px] shadow-2xl animate-in slide-in-from-right-10 border border-white/20 backdrop-blur-xl ${notification.type === "error" ? "bg-[#E98A7D] text-white" : "bg-[#D9E8D1] text-[#436d75]"}`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={24} />
          ) : (
            <AlertCircle size={24} />
          )}
          <p className="font-black italic text-lg">{notification.msg}</p>
        </div>
      )}

      {/* BOUTON RETOUR */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-400 font-black text-[10px] uppercase tracking-[0.4em] hover:text-smart-teal transition bg-white/50 p-3 px-6 rounded-full border border-white"
      >
        <ArrowLeft size={14} className="mr-2" /> Retour au profil
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <h1 className="text-7xl font-black text-[#1A1C1E] tracking-tighter italic leading-none">
          Conception <br />{" "}
          <span className="text-smart-teal underline decoration-smart-sage decoration-8 underline-offset-[-2px]">
            Sportive
          </span>
        </h1>
        <div className="bg-white p-4 rounded-[25px] border border-gray-100 shadow-sm hidden md:block">
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">
            Cible
          </p>
          <p className="text-xs font-bold text-smart-teal uppercase italic">
            Analyse Physique
          </p>
        </div>
      </div>

      {/* 🎨 ZONE DU FORMULAIRE BENTO */}
      <div className="bg-white p-10 rounded-[60px] shadow-sm border border-gray-50 space-y-8">
        <div className="grid grid-cols-1 gap-6">
          {exercises.map((ex, index) => (
            <div
              key={index}
              className="flex flex-col lg:flex-row items-center gap-6 p-8 bg-[#F7F3E9]/50 rounded-[40px] border-2 border-white shadow-inner animate-in slide-in-from-left duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 bg-[#436d75] text-white rounded-2xl flex items-center justify-center font-black italic text-xl flex-shrink-0 shadow-lg">
                {index + 1}
              </div>

              <div className="flex-1 w-full space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest flex items-center">
                  <Dumbbell size={10} className="mr-1" /> Exercice
                </label>
                <input
                  placeholder="Ex: Développé couché..."
                  className="w-full p-5 bg-white border-none rounded-[22px] shadow-sm font-bold text-smart-teal outline-none focus:ring-4 focus:ring-smart-sage transition-all"
                  value={ex.nom}
                  onChange={(e) => updateExercise(index, "nom", e.target.value)}
                />
              </div>

              <div className="w-full lg:w-32 space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-4">
                  Séries
                </label>
                <input
                  placeholder="3"
                  className="w-full p-5 bg-white border-none rounded-[22px] shadow-sm font-bold text-center text-smart-teal outline-none"
                  value={ex.series}
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "series",
                      e.target.value.replace(/\D/g, ""),
                    )
                  }
                />
              </div>

              <div className="w-full lg:w-32 space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-4">
                  Reps
                </label>
                <input
                  placeholder="12"
                  className="w-full p-5 bg-white border-none rounded-[22px] shadow-sm font-bold text-center text-smart-teal outline-none"
                  value={ex.reps}
                  onChange={(e) =>
                    updateExercise(index, "reps", e.target.value)
                  }
                />
              </div>

              {exercises.length > 1 && (
                <button
                  onClick={() => removeExercise(index)}
                  className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm lg:mt-5"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-6 pt-6">
          <button
            onClick={addExercise}
            className="flex-1 border-4 border-dashed border-[#D9E8D1] p-6 rounded-[35px] text-[#436d75] font-black text-sm uppercase tracking-widest flex items-center justify-center hover:bg-[#D9E8D1]/20 transition-all active:scale-95"
          >
            <Plus className="mr-3" /> Ajouter un exercice
          </button>

          <button
            onClick={saveProgram}
            disabled={isLoading}
            className="flex-1 bg-[#436d75] text-white py-6 rounded-[35px] font-black text-xl shadow-2xl hover:bg-[#1A1C1E] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center italic"
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-3" />
            ) : (
              <Save className="mr-3" />
            )}
            PUBLIER LE PROGRAMME
          </button>
        </div>
      </div>
    </div>
  );
}
