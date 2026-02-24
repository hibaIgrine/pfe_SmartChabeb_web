import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Users,
  GraduationCap,
  Bell,
  Search,
  LogOut,
} from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    // 1. Conteneur principal (Gris clair)
    <div className="flex h-screen w-full bg-[#f0f4f4] font-sans overflow-hidden">
      {/* 2. SIDEBAR FIXE (Bleu Canard) */}
      <aside className="w-64 bg-[#436d75] text-white flex flex-col flex-shrink-0">
        <div className="p-8">
          <h2 className="text-xl font-bold tracking-widest text-orange-400">
            SMART CHABEB
          </h2>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <SidebarLink
            to="/dashboard"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={location.pathname === "/dashboard"}
          />
          <SidebarLink
            to="/centres"
            icon={<MapPin size={20} />}
            label="Centres"
            active={location.pathname === "/centres"}
          />
          <SidebarLink
            to="/membres"
            icon={<Users size={20} />}
            label="Membres"
            active={location.pathname === "/membres"}
          />
          <SidebarLink
            to="/coaches"
            icon={<GraduationCap size={20} />}
            label="Coaches"
            active={location.pathname === "/coaches"}
          />
        </nav>

        <div className="p-8">
          <button className="flex items-center text-white/60 hover:text-white transition">
            <LogOut size={20} className="mr-3" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* 3. SECTION PRINCIPALE (L'effet arrondi blanc) */}
      <main className="flex-1 flex flex-col bg-white my-4 mr-4 rounded-[40px] shadow-2xl overflow-hidden border-l border-gray-100">
        {/* TOPBAR INTERNE */}
        <header className="h-20 px-10 flex justify-between items-center border-b border-gray-50">
          <h1 className="text-2xl font-bold text-[#2c4e54]">Dashboard</h1>

          <div className="flex items-center space-x-6">
            <div className="bg-gray-100 rounded-full px-4 py-2 flex items-center">
              <Search size={16} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-transparent outline-none text-sm w-32"
              />
            </div>
            <Bell size={20} className="text-gray-400" />
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-bold text-[#2c4e54]">Hiba Allah</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                  Super Admin
                </p>
              </div>
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Hiba"
                className="w-10 h-10 rounded-full bg-gray-200"
              />
            </div>
          </div>
        </header>

        {/* CONTENU VARIABLE */}
        <div className="flex-1 overflow-y-auto p-10 bg-white">{children}</div>
      </main>
    </div>
  );
}

function SidebarLink({ to, icon, label, active }: any) {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-4 p-4 rounded-2xl transition-all ${active ? "bg-white/10 text-white shadow-inner" : "text-white/50 hover:bg-white/5 hover:text-white"}`}
    >
      <span className={active ? "text-orange-400" : ""}>{icon}</span>
      <span className="text-sm font-semibold">{label}</span>
    </Link>
  );
}
