import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Users,
  GraduationCap,
  LogOut,
  LayoutGrid,
  UserCircle,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  ClipboardCheck,
  Newspaper,
  ListTodo,
  CreditCard,
  Sparkles,
  Bot,
  Award,
  Star,
  Wallet,
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { FavoritePostsBell } from "./FavoritePostsBell";
import { MessageBell } from "./MessageBell";
import api from "../../api/axios";
import { ROUTES } from "../../constants/routes";
import {
  forceLogout,
  isAccountLockMessage,
  syncStoredUserFromProfile,
} from "../../utils/authSession";

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [managedClubs, setManagedClubs] = useState<any[]>([]);
  const [staffClubs, setStaffClubs] = useState<any[]>([]);
  const [managedClubsLoading, setManagedClubsLoading] = useState(false);
  const [staffClubsLoading, setStaffClubsLoading] = useState(false);
  const role = dbProfile?.role ?? user?.role;
  const displayUser = dbProfile ?? user;
  const hasProfileImage =
    typeof displayUser?.photo_profil_url === "string" &&
    displayUser.photo_profil_url.trim() !== "";
  const [topBarImageError, setTopBarImageError] = useState(false);
  const showTopBarImage = hasProfileImage && !topBarImageError;
  const isMessageriePage = location.pathname === "/messagerie";
  const isStaffCalendarPage = location.pathname === "/staff-calendar";
  const isChatbotPage = location.pathname === "/chatbot";

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const isAdherentClubPage =
      location.pathname === "/clubs" ||
      /^\/clubs\/[^/]+$/.test(location.pathname);

    const isStaffTasksPage = /^\/my-clubs\/[^/]+\/staff-tasks/.test(
      location.pathname,
    );

    if (
      role === "ADHERENT" &&
      !isAdherentClubPage &&
      !isStaffTasksPage &&
      !isStaffCalendarPage &&
      location.pathname !== "/club-creation-requests" &&
      location.pathname !== "/mon-profil" &&
      location.pathname !== "/fil-actualite" &&
      location.pathname !== "/messagerie" &&
      location.pathname !== "/chatbot" &&
      location.pathname !== "/my-club-requests" &&
      location.pathname !== "/club-reservations" &&
      location.pathname !== "/adherent-my-reservations" &&
      location.pathname !== "/mes-seances" &&
      location.pathname !== "/certificats" &&
      location.pathname !== "/events" &&
      location.pathname !== "/payment-history"
    ) {
      navigate("/clubs");
    }
  }, [user, role, navigate, location.pathname, isStaffCalendarPage]);

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

        if (response.data?.compte_actif === false) {
          forceLogout("account-disabled");
          return;
        }

        syncStoredUserFromProfile(response.data);
        setDbProfile(response.data);
      } catch (error: any) {
        const status = error?.response?.status;
        const message = error?.response?.data?.message;

        if (
          status === 401 ||
          (status === 403 && isAccountLockMessage(message))
        ) {
          forceLogout(message);
          return;
        }

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

    const handleSessionInvalidated = () => {
      setUser(null);
      setDbProfile(null);
      setManagedClubs([]);
      setStaffClubs([]);
    };

    window.addEventListener(
      "auth-session-invalidated",
      handleSessionInvalidated as EventListener,
    );

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener(
        "user-updated",
        handleUserUpdated as EventListener,
      );
      window.removeEventListener(
        "auth-session-invalidated",
        handleSessionInvalidated as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const verifyCurrentSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      try {
        const response = await api.get("/users/me/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cancelled) {
          return;
        }

        if (response.data?.compte_actif === false) {
          forceLogout("account-disabled");
          return;
        }

        syncStoredUserFromProfile(response.data);
        setDbProfile(response.data);
      } catch (error: any) {
        if (cancelled) {
          return;
        }

        const status = error?.response?.status;
        const message = error?.response?.data?.message;

        if (
          status === 401 ||
          (status === 403 && isAccountLockMessage(message))
        ) {
          forceLogout(message);
          return;
        }
      }
    };

    void verifyCurrentSession();

    const intervalId = window.setInterval(verifyCurrentSession, 10000);
    const handleFocus = () => {
      void verifyCurrentSession();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void verifyCurrentSession();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setManagedClubs([]);
      setStaffClubs([]);
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
    const token = localStorage.getItem("token");
    if (!token) {
      setStaffClubs([]);
      return;
    }

    const loadStaffClubs = async () => {
      setStaffClubsLoading(true);
      try {
        const res = await api.get("/clubs/my-staff-clubs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStaffClubs(Array.isArray(res.data) ? res.data : []);
      } catch {
        setStaffClubs([]);
      } finally {
        setStaffClubsLoading(false);
      }
    };

    void loadStaffClubs();
  }, [user?.id]);

  useEffect(() => {
    setTopBarImageError(false);
  }, [displayUser?.photo_profil_url]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

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
    <div className="relative flex h-screen bg-[#F7F3E9] font-sans overflow-hidden">
      {mobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      ) : null}

      {/* --- 🟦 SIDEBAR RÉDUITE --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#436D75] text-white flex flex-col flex-shrink-0 shadow-2xl transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* LOGO RÉDUIT (pt-6 au lieu de pt-10) */}
        <div className="pt-6 px-6 pb-4 flex flex-col items-start border-b border-white/10 md:px-8">
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
              to={ROUTES.admin.dashboard}
              icon={<LayoutDashboard size={18} />}
              label="Statistiques"
              active={location.pathname === ROUTES.admin.dashboard}
            />
          )}

          {role === "ADMIN" && (
            <SidebarItem
              to={ROUTES.admin.reservationRevenues}
              icon={<Wallet size={18} />}
              label="Revenus Réservations"
              active={location.pathname === ROUTES.admin.reservationRevenues}
            />
          )}

          {(role === "ADMIN" || role === "RESPONSABLE_CENTRE") && (
            <SidebarItem
              to={role === "ADMIN" ? ROUTES.admin.centres : ROUTES.centre.home}
              icon={<MapPin size={18} />}
              label={role === "ADMIN" ? "Gestion Centres" : "Mon Centre"}
              active={
                location.pathname === ROUTES.admin.centres ||
                location.pathname === ROUTES.centre.home
              }
            />
          )}

          {role === "RESPONSABLE_CENTRE" && (
            <SidebarItem
              to={ROUTES.centre.locaux}
              icon={<Building2 size={18} />}
              label="Locaux"
              active={location.pathname === ROUTES.centre.locaux}
            />
          )}

          {role === "RESPONSABLE_CENTRE" && (
            <SidebarItem
              to={ROUTES.centre.reservations}
              icon={<CalendarCheck size={18} />}
              label="Réservation du local"
              active={location.pathname === ROUTES.centre.reservations}
            />
          )}

          {(role === "ADMIN" || role === "RESPONSABLE_CENTRE") && (
            <SidebarItem
              to={
                role === "ADMIN" ? ROUTES.admin.membres : ROUTES.centre.membres
              }
              icon={<Users size={18} />}
              label={role === "ADMIN" ? "Communauté" : "Membres Centre"}
              active={
                location.pathname === ROUTES.admin.membres ||
                location.pathname === ROUTES.centre.membres
              }
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
            
            role === "RESPONSABLE_CENTRE") && (
            <SidebarItem
              to={ROUTES.club.creationRequests}
              icon={<ClipboardList size={18} />}
              label="Demandes Clubs"
              active={location.pathname === ROUTES.club.creationRequests}
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
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-black text-white/60">
                          <Link
                            to={`/clubs/${c.id}/requests`}
                            className="hover:text-white hover:underline"
                          >
                            Membres
                          </Link>
                          <Link
                            to={`/clubs/${c.id}/staff`}
                            className="hover:text-white hover:underline"
                          >
                            Staff
                          </Link>
                          <Link
                            to={`/my-clubs/${c.id}/tasks`}
                            className="hover:text-white hover:underline"
                          >
                            Tâches
                          </Link>
                          <Link
                            to={`/my-clubs/${c.id}/feedbacks`}
                            className="hover:text-white hover:underline"
                          >
                            Feedbacks
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {staffClubs.length > 0 && (
            <div className="px-3 mt-4">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">
                Taches staff
              </div>
              {staffClubsLoading ? (
                <div className="text-[10px] text-white/60 px-4">
                  Chargement...
                </div>
              ) : (
                <div className="space-y-2">
                  {staffClubs.map((item) => {
                    const club = item.club;
                    return (
                      <div key={item.id} className="px-1">
                        <Link
                          to={`/my-clubs/${club.id}/staff-tasks`}
                          className={`flex items-center gap-2 py-1.5 px-3 rounded-md transition-all text-sm truncate ${
                            location.pathname.startsWith(
                              `/my-clubs/${club.id}/staff-tasks`,
                            )
                              ? "bg-white text-[#436D75]"
                              : "text-white/80 hover:bg-white/5"
                          }`}
                        >
                          <ListTodo size={14} />
                          <span className="font-bold truncate">{club.nom}</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {staffClubs.length > 0 && (
            <div className="px-3 mt-3">
              <Link
                to={ROUTES.club.staffCalendar}
                className={`flex items-center gap-2 py-1.5 px-3 rounded-md transition-all text-sm truncate ${
                  isStaffCalendarPage
                    ? "bg-white text-[#436D75]"
                    : "text-white/80 hover:bg-white/5"
                }`}
              >
                <CalendarDays size={14} />
                <span className="font-bold truncate">Calendrier personnel</span>
              </Link>
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

          {role === "ADHERENT" && (
            <SidebarItem
              to="/mes-seances"
              icon={<Star size={18} />}
              label="Feedback séances"
              active={location.pathname === "/mes-seances"}
            />
          )}

          {role === "ADHERENT" && (
            <SidebarItem
              to="/certificats"
              icon={<Award size={18} />}
              label="Mes certificats"
              active={location.pathname === "/certificats"}
            />
          )}

          {role === "ADMIN" && (
            <SidebarItem
              to={ROUTES.admin.eventsManagement}
              icon={<CalendarDays size={18} />}
              label="Gestion Événements"
              active={location.pathname === ROUTES.admin.eventsManagement}
            />
          )}

          {(role === "RESPONSABLE_CENTRE" || role === "RESPONSABLE_CLUB") && (
            <SidebarItem
              to={ROUTES.centre.eventsManagement}
              icon={<CalendarDays size={18} />}
              label="Gestion Événements"
              active={location.pathname === ROUTES.centre.eventsManagement}
            />
          )}

          {role === "RESPONSABLE_CLUB" && (
            <>
              <SidebarItem
                to="/presences"
                icon={<ClipboardCheck size={18} />}
                label="Présences"
                active={location.pathname === "/presences"}
              />
              <SidebarItem
                to="/club-recommendations"
                icon={<Sparkles size={18} />}
                label="Recommandations IA"
                active={location.pathname === "/club-recommendations"}
              />
            </>
          )}

          {role === "RESPONSABLE_CLUB" && (
            <SidebarItem
              to={ROUTES.club.clubEventsRequests}
              icon={<CalendarDays size={18} />}
              label="Mes demandes événements"
              active={location.pathname === ROUTES.club.clubEventsRequests}
            />
          )}

          <SidebarItem
            to={ROUTES.shared.chatbot}
            icon={<Bot size={18} />}
            label="Assistant IA"
            active={location.pathname === ROUTES.shared.chatbot}
          />

          {(role === "RESPONSABLE_CENTRE" || role === "RESPONSABLE_CLUB") && (
            <SidebarItem
              to={ROUTES.centre.eventsManager}
              icon={<CalendarDays size={18} />}
              label="Gestion Participants"
              active={location.pathname === ROUTES.centre.eventsManager}
            />
          )}

          {role === "RESPONSABLE_CENTRE" && (
            <SidebarItem
              to={ROUTES.centre.centreEventsRequests}
              icon={<CalendarCheck size={18} />}
              label="Valider événements"
              active={location.pathname === ROUTES.centre.centreEventsRequests}
            />
          )}

          {(role === "ADHERENT" || role === "RESPONSABLE_CLUB") && (
            <>
              <SidebarItem
                to={ROUTES.club.clubReservations}
                icon={<CalendarPlus size={18} />}
                label="Réserver un local"
                active={location.pathname === ROUTES.club.clubReservations}
              />
              <SidebarItem
                to={ROUTES.shared.paymentHistory}
                icon={<CreditCard size={18} />}
                label="Historique Paiements"
                active={location.pathname === ROUTES.shared.paymentHistory}
              />
            </>
          )}

          {role === "RESPONSABLE_CLUB" && (
            <SidebarItem
              to={ROUTES.club.clubMyReservations}
              icon={<ClipboardList size={18} />}
              label="Mes Réservations"
              active={location.pathname === ROUTES.club.clubMyReservations}
            />
          )}

          {role === "ADHERENT" && (
            <SidebarItem
              to={ROUTES.adherent.myReservations}
              icon={<ClipboardList size={18} />}
              label="Mes Réservations"
              active={location.pathname === ROUTES.adherent.myReservations}
            />
          )}

          {/* {(role === "ADMIN" || role === "RESPONSABLE_CENTRE") && (
            <SidebarItem
              to="/roles"
              icon={<ShieldCheck size={18} />}
              label="Grades & Droits"
              active={location.pathname === "/roles"}
            />
          )}*/}

          
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
      <main className="flex-1 flex flex-col overflow-hidden p-3 md:p-4">
        <header className="relative z-0 mb-3 flex h-14 flex-row items-center justify-between rounded-3xl border border-white bg-white/60 px-4 shadow-sm backdrop-blur-md overflow-visible md:mb-4 md:h-16 md:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-[#436D75] shadow-sm md:hidden"
              aria-label="Ouvrir le menu"
            >
              <LayoutGrid size={16} />
            </button>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg"
              className="h-5 shadow-sm rounded-sm shrink-0"
              alt="TN"
            />
            <div className="leading-tight border-l pl-2 border-gray-200 min-w-0 hidden sm:block">
              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-400 truncate">
                République Tunisienne
              </p>
              <h2 className="text-[9px] font-black text-[#436D75] uppercase tracking-tighter truncate">
                Ministère de la Jeunesse et des Sports
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 md:gap-2">
            <MessageBell />
            <Link
              to="/fil-actualite"
              className="w-9 h-9 rounded-full border border-gray-200 bg-white text-[#436D75] flex items-center justify-center hover:bg-[#F7F3E9] hover:border-[#cfdad3] transition-colors"
              title="Fil d'actualité"
            >
              <Newspaper size={16} />
            </Link>
            <FavoritePostsBell />
            <NotificationBell />
            <Link
              to="/mon-profil"
              className="flex items-center gap-2 rounded-full border border-gray-100 bg-white p-1 pr-2 shadow-sm transition-colors hover:border-[#436D75]/30 hover:bg-[#F8FBFA] md:pr-3"
              title="Mon profil"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-[#ECEFF3] flex items-center justify-center text-[#9AA3AF] shadow-inner shrink-0 md:w-8 md:h-8">
                {showTopBarImage ? (
                  <img
                    src={displayUser.photo_profil_url}
                    alt={`${displayUser.nom} ${displayUser.prenom}`}
                    className="w-full h-full object-cover"
                    onError={() => setTopBarImageError(true)}
                  />
                ) : (
                  <UserCircle size={18} />
                )}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-[10px] font-black text-[#436D75] leading-none">
                  {displayUser?.nom} {displayUser?.prenom}
                </p>
                <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest italic">
                  {role === "ADMIN" ? "Admin"
                    : role === "RESPONSABLE_CLUB" ? "Resp. Club"
                    : role === "RESPONSABLE_CENTRE" ? "Resp. Centre"
                    : role === "ADHERENT" ? "Membre"
                    : role}
                </p>
              </div>
            </Link>
          </div>
        </header>

        <div
          className={`relative z-0 flex-1 min-h-0 overflow-hidden flex flex-col ${
            isChatbotPage
              ? "bg-transparent border-0 shadow-none rounded-none"
              : "bg-white rounded-[40px] shadow-2xl border border-gray-50"
          }`}
        >
          <div
            className={`flex-1 min-h-0 ${
              isChatbotPage
                ? "p-0 overflow-hidden"
                : `p-8 ${isMessageriePage ? "overflow-hidden" : "overflow-y-auto custom-scrollbar"}`
            }`}
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
          : "text-[#D9E8D1] hover:text-white hover:bg-white/10"
      }`}
    >
      <span
        className={`transition-transform duration-300 ${active ? "text-[#E98A7D]" : "group-hover:scale-110"}`}
      >
        {icon}
      </span>
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </Link>
  );
}
