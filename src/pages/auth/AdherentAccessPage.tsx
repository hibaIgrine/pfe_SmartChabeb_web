import { useNavigate } from "react-router-dom";
import { Smartphone, QrCode, ArrowLeft, Download, Zap } from "lucide-react";

export default function AdherentAccessPage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full bg-smart-bg flex items-center justify-center p-6 overflow-hidden">
      <button
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 flex items-center space-x-2 text-smart-teal/60 hover:text-smart-teal transition font-black text-xs uppercase tracking-widest"
      >
        <ArrowLeft size={16} /> <span>Retour</span>
      </button>

      <main className="max-w-4xl w-full h-[70vh] bg-white rounded-[60px] shadow-2xl overflow-hidden flex border border-white">
        <div className="w-1/2 bg-smart-teal p-12 flex flex-col items-center justify-center text-center text-white relative">
          <div className="absolute inset-0 opacity-10">
            <img
              src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80"
              className="w-full h-full object-cover"
              alt="Mobile"
            />
          </div>
          <Smartphone
            size={80}
            className="mb-6 text-smart-sage relative z-10"
          />
          <h1 className="text-4xl font-black tracking-tighter italic relative z-10">
            Ton aventure <br /> est mobile.
          </h1>
        </div>

        <div className="w-1/2 p-12 flex flex-col justify-center space-y-6">
          <h2 className="text-2xl font-black text-smart-teal">
            Bonjour Jeune ! 👋
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            L'administration se fait ici, mais tes entraînements sont sur
            l'application :
          </p>

          <ul className="space-y-2">
            <li className="flex items-center space-x-3 text-xs font-bold text-smart-teal/80">
              <Zap size={14} className="text-smart-salmon" />{" "}
              <span>Programmes IA & Nutrition</span>
            </li>
          </ul>

          <div className="pt-4 flex flex-col items-center space-y-4">
            <div className="bg-smart-bg p-4 rounded-3xl shadow-inner border border-gray-100">
              <QrCode size={80} className="text-smart-teal opacity-50" />
            </div>
            <button className="w-full bg-smart-teal text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-3 hover:bg-black transition-all">
              <Download size={18} /> <span>Installer l'App</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
