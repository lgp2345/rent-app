import { z } from 'zod';

export const PERMISSIONS = [
  'dashboard',
  'buildings',
  'rooms',
  'tenants_mgmt',
  'fees',
  'users',
  'roles',
] as const;

export type PermissionName = (typeof PERMISSIONS)[number];

export const updateRolePermissionsSchema = z.object({
  role: z.enum(['super_admin', 'admin']),
  permissions: z.array(z.enum(PERMISSIONS)),
});

export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;
