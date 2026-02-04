import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

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

const hasPanelAccess = (role, roleNames = [], panel) => {
  if (!panel) return true;
  const roles = [role, ...roleNames].filter(Boolean).map((r) => String(r).toLowerCase());
  if (panel === "investor") return true; 
  if (panel === "super-admin") return roles.includes("superadmin") || roles.includes("super-admin");
  if (panel === "admin") return roles.includes("admin") || roles.includes("superadmin") || roles.includes("super-admin");
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
  const roleNames = user.roleNames || [];

  let isAuthorized = true;

  if (requiredPanel && !hasPanelAccess(user.role, roleNames, requiredPanel)) {
    isAuthorized = false;
  }

  if (allowedRoles.length > 0) {
    const roles = [user.role, ...roleNames].filter(Boolean);
    const matches = roles.some((role) => allowedRoles.includes(String(role)));
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
