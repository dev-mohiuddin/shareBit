export const normalizeRole = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[_\s-]+/g, "");

export const getRoleNames = (user = {}) =>
  [user?.roleName, ...(user?.roleNames || []), user?.role]
    .filter(Boolean)
    .map(normalizeRole);

export const isAdminRole = (roles = []) =>
  roles.some((role) =>
    ["admin", "superadmin", "operationsadmin", "complianceadmin", "manager"].includes(role)
  );

export const isInvestorRole = (roles = []) =>
  roles.some((role) => ["investor", "user"].includes(role));
