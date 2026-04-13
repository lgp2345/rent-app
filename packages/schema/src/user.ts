import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1).max(50),
  phone: z.string().regex(/^1[3-9]\d{9}$/),
  password: z.string().min(6).max(50),
  role: z.enum(['super_admin', 'admin']),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/)
    .optional(),
  role: z.enum(['super_admin', 'admin']).optional(),
  status: z.number().int().min(0).max(2).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
