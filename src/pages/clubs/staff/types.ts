/**
 * types.ts — Types TypeScript locaux du module staff de club.
 *
 * TYPES :
 *   NotificationState    — Toast de notification { msg, type: 'success'|'error' } | null
 *   ClubRoleItem         — Rôle personnalisé du club { id, nom, description, is_active, staff[] }
 *   ClubStaffPageState   — État complet de la page ClubStaffPage
 *                          (club, search, loading, error, notification, modals ouverts)
 */
export type NotificationState = {
  msg: string;
  type: "success" | "error";
} | null;

export type ClubRoleItem = {
  id: string;
  nom: string;
  description?: string | null;
  is_active?: boolean;
  staff?: any[];
};

export type ClubStaffPageState = {
  club: any;
  search: string;
  loading: boolean;
  error: string;
  notification: NotificationState;
  isAddStaffModalOpen: boolean;
  isAddRoleModalOpen: boolean;
  editingRole: ClubRoleItem | null;
  roleToDeactivate: ClubRoleItem | null;
  clubRoles: ClubRoleItem[];
  availableStaff: any[];
  availableRoles: string[];
  roleLoadError: string;
  newRoleName: string;
  newRoleDescription: string;
  isCreatingRole: boolean;
  selectedStaffId: string;
  selectedRole: string;
  staffRoleChanges: Record<string, string>;
  updatingClubResponsable: boolean;
  updatingStaffRoleId: string | null;
  updatingStaffActiveId: string | null;
  staffMembers: any[];
  filteredStaff: any[];
  personnelCount: number;
  totalMembers: number;
  staffCount: number;
};
