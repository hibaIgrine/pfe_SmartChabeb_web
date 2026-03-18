import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Users,
  GraduationCap,
  LogOut,
  LayoutGrid,
  ShieldCheck,
  UserCircle,
  Building2,
  CalendarCheck,
} from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role;

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
    <div className="flex h-screen bg-[#F7F3E9] font-sans overflow-hidden">
      {/* --- 🟦 SIDEBAR RECTANGLE FIXE SANS SCROLL --- */}
      <aside className="w-64 bg-[#436D75] text-white flex flex-col h-full flex-shrink-0 shadow-2xl overflow-hidden">
        {/* LOGO SANS ESPACE INUTILE */}
        <div className="pt-10 px-8 pb-2 flex flex-col items-start">
          <div className="text-2xl font-black tracking-tighter leading-none italic">
            <span className="text-white">SMART</span>
            <span className="text-[#E98A7D] ml-1">CHABEB</span>
          </div>
          <p className="text-[8px] font-bold text-[#D9E8D1] uppercase tracking-[0.4em] mt-2 opacity-40">
            Gouvernement Tunisien
          </p>
        </div>

        {/* NAVIGATION REMONTÉE (mt-4 au lieu de mt-10) */}
        <nav className="flex-1 px-4 space-y-1.5 mt-6 overflow-hidden">
          <SidebarItem
            to="/dashboard"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={location.pathname === "/dashboard"}
          />

          {role === "ADMIN" && (
            <SidebarItem
              to="/centres"
              icon={<MapPin size={20} />}
              label="Gestion Centres"
              active={location.pathname === "/centres"}
            />
          )}
          {role === "ADMIN" && (
            <SidebarItem
              to="/locaux"
              icon={<Building2 size={20} />}
              label="Gestion Locaux"
              active={location.pathname === "/locaux"}
            />
          )}
          {role === "ADMIN" && (
            <SidebarItem
              to="/reservations"
              icon={<CalendarCheck size={20} />}
              label="Réservations"
              active={location.pathname === "/reservations"}
            />
          )}
          {(role === "ADMIN" || role === "RESPONSABLE_CLUB") && (
            <SidebarItem
              to="/roles"
              icon={<ShieldCheck size={20} />}
              label="Grades & Droits"
              active={location.pathname === "/roles"}
            />
          )}

          <SidebarItem
            to={role === "ADMIN" ? "/membres" : "/coach-members"}
            icon={<Users size={20} />}
            label={role === "COACH" ? "Mes Élèves" : "Communauté"}
            active={
              location.pathname === "/membres" ||
              location.pathname === "/coach-members"
            }
          />

          {role === "ADMIN" && (
            <SidebarItem
              to="/coaches"
              icon={<GraduationCap size={20} />}
              label="Gestion Staff"
              active={location.pathname === "/coaches"}
            />
          )}

          <SidebarItem
            to="/clubs"
            icon={<LayoutGrid size={20} />}
            label="Clubs & Activités"
            active={location.pathname === "/clubs"}
          />
        </nav>

        {/* DÉCONNEXION */}
        <div className="p-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-4 rounded-[22px] bg-black/10 text-white/50 hover:bg-[#E98A7D] hover:text-white transition-all font-black text-[10px] uppercase tracking-widest cursor-pointer group"
          >
            <LogOut
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
            <span>Quitter</span>
          </button>
        </div>
      </aside>

      {/* --- 🏛️ ZONE DE DROITE (RESTE IDENTIQUE) --- */}
      <main className="flex-1 flex flex-col overflow-hidden p-4">
        <header className="bg-white/60 backdrop-blur-md h-20 px-8 flex justify-between items-center rounded-[35px] border border-white shadow-sm mb-4 flex-shrink-0">
          <div className="flex items-center space-x-5">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg"
              className="h-8 shadow-sm rounded-sm"
              alt="TN"
            />
            <div className="leading-tight border-l pl-4 border-gray-200">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                République Tunisienne
              </p>
              <h2 className="text-xs font-black text-[#436D75] uppercase tracking-tighter">
                Ministère de la Jeunesse et des Sports
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-white p-1 rounded-full pr-6 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-[#F7F3E9] rounded-full flex items-center justify-center text-[#436D75] shadow-inner border border-white">
              <UserCircle size={24} />
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-[#436D75] leading-none">
                {user.nom} {user.prenom}
              </p>
              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">
                {role}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 bg-white rounded-[50px] shadow-2xl border border-gray-50 overflow-hidden flex flex-col relative">
          <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ to, icon, label, active }: any) {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-4 p-4 rounded-[22px] transition-all duration-300 group ${
        active
          ? "bg-white text-[#436D75] shadow-lg italic"
          : "text-white/40 hover:text-white hover:bg-white/5"
      }`}
    >
      <span
        className={`transition-transform duration-300 ${active ? "scale-110 text-[#E98A7D]" : "group-hover:scale-110"}`}
      >
        {icon}
      </span>
      <span className="text-sm font-black tracking-tight">{label}</span>
    </Link>
  );
}
