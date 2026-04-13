import { z } from 'zod';

export const createTenantSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().min(1).max(100),
  adminName: z.string().min(1).max(50),
  adminPhone: z.string().regex(/^1[3-9]\d{9}$/),
  adminPassword: z.string().min(6).max(50),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
