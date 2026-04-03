export const BLOCKED_STAFF_ROLE = "RESPONSABLE_CLUB";

export const normalizeRoleKey = (value: string) =>
  value
    .toUpperCase()
    .trim()
    .replace(/[\s-]+/g, "_");

export const formatRoleLabel = (roleName: string) =>
  roleName
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
