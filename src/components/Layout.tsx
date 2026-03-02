import { useEffect } from "react";
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

  // 1. RÉCUPÉRATION SÉCURISÉE DES INFOS
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role;

  // 2. SÉCURITÉ : Bloquer les accès non autorisés
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else if (role === "ADHERENT") {
      navigate("/mobile-guide");
    }
  }, [user, role, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user || role === "ADHERENT") return null;

  return (
    <div className="flex h-screen bg-smart-bg font-sans overflow-hidden">
      {/* --- SIDEBAR DYNAMIQUE --- */}
      <aside className="w-64 bg-smart-teal text-white flex flex-col py-8 flex-shrink-0 border-r border-white/5">
        <div className="px-8 mb-12 flex items-center space-x-3">
          <div className="w-10 h-10 bg-smart-salmon rounded-xl flex items-center justify-center font-black shadow-lg">
            S
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">
            SmartChabeb
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-3">
          <SidebarItem
            to="/dashboard"
            icon={<LayoutDashboard size={22} />}
            label="Dashboard"
            active={location.pathname === "/dashboard"}
          />

          {/* 🛡️ SEUL L'ADMIN voit les Centres */}
          {role === "ADMIN" && (
            <SidebarItem
              to="/centres"
              icon={<MapPin size={22} />}
              label="Centres"
              active={location.pathname === "/centres"}
            />
          )}

          {/* 🛡️ MENU ADAPTATIF : Membres pour Admin / Mes Élèves pour Coach */}
          {user.role === "ADMIN" ? (
            <SidebarItem
              to="/membres"
              icon={<Users size={22} />}
              label="Membres"
              active={location.pathname === "/membres"}
            />
          ) : (
            <SidebarItem
              to="/coach-members"
              icon={<Users size={22} />}
              label="Mes Élèves"
              active={location.pathname === "/coach-members"}
            />
          )}

          {/* 🛡️ SEUL L'ADMIN gère le Staff (Coaches) */}
          {user.role === "ADMIN" && (
            <SidebarItem
              to="/coaches"
              icon={<GraduationCap size={22} />}
              label="Coaches"
              active={location.pathname === "/coaches"}
            />
          )}
        </nav>

        <div className="px-4 mt-auto border-t border-white/10 pt-6">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-4 p-4 rounded-2xl w-full text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-all font-bold cursor-pointer group"
          >
            <LogOut
              size={22}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* --- ZONE PRINCIPALE --- */}
      <main className="flex-1 bg-white my-4 mr-4 rounded-tl-[60px] rounded-bl-[60px] shadow-2xl flex flex-col overflow-hidden relative">
        <header className="px-12 py-8 flex justify-between items-center border-b border-gray-50">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">
              Espace {role}
            </p>
            <h1 className="text-3xl font-black text-smart-teal tracking-tighter italic leading-none">
              {role === "COACH" ? "Suivi Sportif" : "Smart Management"}
            </h1>
          </div>

          <div className="flex items-center space-x-6">
            <Bell
              size={22}
              className="text-gray-300 hover:text-smart-teal cursor-pointer transition-colors"
            />

            <div className="flex items-center space-x-4 bg-smart-bg p-2 rounded-full pr-8 border border-gray-100 shadow-sm">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                className="w-11 h-11 rounded-full border-2 border-white shadow-md"
                alt="profile"
              />
              <div className="text-left leading-tight">
                <p className="text-sm font-black text-smart-teal">
                  {user.nom} {user.prenom}
                </p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                  {role}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 bg-white">{children}</div>
      </main>
    </div>
  );
}

function SidebarItem({ to, icon, label, active }: any) {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-4 p-4 rounded-[24px] transition-all duration-300 group ${
        active
          ? "bg-white/15 text-white shadow-lg ring-1 ring-white/20"
          : "text-white/40 hover:text-white hover:bg-white/5"
      }`}
    >
      <span
        className={`transition-transform duration-300 ${active ? "text-smart-salmon scale-110" : "group-hover:scale-110"}`}
      >
        {icon}
      </span>
      <span className="text-sm font-black tracking-tight">{label}</span>
    </Link>
  );
}
