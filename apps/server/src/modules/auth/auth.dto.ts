import { createZodDto } from 'nestjs-zod';
import { loginSchema, refreshSchema } from '@rent-app/schema';

export class LoginDto extends createZodDto(loginSchema) {}
export class RefreshDto extends createZodDto(refreshSchema) {}
