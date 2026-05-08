import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
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
  CalendarPlus,
  ClipboardList,
  ClipboardCheck,
  CalendarRange,
  CalendarDays,
  Newspaper,
  ListTodo,
  CreditCard,
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { FavoritePostsBell } from "./FavoritePostsBell";
import { MessageBell } from "./MessageBell";
import api from "../../api/axios";

function getStoredUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    const user = JSON.parse(raw);
    return {
      ...user,
      role: user?.role === "ADHERANT" ? "ADHERENT" : user?.role,
    };
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(() => getStoredUser());
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [managedClubs, setManagedClubs] = useState<any[]>([]);
  const [managedClubsLoading, setManagedClubsLoading] = useState(false);
  const role = user?.role;
  const displayUser = dbProfile ?? user;
  const hasProfileImage =
    typeof displayUser?.photo_profil_url === "string" &&
    displayUser.photo_profil_url.trim() !== "";
  const [topBarImageError, setTopBarImageError] = useState(false);
  const showTopBarImage = hasProfileImage && !topBarImageError;
  const isMessageriePage = location.pathname === "/messagerie";

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const isAdherentClubPage =
      location.pathname === "/clubs" ||
      /^\/clubs\/[^/]+$/.test(location.pathname);

    if (
      role === "ADHERENT" &&
      !isAdherentClubPage &&
      location.pathname !== "/club-creation-requests" &&
      location.pathname !== "/mon-profil" &&
      location.pathname !== "/fil-actualite" &&
      location.pathname !== "/messagerie" &&
      location.pathname !== "/my-club-requests" &&
      location.pathname !== "/club-reservations" &&
      location.pathname !== "/adherent-my-reservations" &&
      location.pathname !== "/events"
    ) {
      navigate("/clubs");
    }
  }, [user, role, navigate, location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setDbProfile(null);
      return;
    }

    const loadDbProfile = async () => {
      try {
        const response = await api.get("/users/me/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDbProfile(response.data);
      } catch {
        setDbProfile(null);
      }
    };

    void loadDbProfile();
  }, [user?.id]);

  useEffect(() => {
    const syncUser = () => {
      setUser(getStoredUser());
    };

    const syncDbProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setDbProfile(null);
        return;
      }

      try {
        const response = await api.get("/users/me/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDbProfile(response.data);
      } catch {
        setDbProfile(null);
      }
    };

    const handleUserUpdated = () => {
      syncUser();
      void syncDbProfile();
    };

    window.addEventListener("storage", syncUser);
    window.addEventListener("user-updated", handleUserUpdated as EventListener);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener(
        "user-updated",
        handleUserUpdated as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setManagedClubs([]);
      return;
    }

    const loadManagedClubs = async () => {
      if (role !== "RESPONSABLE_CLUB" && role !== "RESPONSABLE_CENTRE") return;
      setManagedClubsLoading(true);
      try {
        const res = await api.get("/presences/my-clubs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setManagedClubs(Array.isArray(res.data) ? res.data : []);
      } catch {
        setManagedClubs([]);
      } finally {
        setManagedClubsLoading(false);
      }
    };

    void loadManagedClubs();
  }, [user?.id, role]);

  useEffect(() => {
    setTopBarImageError(false);
  }, [displayUser?.photo_profil_url]);

  useEffect(() => {
    if (!isMessageriePage) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isMessageriePage]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("user-updated"));
    navigate("/");
  };

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="flex h-screen bg-[#F7F3E9] font-sans overflow-hidden">
      {/* --- 🟦 SIDEBAR RÉDUITE --- */}
      <aside className="w-64 bg-[#436D75] text-white flex flex-col h-full flex-shrink-0 shadow-2xl">
        {/* LOGO RÉDUIT (pt-6 au lieu de pt-10) */}
        <div className="pt-6 px-8 pb-4 flex flex-col items-start border-b border-white/10">
          <div className="text-xl font-black tracking-tighter leading-none italic">
            <span className="text-white">SMART</span>
            <span className="text-[#E98A7D] ml-1">CHABEB</span>
          </div>
          <p className="text-[7px] font-bold text-[#D9E8D1] uppercase tracking-[0.4em] mt-1.5 opacity-50">
            Gouvernement Tunisien
          </p>
        </div>

        {/* NAVIGATION AVEC SCROLL INTERNE (si l'écran est petit) */}
        <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto custom-scrollbar scrollbar-hide">
          {role === "ADMIN" && (
            <SidebarItem
              to="/dashboard"
              icon={<LayoutDashboard size={18} />}
              label="Statistiques"
              active={location.pathname === "/dashboard"}
            />
          )}

          {(role === "ADMIN" || role === "RESPONSABLE_CENTRE") && (
            <SidebarItem
              to="/centres"
              icon={<MapPin size={18} />}
              label={role === "ADMIN" ? "Gestion Centres" : "Mon Centre"}
              active={location.pathname === "/centres"}
            />
          )}

          {role === "RESPONSABLE_CENTRE" && (
            <SidebarItem
              to="/locaux"
              icon={<Building2 size={18} />}
              label="Locaux"
              active={location.pathname === "/locaux"}
            />
          )}

          {role === "RESPONSABLE_CENTRE" && (
            <SidebarItem
              to="/reservations"
              icon={<CalendarCheck size={18} />}
              label="Réservation du local"
              active={location.pathname === "/reservations"}
            />
          )}

          {(role === "ADMIN" || role === "RESPONSABLE_CENTRE") && (
            <SidebarItem
              to="/membres"
              icon={<Users size={18} />}
              label={role === "ADMIN" ? "Communauté" : "Membres Centre"}
              active={location.pathname === "/membres"}
            />
          )}

          {role !== "ADHERENT" && (
            <SidebarItem
              to="/profile"
              icon={<UserCircle size={18} />}
              label="Classement des membres"
              active={location.pathname === "/profile"}
            />
          )}

          {(role === "ADHERENT" ||
            role === "ADMIN" ||
            role === "RESPONSABLE_CENTRE") && (
            <SidebarItem
              to="/club-creation-requests"
              icon={<ClipboardList size={18} />}
              label="Demandes Clubs"
              active={location.pathname === "/club-creation-requests"}
            />
          )}

          {role === "ADHERENT" && (
            <SidebarItem
              to="/my-club-requests"
              icon={<ListTodo size={18} />}
              label="Mes Demandes"
              active={location.pathname === "/my-club-requests"}
            />
          )}

          {(role === "ADHERENT" ||
            role === "ADMIN" ||
            role === "RESPONSABLE_CENTRE") && (
            <SidebarItem
              to="/clubs"
              icon={<LayoutGrid size={18} />}
              label="Clubs & Activités"
              active={location.pathname === "/clubs"}
            />
          )}

          {role === "RESPONSABLE_CLUB" && (
            <div className="px-3 mt-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">
                Mes clubs
              </div>
              {managedClubsLoading ? (
                <div className="text-[10px] text-white/60 px-4">
                  Chargement...
                </div>
              ) : managedClubs.length === 0 ? (
                <div className="text-[10px] text-white/50 px-4">Aucun club</div>
              ) : (
                <div className="space-y-2">
                  {managedClubs.map((c) => (
                    <div key={c.id} className="px-1">
                      <Link
                        to={`/my-clubs/${c.id}`}
                        className={`flex items-center gap-2 py-1.5 px-3 rounded-md transition-all text-sm truncate ${
                          location.pathname.startsWith(`/clubs/${c.id}`)
                            ? "bg-white text-[#436D75]"
                            : "text-white/80 hover:bg-white/5"
                        }`}
                      >
                        <Building2 size={14} />
                        <span className="font-bold truncate">{c.nom}</span>
                      </Link>

                      <div className="ml-8 mt-1 flex items-center gap-2">
                        <Link
                          to={`/clubs/${c.id}/requests`}
                          className="text-[11px] font-black text-white/60 hover:text-white hover:underline"
                        >
                          Membres
                        </Link>
                        <span className="text-white/30">•</span>
                        <Link
                          to={`/clubs/${c.id}/staff`}
                          className="text-[11px] font-black text-white/60 hover:text-white hover:underline"
                        >
                          Staff
                        </Link>
                        <span className="text-white/30">•</span>
                        <Link
                          to={`/my-clubs/${c.id}/tasks`}
                          className="text-[11px] font-black text-white/60 hover:text-white hover:underline"
                        >
                          Tâches
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {role === "ADHERENT" && (
            <SidebarItem
              to="/events"
              icon={<CalendarDays size={18} />}
              label="Événements"
              active={location.pathname === "/events"}
            />
          )}

          {(role === "ADMIN" ||
            role === "RESPONSABLE_CENTRE" ||
            role === "RESPONSABLE_CLUB") && (
            <SidebarItem
              to="/events-management"
              icon={<CalendarDays size={18} />}
              label="Gestion Événements"
              active={location.pathname === "/events-management"}
            />
          )}

          {role === "RESPONSABLE_CLUB" && (
            <SidebarItem
              to="/presences"
              icon={<ClipboardCheck size={18} />}
              label="Présences"
              active={location.pathname === "/presences"}
            />
          )}

          {(role === "RESPONSABLE_CENTRE" || role === "RESPONSABLE_CLUB") && (
            <SidebarItem
              to="/events-manager"
              icon={<CalendarDays size={18} />}
              label="Gestion Participants"
              active={location.pathname === "/events-manager"}
            />
          )}

          {(role === "ADHERENT" || role === "RESPONSABLE_CLUB") && (
            <SidebarItem
              to="/payment-history"
              icon={<CreditCard size={18} />}
              label="Historique Paiements"
              active={location.pathname === "/payment-history"}
            />
          )}

          {role === "RESPONSABLE_CLUB" && (
            <SidebarItem
              to="/club-my-reservations"
              icon={<ClipboardList size={18} />}
              label="Mes Réservations"
              active={location.pathname === "/club-my-reservations"}
            />
          )}

          {role === "ADHERENT" && (
            <SidebarItem
              to="/adherent-my-reservations"
              icon={<ClipboardList size={18} />}
              label="Mes Réservations"
              active={location.pathname === "/adherent-my-reservations"}
            />
          )}

          {(role === "ADMIN" || role === "RESPONSABLE_CENTRE") && (
            <SidebarItem
              to="/roles"
              icon={<ShieldCheck size={18} />}
              label="Grades & Droits"
              active={location.pathname === "/roles"}
            />
          )}

          {role === "ADMIN" && (
            <SidebarItem
              to="/coaches"
              icon={<GraduationCap size={18} />}
              label="Gestion Staff"
              active={location.pathname === "/coaches"}
            />
          )}
        </nav>

        {/* DÉCONNEXION RÉDUITE */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 rounded-xl bg-black/10 text-white/50 hover:bg-[#E98A7D] hover:text-white transition-all font-black text-[9px] uppercase tracking-widest cursor-pointer group"
          >
            <LogOut
              size={14}
              className="group-hover:translate-x-1 transition-transform"
            />
            <span>Quitter</span>
          </button>
        </div>
      </aside>

      {/* --- 🏛️ ZONE DE DROITE --- */}
      <main className="flex-1 flex flex-col overflow-hidden p-4">
        <header className="relative z-0 bg-white/60 backdrop-blur-md h-16 px-6 flex justify-between items-center rounded-3xl border border-white shadow-sm mb-4 flex-shrink-0 overflow-visible">
          <div className="flex items-center space-x-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg"
              className="h-6 shadow-sm rounded-sm"
              alt="TN"
            />
            <div className="leading-tight border-l pl-3 border-gray-200">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">
                République Tunisienne
              </p>
              <h2 className="text-[10px] font-black text-[#436D75] uppercase tracking-tighter">
                Ministère de la Jeunesse et des Sports
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MessageBell />
            <Link
              to="/fil-actualite"
              className="w-10 h-10 rounded-full border border-gray-200 bg-white text-[#436D75] flex items-center justify-center hover:bg-[#F7F3E9] hover:border-[#cfdad3] transition-colors"
              title="Fil d'actualité"
            >
              <Newspaper size={18} />
            </Link>
            <FavoritePostsBell />
            <NotificationBell />
            <Link
              to="/mon-profil"
              className="flex items-center space-x-3 bg-white p-1 rounded-full pr-4 border border-gray-100 shadow-sm hover:border-[#436D75]/30 hover:bg-[#F8FBFA] transition-colors"
              title="Mon profil"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#ECEFF3] flex items-center justify-center text-[#9AA3AF] shadow-inner">
                {showTopBarImage ? (
                  <img
                    src={displayUser.photo_profil_url}
                    alt={`${displayUser.nom} ${displayUser.prenom}`}
                    className="w-full h-full object-cover"
                    onError={() => setTopBarImageError(true)}
                  />
                ) : (
                  <UserCircle size={20} />
                )}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-[#436D75] leading-none">
                  {displayUser?.nom} {displayUser?.prenom}
                </p>
                <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest italic">
                  {role}
                </p>
              </div>
            </Link>
          </div>
        </header>

        <div className="relative z-0 flex-1 min-h-0 bg-white rounded-[40px] shadow-2xl border border-gray-50 overflow-hidden flex flex-col">
          <div
            className={`p-8 flex-1 min-h-0 ${isMessageriePage ? "overflow-hidden" : "overflow-y-auto custom-scrollbar"}`}
            data-layout-scroll-container="true"
          >
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
      className={`flex items-center space-x-3 py-2.5 px-4 rounded-xl transition-all duration-300 group ${
        active
          ? "bg-white text-[#436D75] shadow-md italic scale-[1.02]"
          : "text-white/40 hover:text-white hover:bg-white/5"
      }`}
    >
      <span
        className={`transition-transform duration-300 ${active ? "text-[#E98A7D]" : "group-hover:scale-110"}`}
      >
        {icon}
      </span>
      <span className="text-xs font-bold tracking-tight">{label}</span>
    </Link>
  );
}
