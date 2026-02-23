import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, MapPin, Users, LogOut } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* SIDEBAR */}
      <div className="w-64 bg-blue-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-blue-800">
          SmartChabeb
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center p-3 hover:bg-blue-800 rounded"
          >
            <LayoutDashboard className="mr-3" /> Dashboard
          </Link>
          <Link
            to="/centres"
            className="flex items-center p-3 hover:bg-blue-800 rounded bg-blue-800"
          >
            <MapPin className="mr-3" /> Les Centres
          </Link>
          <Link
            to="/utilisateurs"
            className="flex items-center p-3 hover:bg-blue-800 rounded"
          >
            <Users className="mr-3" /> Membres
          </Link>
        </nav>
        <button
          onClick={handleLogout}
          className="p-6 text-left hover:bg-red-800 flex items-center"
        >
          <LogOut className="mr-3" /> Déconnexion
        </button>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow p-4 flex justify-end">
          <span className="font-semibold text-gray-700">Administrateur 👋</span>
        </header>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
