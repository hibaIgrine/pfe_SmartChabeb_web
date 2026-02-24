import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Users,
  GraduationCap,
  LogOut,
  Bell,
  Search,
} from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/"); // Retour à l'accueil
  };

  return (
    <div className="flex h-screen bg-smart-bg font-sans overflow-hidden">
      {/* SIDEBAR FIXE (Michelle Theme) */}
      <aside className="w-64 bg-smart-teal text-white flex flex-col py-8 flex-shrink-0">
        <div className="px-8 mb-12 flex items-center space-x-3">
          <div className="w-8 h-8 bg-smart-salmon rounded-lg flex items-center justify-center font-black">
            S
          </div>
          <span className="text-xl font-black tracking-tighter">
            SmartChabeb
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-3">
          <SidebarItem
            to="/dashboard"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={location.pathname === "/dashboard"}
          />
          <SidebarItem
            to="/centres"
            icon={<MapPin size={20} />}
            label="Centres"
            active={location.pathname === "/centres"}
          />
          <SidebarItem
            to="/membres"
            icon={<Users size={20} />}
            label="Membres"
            active={location.pathname === "/membres"}
          />
          <SidebarItem
            to="/coaches"
            icon={<GraduationCap size={20} />}
            label="Coaches"
            active={location.pathname === "/coaches"}
          />
        </nav>

        {/* BOUTON DÉCONNEXION FIXÉ */}
        <div className="px-4 border-t border-white/10 pt-6">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-4 p-4 rounded-2xl w-full text-white/50 hover:bg-red-500 hover:text-white transition-all font-bold cursor-pointer"
          >
            <LogOut size={20} />
            <span className="text-sm">Quitter la session</span>
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL ARRONDI (Style Michelle Image 2) */}
      <main className="flex-1 bg-white my-4 mr-4 rounded-tl-[60px] rounded-bl-[60px] shadow-2xl flex flex-col overflow-hidden">
        <header className="px-12 py-8 flex justify-between items-center border-b border-gray-50">
          <h1 className="text-3xl font-black text-smart-teal tracking-tighter italic">
            Tableau de Bord
          </h1>
          <div className="flex items-center space-x-6">
            <div className="bg-smart-bg rounded-full px-4 py-2 flex items-center border border-gray-100">
              <Search size={16} className="text-gray-300 mr-2" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-transparent outline-none text-xs w-32"
              />
            </div>
            <div className="flex items-center space-x-3 bg-smart-bg p-1.5 rounded-full pr-6 border border-gray-100">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Hiba"
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              />
              <div className="text-left">
                <p className="text-xs font-black text-smart-teal leading-none">
                  {user.nom || "Admin"}
                </p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  Super Admin
                </p>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-12">{children}</div>
      </main>
    </div>
  );
}

function SidebarItem({ to, icon, label, active }: any) {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-4 p-4 rounded-[22px] transition-all ${active ? "bg-white/15 text-white shadow-inner" : "text-white/40 hover:text-white hover:bg-white/5"}`}
    >
      <span className={active ? "text-smart-salmon" : ""}>{icon}</span>
      <span className="text-sm font-black tracking-tight">{label}</span>
    </Link>
  );
}
