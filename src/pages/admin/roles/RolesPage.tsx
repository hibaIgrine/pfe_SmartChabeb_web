import { useEffect, useState, useMemo } from "react";
import api from "../../../api/axios";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { RoleHeader } from "./components/RoleHeader";
import { RoleFilters } from "./components/RoleFilters";
import { RoleCard } from "./components/RoleCard";
import { RoleModals } from "./components/RoleModals";

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<any>(null);

  // Filtres
  const [search, setSearch] = useState("");
  const [selectedGouv, setSelectedGouv] = useState("");
  const [selectedCentreId, setSelectedCentreId] = useState("");

  // Modales
  const [modalType, setModalType] = useState<"ADD" | "EDIT" | "DELETE" | null>(
    null,
  );
  const [selectedRole, setSelectedRole] = useState<any>(null);

  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [resR, resC] = await Promise.all([
        api.get("/roles", { headers }),
        api.get("/centres", { headers }),
      ]);
      setRoles(resR.data);
      setCentres(resC.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 💡 LOGIQUE SMART : Filtrage des grades et calcul des compteurs selon l'établissement
  // 💡 LOGIQUE CORRECTE : Filtrage des grades et calcul des compteurs
  // Dans RolesPage.tsx, remplace le bloc processedRoles par celui-ci :

  const processedRoles = useMemo(() => {
    return roles.map((role: any) => {
      // 1. On récupère la liste des utilisateurs pour ce rôle
      const users = role.utilisateurs || [];

      // 2. On filtre localement selon les sélections de l'admin
      const filteredUsers = users.filter((u: any) => {
        // Si aucun filtre n'est sélectionné, on garde tout le monde
        if (!selectedGouv && !selectedCentreId) return true;

        // Filtre Région : On regarde le gouvernorat du centre rattaché à l'utilisateur
        const matchGouv =
          !selectedGouv || (u.centre && u.centre.gouvernorat === selectedGouv);

        // Filtre Centre : On compare l'ID du centre de l'utilisateur avec celui choisi
        const matchCentre =
          !selectedCentreId || u.id_centre === selectedCentreId;

        return matchGouv && matchCentre;
      });

      // 3. On retourne le rôle avec son nouveau compteur calculé
      return {
        ...role,
        filteredCount: filteredUsers.length,
      };
    });
  }, [roles, selectedGouv, selectedCentreId]);
  // 💡 On a retiré 'search' du useMemo pour que le chiffre
  // ne disparaisse pas quand on cherche un nom de rôle.

  const showAlert = (msg: string, type: "error" | "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10 max-w-7xl mx-auto">
      {notification && (
        <div
          className={`fixed top-8 right-8 z-[1000] flex items-center space-x-3 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-md animate-in slide-in-from-right-5 ${notification.type === "error" ? "bg-[#E98A7D] text-white" : "bg-[#D9E8D1] text-[#436d75]"}`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span className="text-xs font-black uppercase tracking-wider">
            {notification.msg}
          </span>
        </div>
      )}

      <RoleHeader
        onAdd={() => {
          setSelectedRole(null);
          setModalType("ADD");
        }}
      />

      <RoleFilters
        search={search}
        setSearch={setSearch}
        selectedGouv={selectedGouv}
        setSelectedGouv={setSelectedGouv}
        selectedCentre={selectedCentreId}
        setSelectedCentre={setSelectedCentreId}
        centres={centres}
        gouvernorats={GOUVERNORATS_AR}
        onReset={() => {
          setSearch("");
          setSelectedGouv("");
          setSelectedCentreId("");
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="animate-spin text-smart-teal" size={30} />
          </div>
        ) : (
          processedRoles.map((role: any) => (
            <RoleCard
              key={role.id}
              role={role}
              filteredCount={role.filteredCount}
              onEdit={(r: any) => {
                setSelectedRole(r);
                setModalType("EDIT");
              }}
              onDelete={(r: any) => {
                setSelectedRole(r);
                setModalType("DELETE");
              }}
            />
          ))
        )}
      </div>

      <RoleModals
        type={modalType}
        data={selectedRole}
        onClose={() => setModalType(null)}
        onRefresh={loadData}
        showAlert={showAlert}
      />
    </div>
  );
}

const GOUVERNORATS_AR = [
  "أريانة",
  "باجة",
  "بن عروس",
  "بنزرت",
  "تطاوين",
  "توزر",
  "تونس",
  "جندوبة",
  "زغوان",
  "سليانة",
  "سوسة",
  "سيدي بوزيد",
  "قبلي",
  "صفاقس",
  "قابس",
  "القصرين",
  "قفصة",
  "القيروان",
  "الكاف",
  "مدنين",
  "المنستير",
  "منوبة",
  "المهدية",
  "نابل",
];
