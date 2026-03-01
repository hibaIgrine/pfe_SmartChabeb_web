import { useState } from "react"; // 👈 FIX : Import manquant
import api from "../api/axios";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

// Définition de l'interface pour TypeScript
interface Exercise {
  nom: string;
  series: string;
  reps: string;
}

export default function CreateProgram() {
  const { idMember } = useParams(); // Récupère l'ID du membre dans l'URL
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // FIX : Utilisation de l'interface Exercise
  const [exercises, setExercises] = useState<Exercise[]>([
    { nom: "", series: "", reps: "" },
  ]);

  const addExercise = () => {
    setExercises([...exercises, { nom: "", series: "", reps: "" }]);
  };

  const removeExercise = (index: number) => {
    const newEx = exercises.filter((_, i) => i !== index);
    setExercises(newEx);
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

  const saveProgram = async () => {
    try {
      await api.post(
        "/programmes",
        {
          id_membre: idMember,
          titre_programme: "Mon Programme Smart",
          details_exercices: exercises, // Sera enregistré en JSONB
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("Programme publié !");
      navigate("/membres");
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-smart-teal transition"
      >
        <ArrowLeft size={16} className="mr-2" /> Retour
      </button>

      <h1 className="text-5xl font-black text-smart-teal italic tracking-tighter">
        Nouveau Programme
      </h1>

      <div className="bg-white p-10 rounded-[60px] shadow-sm border border-gray-50">
        <div className="space-y-6">
          {exercises.map(
            (
              ex: Exercise,
              index: number, // 👈 FIX : Types index et ex ajoutés
            ) => (
              <div
                key={index}
                className="flex flex-col md:flex-row gap-4 p-6 bg-smart-bg rounded-[30px] border border-white items-center animate-in slide-in-from-left-2"
              >
                <div className="bg-white p-4 rounded-2xl font-black text-smart-teal">
                  {index + 1}
                </div>

                <input
                  placeholder="Nom de l'exercice (ex: Pompes)"
                  className="flex-1 p-4 rounded-2xl bg-white border-none outline-none font-bold text-sm"
                  value={ex.nom}
                  onChange={(e) => updateExercise(index, "nom", e.target.value)}
                />

                <input
                  placeholder="Séries"
                  className="w-full md:w-24 p-4 rounded-2xl bg-white border-none outline-none font-bold text-sm text-center"
                  value={ex.series}
                  onChange={(e) =>
                    updateExercise(index, "series", e.target.value)
                  }
                />

                <input
                  placeholder="Reps"
                  className="w-full md:w-24 p-4 rounded-2xl bg-white border-none outline-none font-bold text-sm text-center"
                  value={ex.reps}
                  onChange={(e) =>
                    updateExercise(index, "reps", e.target.value)
                  }
                />

                {exercises.length > 1 && (
                  <button
                    onClick={() => removeExercise(index)}
                    className="p-4 text-red-400 hover:text-red-600 transition"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ),
          )}
        </div>

        <div className="mt-10 flex flex-col md:flex-row gap-4">
          <button
            onClick={addExercise}
            className="flex-1 border-2 border-dashed border-gray-200 p-5 rounded-[30px] text-gray-400 font-bold hover:border-smart-teal hover:text-smart-teal transition-all flex items-center justify-center space-x-2"
          >
            <Plus size={20} /> <span>AJOUTER UN EXERCICE</span>
          </button>

          <button
            onClick={saveProgram}
            className="flex-1 bg-smart-teal text-white py-5 rounded-[30px] font-black text-lg shadow-xl shadow-smart-teal/20 hover:bg-black transition-all flex items-center justify-center space-x-3"
          >
            <Save size={20} /> <span>PUBLIER LE PROGRAMME</span>
          </button>
        </div>
      </div>
    </div>
  );
}
