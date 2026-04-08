import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getRoleNames, isAdminRole, isInvestorRole, normalizeRole } from "@/lib/roleUtils";

const hasPermission = (permissions, permission) => {
  if (!permission) return true;
  if (!permissions) return false;
  if (permissions.includes("*")) return true;
  if (permissions.includes(permission)) return true;
  const [resource, action] = permission.split(":");
  if (!resource || !action) return false;
  if (permissions.includes(`${resource}:*`)) return true;
  const featurePrefix = `${resource}.`;
  return permissions.some(
    (perm) => perm.startsWith(featurePrefix) && perm.endsWith(`:${action}`)
  );
};

const hasAnyRole = (roles, targets) =>
  targets.some((target) => roles.includes(target));

const hasPanelAccess = (primaryRole, roleNames = [], panel, permissions = []) => {
  if (!panel) return true;
  const roles = getRoleNames({ roleName: primaryRole, roleNames });
  const hasWildcard = permissions.includes("*");

  if (panel === "investor") {
    return (
      isInvestorRole(roles) ||
      hasWildcard ||
      permissions.some((permission) => permission.startsWith("investor."))
    );
  }

  if (panel === "super-admin") {
    return hasAnyRole(roles, ["superadmin"]) || hasWildcard;
  }

  if (panel === "admin") {
    return (
      isAdminRole(roles) ||
      hasWildcard ||
      permissions.some((permission) => permission.startsWith("platform."))
    );
  }

  return false;
};

export const PermissionGuard = ({
  children,
  requiredPanel,
  requiredPermissions = [],
  requireAll = false,
  allowedRoles = [],
  redirectTo = "/login",
  isRoute = true,
  fallback = null,
}) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return isRoute ? <Navigate to={redirectTo} state={{ from: location }} replace /> : <>{fallback}</>;
  }

  const permissions = user.permissions || [];
  const roleNames = [user.roleName, ...(user.roleNames || [])].filter(Boolean);

  let isAuthorized = true;

  if (
    requiredPanel &&
    !hasPanelAccess(user.roleName || user.role, roleNames, requiredPanel, permissions)
  ) {
    isAuthorized = false;
  }

  if (allowedRoles.length > 0) {
    const allowed = allowedRoles.map((role) => normalizeRole(role));
    const roles = getRoleNames(user);
    const matches = roles.some((role) => allowed.includes(role));
    if (!matches && !permissions.includes("*")) {
      isAuthorized = false;
    }
  }

  if (requiredPermissions.length > 0) {
    if (requireAll) {
      const hasAll = requiredPermissions.every((perm) => hasPermission(permissions, perm));
      if (!hasAll) isAuthorized = false;
    } else {
      const hasAny = requiredPermissions.some((perm) => hasPermission(permissions, perm));
      if (!hasAny) isAuthorized = false;
    }
  }

  if (!isAuthorized) {
    return isRoute ? <Navigate to="/unauthorized" replace /> : <>{fallback}</>;
  }

  return <>{children}</>;
};
