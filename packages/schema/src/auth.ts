import { z } from 'zod';

export const loginSchema = z.object({
  code: z.string().min(1),
  account: z.string().min(1),
  password: z.string().min(6),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
