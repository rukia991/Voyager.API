export const Roles = {
  SuperAdmin: 'SuperAdmin',
  Admin: 'Admin',
  Manager: 'Manager',
  Staff: 'Staff',
  Client: 'Client',
} as const;

export type AppRole = typeof Roles[keyof typeof Roles];

const roleAliasMap: Record<string, AppRole> = {
  SuperAdmin: Roles.SuperAdmin,
  Admin: Roles.Admin,
  Manager: Roles.Manager,
  Staff: Roles.Staff,
  Client: Roles.Client,
  'Marketing Manager': Roles.Manager,
  'Marketing Staff': Roles.Staff,
  Customer: Roles.Client,
};

const accessOrder: AppRole[] = [
  Roles.Client,
  Roles.Staff,
  Roles.Manager,
  Roles.Admin,
  Roles.SuperAdmin,
];

export const normalizeRole = (role?: string | null): AppRole | null => {
  if (!role) {
    return null;
  }

  return roleAliasMap[role] ?? null;
};

export const hasRoleAccess = (role: string | null | undefined, allowedRoles: AppRole[]) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole !== null && allowedRoles.includes(normalizedRole);
};

export const isClientRole = (role?: string | null) => normalizeRole(role) === Roles.Client;
export const isAdminRole = (role?: string | null) => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === Roles.Admin || normalizedRole === Roles.SuperAdmin;
};

export const defaultRouteForRole = (role?: string | null) =>
  isClientRole(role) ? '/portal/home' : '/dashboard';

export const roleLabel = (role?: string | null) => normalizeRole(role) ?? 'Unknown';

export const roleAtLeast = (role: string | null | undefined, minimumRole: AppRole) => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === null) {
    return false;
  }

  return accessOrder.indexOf(normalizedRole) >= accessOrder.indexOf(minimumRole);
};
