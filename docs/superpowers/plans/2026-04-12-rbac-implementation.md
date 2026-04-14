# RBAC 权限模块实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为房屋租赁系统构建后台管理 RBAC 权限模块，包含后端 API、前端管理界面和共享 Schema。

**Architecture:** Monorepo 三层架构：packages/schema 提供前后端共享 Zod 校验，apps/server 提供基于 NestJS + Fastify 的 REST API（JWT 认证 + 页面级权限），并通过 nestjs-zod 在 Controller 层统一 DTO 校验，apps/admin 提供 React 管理界面。多租户通过 tenant_id 字段隔离。

**Tech Stack:** NestJS, Fastify, nestjs-zod, Drizzle ORM, PostgreSQL, Zod, React, TanStack Router, Zustand, HeroUI, Tailwind CSS, Axios

**Design Spec:** `docs/superpowers/specs/2026-04-12-rbac-design.md`

---

## 文件结构总览

### packages/schema

```
packages/schema/
  package.json
  tsconfig.json
  src/
    index.ts
    auth.ts
    user.ts
    tenant.ts
    permission.ts
    common.ts
```

### apps/server

```
apps/server/
  package.json
  tsconfig.json
  drizzle.config.ts
  src/
    main.ts
    app.module.ts
    db/
      schema.ts
      index.ts
      seed.ts
    common/
      utils/snowflake.ts
      guards/jwt-auth.guard.ts
      guards/permission.guard.ts
      decorators/require-permission.decorator.ts
      decorators/public.decorator.ts
      middleware/tenant-context.middleware.ts
    modules/
      auth/auth.module.ts
      auth/auth.controller.ts
      auth/auth.service.ts
      users/users.module.ts
      users/users.controller.ts
      users/users.service.ts
      permissions/permissions.module.ts
      permissions/permissions.controller.ts
      permissions/permissions.service.ts
      audit/audit.module.ts
      audit/audit.controller.ts
      audit/audit.service.ts
      tenants-mgmt/tenants-mgmt.module.ts
      tenants-mgmt/tenants-mgmt.controller.ts
      tenants-mgmt/tenants-mgmt.service.ts
      buildings/buildings.module.ts
      buildings/buildings.controller.ts
      buildings/buildings.service.ts
      rooms/rooms.module.ts
      rooms/rooms.controller.ts
      rooms/rooms.service.ts
      fees/fees.module.ts
      fees/fees.controller.ts
      fees/fees.service.ts
```

### apps/admin

```
apps/admin/
  package.json
  tsconfig.json
  vite.config.ts
  index.html
  tailwind.config.ts
  src/
    main.tsx
    App.tsx
    routes/__root.tsx
    routes/login.tsx
    routes/_auth.tsx
    routes/_auth/dashboard.tsx
    routes/_auth/users.tsx
    routes/_auth/permissions.tsx
    routes/_auth/audit-logs.tsx
    routes/_auth/buildings.tsx
    routes/_auth/rooms.tsx
    routes/_auth/tenants.tsx
    routes/_auth/fees.tsx
    stores/auth.ts
    api/request.ts
    api/auth.ts
    api/users.ts
    api/permissions.ts
    api/audit.ts
    components/sidebar.tsx
    components/permission-route.tsx
```

---

## Phase 1: 基础设施

### Task 1: packages/schema 初始化

**交付物：** 可被 apps/server 和 apps/admin 引用的共享 Zod schema 包
**验收标准：** `pnpm --filter @rent-app/schema build` 成功

**Files:**

- Create: `packages/schema/package.json`
- Create: `packages/schema/tsconfig.json`
- Create: `packages/schema/src/common.ts`
- Create: `packages/schema/src/auth.ts`
- Create: `packages/schema/src/user.ts`
- Create: `packages/schema/src/tenant.ts`
- Create: `packages/schema/src/permission.ts`
- Create: `packages/schema/src/index.ts`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "@rent-app/schema",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "~5.9.2"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 创建 common.ts**

```typescript
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string(),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;
```

- [ ] **Step 4: 创建 auth.ts**

```typescript
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
```

- [ ] **Step 5: 创建 user.ts**

```typescript
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
```

- [ ] **Step 6: 创建 tenant.ts**

```typescript
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
```

- [ ] **Step 7: 创建 permission.ts**

```typescript
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
```

- [ ] **Step 8: 创建 index.ts**

```typescript
export * from './auth';
export * from './user';
export * from './tenant';
export * from './permission';
export * from './common';
```

- [ ] **Step 9: 安装依赖并验证**

```bash
cd /Users/liuguoping/code/rent-app
pnpm install
pnpm --filter @rent-app/schema typecheck
```

Expected: 无错误

- [ ] **Step 10: Commit**

```bash
git add packages/schema
git commit -m "feat: init packages/schema with shared Zod schemas"
```

---

### Task 2: apps/server 项目初始化

**交付物：** 可启动的 NestJS 空项目，连接 PostgreSQL
**验收标准：** `pnpm --filter server dev` 启动后 `GET /` 返回 200

**Files:**

- Create: `apps/server/package.json`
- Create: `apps/server/tsconfig.json`
- Create: `apps/server/src/main.ts`
- Create: `apps/server/src/app.module.ts`
- Create: `apps/server/src/db/index.ts`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "server",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx src/db/seed.ts"
  },
  "dependencies": {
    "@fastify/cors": "^10.0.0",
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/platform-fastify": "^11.0.0",
    "@rent-app/schema": "workspace:*",
    "bcrypt": "^6.0.0",
    "drizzle-orm": "^0.44.0",
    "fastify": "^5.0.0",
    "nestjs-zod": "^4.0.0",
    "postgres": "^3.4.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@types/bcrypt": "^5.0.0",
    "drizzle-kit": "^0.31.0",
    "tsx": "^4.19.0",
    "typescript": "~5.9.2"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 创建 drizzle.config.ts**

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 4: 创建 .env**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rent_app
JWT_SECRET=your-jwt-secret-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
```

- [ ] **Step 5: 创建 src/db/index.ts**

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
export type Database = typeof db;
```

- [ ] **Step 6: 创建 src/app.module.ts**

```typescript
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

- [ ] **Step 7: 创建 src/main.ts**

```typescript
import 'reflect-metadata';
import cors from '@fastify/cors';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await app.register(cors, { origin: true });
  app.useGlobalPipes(new ZodValidationPipe());
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
```

- [ ] **Step 8: 安装依赖**

```bash
cd /Users/liuguoping/code/rent-app
pnpm install
```

- [ ] **Step 9: 验证启动**

```bash
pnpm --filter server dev
```

Expected: 应用在 3000 端口启动

- [ ] **Step 10: Commit**

```bash
git add apps/server
git commit -m "feat: init apps/server NestJS project"
```

---

### Task 3: Snowflake ID 工具

**交付物：** 可用的 Snowflake ID 生成工具
**验收标准：** 调用 `generateId()` 返回 bigint 类型 ID

**Files:**

- Create: `apps/server/src/common/utils/snowflake.ts`

- [ ] **Step 1: 创建 snowflake.ts**

```typescript
const EPOCH = 1704067200000n;
const WORKER_ID_BITS = 10n;
const SEQUENCE_BITS = 12n;
const MAX_SEQUENCE = (1n << SEQUENCE_BITS) - 1n;

const workerId = BigInt(process.env.WORKER_ID || '1') & ((1n << WORKER_ID_BITS) - 1n);

let sequence = 0n;
let lastTimestamp = -1n;

export function generateId(): bigint {
  let timestamp = BigInt(Date.now());

  if (timestamp === lastTimestamp) {
    sequence = (sequence + 1n) & MAX_SEQUENCE;
    if (sequence === 0n) {
      while (timestamp <= lastTimestamp) {
        timestamp = BigInt(Date.now());
      }
    }
  } else {
    sequence = 0n;
  }

  lastTimestamp = timestamp;

  return (
    ((timestamp - EPOCH) << (WORKER_ID_BITS + SEQUENCE_BITS)) |
    (workerId << SEQUENCE_BITS) |
    sequence
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/server/src/common/utils/snowflake.ts
git commit -m "feat: add Snowflake ID generator"
```

---

### Task 4: Drizzle Schema 定义

**交付物：** 完整的数据库 Schema，可生成迁移文件
**验收标准：** `pnpm --filter server db:generate` 生成迁移文件，`pnpm --filter server db:migrate` 执行成功

**Files:**

- Create: `apps/server/src/db/schema.ts`

- [ ] **Step 1: 创建 schema.ts**

```typescript
import {
  pgTable,
  bigint,
  varchar,
  smallint,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  numeric,
  text,
} from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable(
  'users',
  {
    id: bigint('id', { mode: 'bigint' }).primaryKey(),
    tenantId: bigint('tenant_id', { mode: 'bigint' })
      .notNull()
      .references(() => tenants.id),
    name: varchar('name', { length: 50 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 20 }).notNull(),
    status: smallint('status').notNull().default(1),
    loginAttempts: integer('login_attempts').notNull().default(0),
    lockedAt: timestamp('locked_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('users_tenant_name_idx').on(table.tenantId, table.name),
    uniqueIndex('users_tenant_phone_idx').on(table.tenantId, table.phone),
  ],
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: bigint('id', { mode: 'bigint' }).primaryKey(),
    userId: bigint('user_id', { mode: 'bigint' })
      .notNull()
      .references(() => users.id),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('refresh_tokens_user_id_idx').on(table.userId)],
);

export const permissions = pgTable('permissions', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: bigint('id', { mode: 'bigint' }).primaryKey(),
    role: varchar('role', { length: 20 }).notNull(),
    permissionId: bigint('permission_id', { mode: 'bigint' })
      .notNull()
      .references(() => permissions.id),
    tenantId: bigint('tenant_id', { mode: 'bigint' })
      .notNull()
      .references(() => tenants.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('role_permissions_unique_idx').on(table.role, table.permissionId, table.tenantId),
  ],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigint('id', { mode: 'bigint' }).primaryKey(),
    tenantId: bigint('tenant_id', { mode: 'bigint' }),
    userId: bigint('user_id', { mode: 'bigint' }),
    action: varchar('action', { length: 50 }).notNull(),
    targetType: varchar('target_type', { length: 50 }).notNull(),
    targetId: bigint('target_id', { mode: 'bigint' }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('audit_logs_tenant_id_idx').on(table.tenantId),
    index('audit_logs_created_at_idx').on(table.createdAt),
  ],
);

export const buildings = pgTable('buildings', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  tenantId: bigint('tenant_id', { mode: 'bigint' })
    .notNull()
    .references(() => tenants.id),
  name: varchar('name', { length: 100 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const floors = pgTable('floors', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  buildingId: bigint('building_id', { mode: 'bigint' })
    .notNull()
    .references(() => buildings.id),
  name: varchar('name', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rooms = pgTable('rooms', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  floorId: bigint('floor_id', { mode: 'bigint' })
    .notNull()
    .references(() => floors.id),
  name: varchar('name', { length: 50 }).notNull(),
  rent: numeric('rent', { precision: 10, scale: 2 }),
  waterPricePerTon: numeric('water_price_per_ton', { precision: 10, scale: 2 }),
  electricityPricePerKwh: numeric('electricity_price_per_kwh', {
    precision: 10,
    scale: 2,
  }),
  internetFee: numeric('internet_fee', { precision: 10, scale: 2 }),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const roomTenants = pgTable('room_tenants', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  roomId: bigint('room_id', { mode: 'bigint' })
    .notNull()
    .references(() => rooms.id),
  name: varchar('name', { length: 50 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  idCard: varchar('id_card', { length: 30 }),
  leaseStart: timestamp('lease_start'),
  leaseEnd: timestamp('lease_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const monthlyFees = pgTable('monthly_fees', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  roomId: bigint('room_id', { mode: 'bigint' })
    .notNull()
    .references(() => rooms.id),
  month: varchar('month', { length: 7 }).notNull(),
  rent: numeric('rent', { precision: 10, scale: 2 }).notNull(),
  water: numeric('water', { precision: 10, scale: 2 }).notNull(),
  waterUsage: numeric('water_usage', { precision: 10, scale: 2 }),
  electricity: numeric('electricity', { precision: 10, scale: 2 }).notNull(),
  electricityUsage: numeric('electricity_usage', { precision: 10, scale: 2 }),
  internet: numeric('internet', { precision: 10, scale: 2 }).notNull(),
  other: numeric('other', { precision: 10, scale: 2 }).notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

- [ ] **Step 2: 生成迁移并执行**

```bash
cd apps/server
pnpm db:generate
pnpm db:migrate
```

Expected: 迁移成功，数据库中创建所有表

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/db/schema.ts apps/server/drizzle
git commit -m "feat: add Drizzle schema for all tables"
```

---

### Task 5: 种子数据

**交付物：** 可执行的种子脚本，初始化默认租户和 super_admin
**验收标准：** `pnpm --filter server db:seed` 执行后数据库有默认数据

**Files:**

- Create: `apps/server/src/db/seed.ts`

- [ ] **Step 1: 创建 seed.ts**

```typescript
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcrypt';
import * as schema from './schema';
import { generateId } from '../common/utils/snowflake';
import { PERMISSIONS } from '@rent-app/schema';

async function seed() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });

  const tenantId = generateId();
  await db.insert(schema.tenants).values({
    id: tenantId,
    code: 'default',
    name: '默认租户',
  });

  const passwordHash = await bcrypt.hash('admin123', 10);
  const userId = generateId();
  await db.insert(schema.users).values({
    id: userId,
    tenantId,
    name: 'admin',
    phone: '13800000000',
    passwordHash,
    role: 'super_admin',
    status: 1,
  });

  const permissionIds: bigint[] = [];
  for (const name of PERMISSIONS) {
    const id = generateId();
    permissionIds.push(id);
    await db.insert(schema.permissions).values({ id, name });
  }

  for (const permissionId of permissionIds) {
    await db.insert(schema.rolePermissions).values({
      id: generateId(),
      role: 'super_admin',
      permissionId,
      tenantId,
    });
  }

  console.log('Seed completed');
  console.log('Login: code=default, account=admin, password=admin123');
  await client.end();
}

seed().catch(console.error);
```

- [ ] **Step 2: 添加 dotenv 依赖**

```bash
cd /Users/liuguoping/code/rent-app
pnpm --filter server add dotenv
```

- [ ] **Step 3: 执行种子脚本**

```bash
pnpm --filter server db:seed
```

Expected: 输出 "Seed completed" 和登录信息

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/db/seed.ts apps/server/package.json
git commit -m "feat: add database seed script"
```

---

## Phase 2: 后端鉴权模块

### Task 6: Auth 模块

**交付物：** 登录/刷新/登出 API
**验收标准：** `POST /auth/login` 正确返回 token 和权限列表，`POST /auth/refresh` 轮换 token，`POST /auth/logout` 吊销 token

**Files:**

- Create: `apps/server/src/modules/auth/auth.dto.ts`
- Create: `apps/server/src/modules/auth/auth.module.ts`
- Create: `apps/server/src/modules/auth/auth.controller.ts`
- Create: `apps/server/src/modules/auth/auth.service.ts`
- Modify: `apps/server/src/app.module.ts`

- [ ] **Step 1: 创建 auth.service.ts**

```typescript
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq, and, or, isNull } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { generateId } from '../../common/utils/snowflake';
import { LoginInput, RefreshInput } from '@rent-app/schema';

const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(input: LoginInput) {
    const [tenant] = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.code, input.code));
    if (!tenant) throw new UnauthorizedException('租户编码不存在');

    const [user] = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.tenantId, tenant.id),
          or(eq(schema.users.name, input.account), eq(schema.users.phone, input.account)),
        ),
      );
    if (!user) throw new UnauthorizedException('用户不存在');

    if (user.status === 0) throw new ForbiddenException('账号已禁用');

    if (user.status === 2) {
      if (user.lockedAt && Date.now() - user.lockedAt.getTime() > LOCK_DURATION_MS) {
        await db
          .update(schema.users)
          .set({ status: 1, loginAttempts: 0, lockedAt: null, updatedAt: new Date() })
          .where(eq(schema.users.id, user.id));
        user.status = 1;
        user.loginAttempts = 0;
      } else {
        const remainingMs = user.lockedAt
          ? LOCK_DURATION_MS - (Date.now() - user.lockedAt.getTime())
          : 0;
        const remainingMin = Math.ceil(remainingMs / 60000);
        throw new ForbiddenException(`账号已锁定，请${remainingMin}分钟后重试`);
      }
    }

    const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordValid) {
      const attempts = user.loginAttempts + 1;
      const remaining = LOCK_THRESHOLD - attempts;

      if (attempts >= LOCK_THRESHOLD) {
        await db
          .update(schema.users)
          .set({
            loginAttempts: attempts,
            status: 2,
            lockedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, user.id));

        await this.logAudit(tenant.id, user.id, 'login_failed', 'user', user.id, {
          reason: 'locked',
        });

        throw new ForbiddenException('密码错误次数过多，账号已锁定15分钟');
      }

      await db
        .update(schema.users)
        .set({ loginAttempts: attempts, updatedAt: new Date() })
        .where(eq(schema.users.id, user.id));

      await this.logAudit(tenant.id, user.id, 'login_failed', 'user', user.id, {
        remaining,
      });

      throw new UnauthorizedException(`密码错误，还剩${remaining}次机会`);
    }

    await db
      .update(schema.users)
      .set({ loginAttempts: 0, updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));

    const payload = {
      sub: user.id.toString(),
      tenantId: tenant.id.toString(),
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await db.insert(schema.refreshTokens).values({
      id: generateId(),
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const userPermissions = await db
      .select({ name: schema.permissions.name })
      .from(schema.rolePermissions)
      .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
      .where(
        and(
          eq(schema.rolePermissions.role, user.role),
          eq(schema.rolePermissions.tenantId, tenant.id),
        ),
      );

    await this.logAudit(tenant.id, user.id, 'login', 'user', user.id, null);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id.toString(),
        name: user.name,
        phone: user.phone,
        role: user.role,
        tenantId: tenant.id.toString(),
        tenantName: tenant.name,
      },
      permissions: userPermissions.map((p) => p.name),
    };
  }

  async refresh(input: RefreshInput) {
    const tokenHash = crypto.createHash('sha256').update(input.refreshToken).digest('hex');

    const [token] = await db
      .select()
      .from(schema.refreshTokens)
      .where(
        and(eq(schema.refreshTokens.tokenHash, tokenHash), isNull(schema.refreshTokens.revokedAt)),
      );

    if (!token || token.expiresAt < new Date()) {
      throw new UnauthorizedException('refreshToken 无效或已过期');
    }

    await db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.refreshTokens.id, token.id));

    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, token.userId));
    if (!user) throw new UnauthorizedException('用户不存在');

    const payload = {
      sub: user.id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await db.insert(schema.refreshTokens).values({
      id: generateId(),
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: bigint, refreshToken: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await db
      .update(schema.refreshTokens)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(
        and(eq(schema.refreshTokens.tokenHash, tokenHash), eq(schema.refreshTokens.userId, userId)),
      );

    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));

    if (user) {
      await this.logAudit(user.tenantId, userId, 'logout', 'user', userId, null);
    }
  }

  private async logAudit(
    tenantId: bigint,
    userId: bigint | null,
    action: string,
    targetType: string,
    targetId: bigint | null,
    metadata: unknown,
  ) {
    await db.insert(schema.auditLogs).values({
      id: generateId(),
      tenantId,
      userId,
      action,
      targetType,
      targetId,
      metadata,
    });
  }
}
```

- [ ] **Step 2: 创建 auth.dto.ts**

```typescript
import { createZodDto } from 'nestjs-zod';
import { loginSchema, refreshSchema } from '@rent-app/schema';

export class LoginDto extends createZodDto(loginSchema) {}
export class RefreshDto extends createZodDto(refreshSchema) {}
```

- [ ] **Step 3: 创建 auth.controller.ts**

```typescript
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginDto, RefreshDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any, @Body() body: { refreshToken: string }) {
    await this.authService.logout(BigInt(req.user.sub), body.refreshToken);
    return { success: true };
  }
}
```

- [ ] **Step 4: 创建 auth.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule],
})
export class AuthModule {}
```

- [ ] **Step 5: 更新 app.module.ts 注册 AuthModule**

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [AuthModule],
})
export class AppModule {}
```

- [ ] **Step 6: 启动并用 curl 验证登录**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"default","account":"admin","password":"admin123"}'
```

Expected: 返回 `{ accessToken, refreshToken, user, permissions }`

- [ ] **Step 7: Commit**

```bash
git add apps/server/src/modules/auth apps/server/src/app.module.ts
git commit -m "feat: add auth module with login/refresh/logout"
```

---

### Task 7: JWT Guard + Public 装饰器

**交付物：** 全局 JWT 鉴权 Guard，支持 @Public() 跳过
**验收标准：** 未登录访问非 Public 接口返回 401，Public 接口正常访问

**Files:**

- Create: `apps/server/src/common/guards/jwt-auth.guard.ts`
- Create: `apps/server/src/common/decorators/public.decorator.ts`
- Modify: `apps/server/src/app.module.ts`

- [ ] **Step 1: 创建 public.decorator.ts**

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

- [ ] **Step 2: 创建 jwt-auth.guard.ts**

```typescript
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('缺少 Authorization header');
    }

    const token = authHeader.slice(7);
    try {
      request.user = this.jwtService.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('token 无效或已过期');
    }
  }
}
```

- [ ] **Step 3: 在 app.module.ts 注册全局 Guard**

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [AuthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/common/guards apps/server/src/common/decorators apps/server/src/app.module.ts
git commit -m "feat: add JWT auth guard with @Public decorator"
```

---

### Task 8: Permission Guard + 装饰器

**交付物：** 页面级权限 Guard，通过 @RequirePermission() 装饰器使用
**验收标准：** 无权限用户访问受保护接口返回 403

**Files:**

- Create: `apps/server/src/common/guards/permission.guard.ts`
- Create: `apps/server/src/common/decorators/require-permission.decorator.ts`
- Modify: `apps/server/src/app.module.ts`

- [ ] **Step 1: 创建 require-permission.decorator.ts**

```typescript
import { SetMetadata } from '@nestjs/common';
import { PermissionName } from '@rent-app/schema';

export const PERMISSION_KEY = 'requiredPermission';
export const RequirePermission = (permission: PermissionName) =>
  SetMetadata(PERMISSION_KEY, permission);
```

- [ ] **Step 2: 创建 permission.guard.ts**

```typescript
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq, and } from 'drizzle-orm';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { db } from '../../db';
import * as schema from '../../db/schema';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('未认证');

    const tenantId = BigInt(user.tenantId);
    const role = user.role;

    const [permission] = await db
      .select()
      .from(schema.permissions)
      .where(eq(schema.permissions.name, requiredPermission));
    if (!permission) throw new ForbiddenException('权限不存在');

    const [rolePermission] = await db
      .select()
      .from(schema.rolePermissions)
      .where(
        and(
          eq(schema.rolePermissions.role, role),
          eq(schema.rolePermissions.permissionId, permission.id),
          eq(schema.rolePermissions.tenantId, tenantId),
        ),
      );

    if (!rolePermission) throw new ForbiddenException('无权访问');
    return true;
  }
}
```

- [ ] **Step 3: 注册全局 PermissionGuard**

在 `apps/server/src/app.module.ts` 的 providers 中添加：

```typescript
import { PermissionGuard } from './common/guards/permission.guard';

// providers 数组中添加：
{
  provide: APP_GUARD,
  useClass: PermissionGuard,
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/common
git commit -m "feat: add permission guard with @RequirePermission decorator"
```

---

### Task 9: Tenant Context 中间件

**交付物：** 自动从 JWT 提取 tenantId 挂到 request 的中间件
**验收标准：** 登录后的请求 `req.tenantId` 可用

**Files:**

- Create: `apps/server/src/common/middleware/tenant-context.middleware.ts`
- Modify: `apps/server/src/app.module.ts`

- [ ] **Step 1: 创建 tenant-context.middleware.ts**

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request & { user?: any; tenantId?: bigint }, _res: Response, next: NextFunction) {
    if (req.user?.tenantId) {
      req.tenantId = BigInt(req.user.tenantId);
    }
    next();
  }
}
```

- [ ] **Step 2: 在 AppModule 注册中间件**

在 `AppModule` 中实现 `NestModule`：

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/common/middleware apps/server/src/app.module.ts
git commit -m "feat: add tenant context middleware"
```

---

## Phase 3: 后端业务模块

### Task 10: Audit 模块

**交付物：** AuditService.log() + 审计日志只读查询接口
**验收标准：** `GET /audit?page=1&pageSize=20` 返回分页审计日志

**Files:**

- Create: `apps/server/src/modules/audit/audit.module.ts`
- Create: `apps/server/src/modules/audit/audit.service.ts`
- Create: `apps/server/src/modules/audit/audit.dto.ts`
- Create: `apps/server/src/modules/audit/audit.controller.ts`

- [ ] **Step 1: 创建 audit.service.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { generateId } from '../../common/utils/snowflake';

@Injectable()
export class AuditService {
  async log(params: {
    tenantId: bigint | null;
    userId: bigint | null;
    action: string;
    targetType: string;
    targetId: bigint | null;
    metadata?: unknown;
  }) {
    await db.insert(schema.auditLogs).values({
      id: generateId(),
      tenantId: params.tenantId,
      userId: params.userId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata ?? null,
    });
  }

  async findAll(tenantId: bigint, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    const [items, [{ count }]] = await Promise.all([
      db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.tenantId, tenantId))
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.tenantId, tenantId)),
    ]);

    return { items, total: count, page, pageSize };
  }
}
```

- [ ] **Step 2: 创建 audit.dto.ts**

```typescript
import { createZodDto } from 'nestjs-zod';
import { paginationSchema } from '@rent-app/schema';

export class AuditListQueryDto extends createZodDto(paginationSchema) {}
```

- [ ] **Step 3: 创建 audit.controller.ts**

```typescript
import { Controller, Get, Query, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AuditListQueryDto } from './audit.dto';

@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @RequirePermission('roles')
  async findAll(@Req() req: any, @Query() query: AuditListQueryDto) {
    return this.auditService.findAll(BigInt(req.user.tenantId), query.page, query.pageSize);
  }
}
```

- [ ] **Step 4: 创建 audit.module.ts**

```typescript
import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Global()
@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
```

- [ ] **Step 5: 在 app.module.ts 注册 AuditModule**

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/modules/audit apps/server/src/app.module.ts
git commit -m "feat: add audit module"
```

---

### Task 11: Users 模块

**交付物：** 用户 CRUD 接口（创建/列表/更新状态/解锁/删除）
**验收标准：** super_admin 可创建用户、修改状态、解锁、删除

**Files:**

- Create: `apps/server/src/modules/users/users.module.ts`
- Create: `apps/server/src/modules/users/users.service.ts`
- Create: `apps/server/src/modules/users/users.dto.ts`
- Create: `apps/server/src/modules/users/users.controller.ts`

- [ ] **Step 1: 创建 users.service.ts**

```typescript
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { eq, and, sql, desc } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { generateId } from '../../common/utils/snowflake';
import { AuditService } from '../audit/audit.service';
import { CreateUserInput, UpdateUserInput } from '@rent-app/schema';

@Injectable()
export class UsersService {
  constructor(private auditService: AuditService) {}

  async create(tenantId: bigint, input: CreateUserInput, operatorId: bigint) {
    const existing = await db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.tenantId, tenantId), eq(schema.users.name, input.name)));
    if (existing.length > 0) throw new ConflictException('用户名已存在');

    const existingPhone = await db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.tenantId, tenantId), eq(schema.users.phone, input.phone)));
    if (existingPhone.length > 0) throw new ConflictException('手机号已存在');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const id = generateId();

    await db.insert(schema.users).values({
      id,
      tenantId,
      name: input.name,
      phone: input.phone,
      passwordHash,
      role: input.role,
      status: 1,
    });

    await this.auditService.log({
      tenantId,
      userId: operatorId,
      action: 'user_created',
      targetType: 'user',
      targetId: id,
      metadata: { name: input.name, role: input.role },
    });

    return { id: id.toString() };
  }

  async findAll(tenantId: bigint, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    const [items, [{ count }]] = await Promise.all([
      db
        .select({
          id: schema.users.id,
          name: schema.users.name,
          phone: schema.users.phone,
          role: schema.users.role,
          status: schema.users.status,
          createdAt: schema.users.createdAt,
        })
        .from(schema.users)
        .where(eq(schema.users.tenantId, tenantId))
        .orderBy(desc(schema.users.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.users)
        .where(eq(schema.users.tenantId, tenantId)),
    ]);

    return {
      items: items.map((u) => ({ ...u, id: u.id.toString() })),
      total: count,
      page,
      pageSize,
    };
  }

  async update(tenantId: bigint, userId: bigint, input: UpdateUserInput, operatorId: bigint) {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, userId), eq(schema.users.tenantId, tenantId)));
    if (!user) throw new NotFoundException('用户不存在');

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === 1) {
        updateData.loginAttempts = 0;
        updateData.lockedAt = null;
      }
    }

    await db.update(schema.users).set(updateData).where(eq(schema.users.id, userId));

    await this.auditService.log({
      tenantId,
      userId: operatorId,
      action: 'user_updated',
      targetType: 'user',
      targetId: userId,
      metadata: input,
    });

    return { success: true };
  }

  async remove(tenantId: bigint, userId: bigint, operatorId: bigint) {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.id, userId), eq(schema.users.tenantId, tenantId)));
    if (!user) throw new NotFoundException('用户不存在');

    await db.delete(schema.users).where(eq(schema.users.id, userId));

    await this.auditService.log({
      tenantId,
      userId: operatorId,
      action: 'user_deleted',
      targetType: 'user',
      targetId: userId,
      metadata: { name: user.name },
    });

    return { success: true };
  }
}
```

- [ ] **Step 2: 创建 users.dto.ts**

```typescript
import { createZodDto } from 'nestjs-zod';
import { createUserSchema, updateUserSchema, paginationSchema } from '@rent-app/schema';

export class CreateUserDto extends createZodDto(createUserSchema) {}
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
export class UserListQueryDto extends createZodDto(paginationSchema) {}
```

- [ ] **Step 3: 创建 users.controller.ts**

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CreateUserDto, UpdateUserDto, UserListQueryDto } from './users.dto';

@Controller('users')
@RequirePermission('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  async create(@Req() req: any, @Body() body: CreateUserDto) {
    return this.usersService.create(BigInt(req.user.tenantId), body, BigInt(req.user.sub));
  }

  @Get()
  async findAll(@Req() req: any, @Query() query: UserListQueryDto) {
    return this.usersService.findAll(BigInt(req.user.tenantId), query.page, query.pageSize);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(
      BigInt(req.user.tenantId),
      BigInt(id),
      body,
      BigInt(req.user.sub),
    );
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.usersService.remove(BigInt(req.user.tenantId), BigInt(id), BigInt(req.user.sub));
  }
}
```

- [ ] **Step 4: 创建 users.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 5: 在 app.module.ts 注册 UsersModule**

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/modules/users apps/server/src/app.module.ts
git commit -m "feat: add users module with CRUD"
```

---

### Task 12: Permissions 模块

**交付物：** 查询/更新角色权限的接口
**验收标准：** super_admin 可查看和修改 admin 角色的页面权限列表

**Files:**

- Create: `apps/server/src/modules/permissions/permissions.module.ts`
- Create: `apps/server/src/modules/permissions/permissions.service.ts`
- Create: `apps/server/src/modules/permissions/permissions.dto.ts`
- Create: `apps/server/src/modules/permissions/permissions.controller.ts`

- [ ] **Step 1: 创建 permissions.service.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { generateId } from '../../common/utils/snowflake';
import { AuditService } from '../audit/audit.service';
import { UpdateRolePermissionsInput, PERMISSIONS } from '@rent-app/schema';

@Injectable()
export class PermissionsService {
  constructor(private auditService: AuditService) {}

  async getAllPermissions() {
    return db.select().from(schema.permissions);
  }

  async getRolePermissions(tenantId: bigint, role: string) {
    const result = await db
      .select({ name: schema.permissions.name })
      .from(schema.rolePermissions)
      .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
      .where(
        and(eq(schema.rolePermissions.role, role), eq(schema.rolePermissions.tenantId, tenantId)),
      );
    return result.map((r) => r.name);
  }

  async updateRolePermissions(
    tenantId: bigint,
    input: UpdateRolePermissionsInput,
    operatorId: bigint,
  ) {
    await db
      .delete(schema.rolePermissions)
      .where(
        and(
          eq(schema.rolePermissions.role, input.role),
          eq(schema.rolePermissions.tenantId, tenantId),
        ),
      );

    const allPermissions = await db.select().from(schema.permissions);
    const permissionMap = new Map(allPermissions.map((p) => [p.name, p.id]));

    for (const name of input.permissions) {
      const permissionId = permissionMap.get(name);
      if (!permissionId) continue;
      await db.insert(schema.rolePermissions).values({
        id: generateId(),
        role: input.role,
        permissionId,
        tenantId,
      });
    }

    await this.auditService.log({
      tenantId,
      userId: operatorId,
      action: 'permission_changed',
      targetType: 'role_permission',
      targetId: null,
      metadata: { role: input.role, permissions: input.permissions },
    });

    return { success: true };
  }
}
```

- [ ] **Step 2: 创建 permissions.dto.ts**

```typescript
import { createZodDto } from 'nestjs-zod';
import { updateRolePermissionsSchema } from '@rent-app/schema';

export class UpdateRolePermissionsDto extends createZodDto(updateRolePermissionsSchema) {}
```

- [ ] **Step 3: 创建 permissions.controller.ts**

```typescript
import { Controller, Get, Put, Body, Param, Req } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { UpdateRolePermissionsDto } from './permissions.dto';

@Controller('permissions')
@RequirePermission('roles')
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get()
  async getAll() {
    return this.permissionsService.getAllPermissions();
  }

  @Get('role/:role')
  async getRolePermissions(@Req() req: any, @Param('role') role: string) {
    return this.permissionsService.getRolePermissions(BigInt(req.user.tenantId), role);
  }

  @Put('role')
  async updateRolePermissions(@Req() req: any, @Body() body: UpdateRolePermissionsDto) {
    return this.permissionsService.updateRolePermissions(
      BigInt(req.user.tenantId),
      body,
      BigInt(req.user.sub),
    );
  }
}
```

- [ ] **Step 4: 创建 permissions.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService],
})
export class PermissionsModule {}
```

- [ ] **Step 5: 在 app.module.ts 注册 PermissionsModule**

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/modules/permissions apps/server/src/app.module.ts
git commit -m "feat: add permissions module"
```

---

### Task 13: Tenants-mgmt 模块

**交付物：** 租户管理接口（创建租户时同时创建 super_admin 用户和全量权限）
**验收标准：** super_admin 可创建新租户，新租户自带管理员账号

**Files:**

- Create: `apps/server/src/modules/tenants-mgmt/tenants-mgmt.module.ts`
- Create: `apps/server/src/modules/tenants-mgmt/tenants-mgmt.service.ts`
- Create: `apps/server/src/modules/tenants-mgmt/tenants-mgmt.dto.ts`
- Create: `apps/server/src/modules/tenants-mgmt/tenants-mgmt.controller.ts`

- [ ] **Step 1: 创建 tenants-mgmt.service.ts**

```typescript
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { eq, sql, desc } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { generateId } from '../../common/utils/snowflake';
import { AuditService } from '../audit/audit.service';
import { CreateTenantInput, UpdateTenantInput } from '@rent-app/schema';

@Injectable()
export class TenantsMgmtService {
  constructor(private auditService: AuditService) {}

  async create(input: CreateTenantInput, operatorId: bigint) {
    const existing = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.code, input.code));
    if (existing.length > 0) throw new ConflictException('租户编码已存在');

    const tenantId = generateId();
    await db.insert(schema.tenants).values({
      id: tenantId,
      code: input.code,
      name: input.name,
    });

    const passwordHash = await bcrypt.hash(input.adminPassword, 10);
    const adminId = generateId();
    await db.insert(schema.users).values({
      id: adminId,
      tenantId,
      name: input.adminName,
      phone: input.adminPhone,
      passwordHash,
      role: 'super_admin',
      status: 1,
    });

    const allPermissions = await db.select().from(schema.permissions);
    for (const permission of allPermissions) {
      await db.insert(schema.rolePermissions).values({
        id: generateId(),
        role: 'super_admin',
        permissionId: permission.id,
        tenantId,
      });
    }

    await this.auditService.log({
      tenantId,
      userId: operatorId,
      action: 'tenant_created',
      targetType: 'tenant',
      targetId: tenantId,
      metadata: { code: input.code, name: input.name },
    });

    return { id: tenantId.toString() };
  }

  async findAll(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    const [items, [{ count }]] = await Promise.all([
      db
        .select()
        .from(schema.tenants)
        .orderBy(desc(schema.tenants.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.tenants),
    ]);

    return {
      items: items.map((t) => ({ ...t, id: t.id.toString() })),
      total: count,
      page,
      pageSize,
    };
  }

  async update(tenantId: bigint, input: UpdateTenantInput) {
    const [tenant] = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId));
    if (!tenant) throw new NotFoundException('租户不存在');

    await db
      .update(schema.tenants)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(schema.tenants.id, tenantId));

    return { success: true };
  }
}
```

- [ ] **Step 2: 创建 tenants-mgmt.dto.ts**

```typescript
import { createZodDto } from 'nestjs-zod';
import { createTenantSchema, updateTenantSchema, paginationSchema } from '@rent-app/schema';

export class CreateTenantDto extends createZodDto(createTenantSchema) {}
export class UpdateTenantDto extends createZodDto(updateTenantSchema) {}
export class TenantListQueryDto extends createZodDto(paginationSchema) {}
```

- [ ] **Step 3: 创建 tenants-mgmt.controller.ts**

```typescript
import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { TenantsMgmtService } from './tenants-mgmt.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CreateTenantDto, UpdateTenantDto, TenantListQueryDto } from './tenants-mgmt.dto';

@Controller('tenants')
@RequirePermission('tenants_mgmt')
export class TenantsMgmtController {
  constructor(private tenantsMgmtService: TenantsMgmtService) {}

  @Post()
  async create(@Req() req: any, @Body() body: CreateTenantDto) {
    return this.tenantsMgmtService.create(body, BigInt(req.user.sub));
  }

  @Get()
  async findAll(@Query() query: TenantListQueryDto) {
    return this.tenantsMgmtService.findAll(query.page, query.pageSize);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateTenantDto) {
    return this.tenantsMgmtService.update(BigInt(id), body);
  }
}
```

- [ ] **Step 4: 创建 tenants-mgmt.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { TenantsMgmtController } from './tenants-mgmt.controller';
import { TenantsMgmtService } from './tenants-mgmt.service';

@Module({
  controllers: [TenantsMgmtController],
  providers: [TenantsMgmtService],
})
export class TenantsMgmtModule {}
```

- [ ] **Step 5: 在 app.module.ts 注册 TenantsMgmtModule**

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/modules/tenants-mgmt apps/server/src/app.module.ts
git commit -m "feat: add tenants-mgmt module"
```

---

### Task 14: 业务骨架模块（buildings/rooms/fees）

**交付物：** 三个空壳模块，只注册路由占位
**验收标准：** 请求各业务接口返回空数组或占位响应

**Files:**

- Create: `apps/server/src/modules/buildings/{buildings.module.ts,buildings.controller.ts,buildings.service.ts}`
- Create: `apps/server/src/modules/rooms/{rooms.module.ts,rooms.controller.ts,rooms.service.ts}`
- Create: `apps/server/src/modules/fees/{fees.module.ts,fees.controller.ts,fees.service.ts}`

- [ ] **Step 1: 创建 buildings 模块骨架**

`buildings.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('buildings')
@RequirePermission('buildings')
export class BuildingsController {
  @Get()
  findAll() {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
}
```

`buildings.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { BuildingsController } from './buildings.controller';

@Module({
  controllers: [BuildingsController],
})
export class BuildingsModule {}
```

- [ ] **Step 2: 同样模式创建 rooms 和 fees 模块骨架**

rooms → `@RequirePermission('rooms')`，路由 `/rooms`
fees → `@RequirePermission('fees')`，路由 `/fees`

- [ ] **Step 3: 在 app.module.ts 注册三个模块**

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/modules/buildings apps/server/src/modules/rooms apps/server/src/modules/fees apps/server/src/app.module.ts
git commit -m "feat: add skeleton modules for buildings/rooms/fees"
```

---

## Phase 4: 前端基础

### Task 15: apps/admin 项目初始化

**交付物：** 可启动的 React + Vite 项目，集成 TanStack Router + HeroUI + Tailwind
**验收标准：** `pnpm --filter admin dev` 启动后浏览器打开显示页面

**Files:**

- Create: `apps/admin/package.json`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/vite.config.ts`
- Create: `apps/admin/index.html`
- Create: `apps/admin/tailwind.config.ts`
- Create: `apps/admin/src/main.tsx`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "admin",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@heroui/react": "^2.7.0",
    "@rent-app/schema": "workspace:*",
    "@tanstack/react-router": "^1.120.0",
    "axios": "^1.9.0",
    "framer-motion": "^12.0.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "zod": "^3.24.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@tanstack/router-plugin": "^1.120.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.5.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.5.0",
    "tailwindcss": "^3.4.0",
    "typescript": "~5.9.2",
    "vite": "^6.3.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

- [ ] **Step 3: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>租赁管理后台</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: 创建 tailwind.config.ts 和 postcss.config.js**

`tailwind.config.ts`:

```typescript
import { heroui } from '@heroui/react';

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: { extend: {} },
  darkMode: 'class',
  plugins: [heroui()],
};
```

`postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: 创建 src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HeroUIProvider } from '@heroui/react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import './index.css';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HeroUIProvider>
      <RouterProvider router={router} />
    </HeroUIProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 6: 创建 src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 8: 安装依赖并验证启动**

```bash
cd /Users/liuguoping/code/rent-app
pnpm install
pnpm --filter admin dev
```

Expected: 浏览器打开 http://localhost:5173 显示页面

- [ ] **Step 9: Commit**

```bash
git add apps/admin
git commit -m "feat: init apps/admin with React + Vite + TanStack Router + HeroUI"
```

---

### Task 16: Axios 封装（request.ts）

**交付物：** 带 token 注入和 401 自动刷新的 axios 实例
**验收标准：** 请求自动带 Authorization header，401 时自动刷新并重试

**Files:**

- Create: `apps/admin/src/api/request.ts`

- [ ] **Step 1: 创建 request.ts**

```typescript
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

request.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

request.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingRequests.push((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(request(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) throw new Error('no refresh token');

      const { data } = await axios.post('/api/auth/refresh', { refreshToken });
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);

      pendingRequests.forEach((cb) => cb(data.accessToken));
      pendingRequests = [];

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return request(originalRequest);
    } catch {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default request;
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/api/request.ts
git commit -m "feat: add axios request wrapper with token refresh"
```

---

### Task 17: Auth Store + Auth API

**交付物：** Zustand auth store（token + 用户信息 + 权限）+ auth API 封装
**验收标准：** 登录后数据持久化到 localStorage，刷新页面恢复状态

**Files:**

- Create: `apps/admin/src/stores/auth.ts`
- Create: `apps/admin/src/api/auth.ts`

- [ ] **Step 1: 创建 stores/auth.ts**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: string;
  tenantId: string;
  tenantName: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  permissions: string[];
  setAuth: (data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    permissions: string[];
  }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      permissions: [],
      setAuth: (data) =>
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          permissions: data.permissions,
        }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          permissions: [],
        }),
      hasPermission: (permission) => get().permissions.includes(permission),
    }),
    { name: 'rent-admin-auth' },
  ),
);
```

- [ ] **Step 2: 创建 api/auth.ts**

```typescript
import request from './request';
import type { LoginInput } from '@rent-app/schema';

export const authApi = {
  login: (data: LoginInput) => request.post('/auth/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    request.post('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    request.post('/auth/logout', { refreshToken }).then((r) => r.data),
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/stores apps/admin/src/api/auth.ts
git commit -m "feat: add auth store and auth API"
```

---

## Phase 5: 前端页面

### Task 18: 登录页

**交付物：** 登录页面（租户编码 + 用户名/手机号 + 密码），登录成功跳转 dashboard
**验收标准：** 输入正确凭据登录成功，错误密码显示剩余次数，锁定显示剩余时间

**Files:**

- Create: `apps/admin/src/routes/login.tsx`

- [ ] **Step 1: 创建 login.tsx**

```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Input, Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useState } from 'react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/auth';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ code: '', account: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(form);
      setAuth(data);
      navigate({ to: '/dashboard' });
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex justify-center pb-0 pt-6">
          <h1 className="text-2xl font-bold">租赁管理后台</h1>
        </CardHeader>
        <CardBody className="gap-4 px-8 pb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="租户编码"
              value={form.code}
              onValueChange={(v) => setForm({ ...form, code: v })}
              isRequired
            />
            <Input
              label="用户名/手机号"
              value={form.account}
              onValueChange={(v) => setForm({ ...form, account: v })}
              isRequired
            />
            <Input
              label="密码"
              type="password"
              value={form.password}
              onValueChange={(v) => setForm({ ...form, password: v })}
              isRequired
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" color="primary" isLoading={loading} className="mt-2">
              登录
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/routes/login.tsx
git commit -m "feat: add login page"
```

---

### Task 19: 布局（侧边栏 + 顶栏 + 权限路由守卫）

**交付物：** \_auth 布局（需登录才能访问），侧边栏根据权限动态渲染菜单
**验收标准：** 未登录自动跳转 login，侧边栏只显示有权限的菜单项

**Files:**

- Create: `apps/admin/src/routes/__root.tsx`
- Create: `apps/admin/src/routes/_auth.tsx`
- Create: `apps/admin/src/components/sidebar.tsx`

- [ ] **Step 1: 创建 \_\_root.tsx**

```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: () => <Outlet />,
});
```

- [ ] **Step 2: 创建 sidebar.tsx**

```tsx
import { Link, useLocation } from '@tanstack/react-router';
import { useAuthStore } from '../stores/auth';

const menuItems = [
  { path: '/dashboard', label: '仪表盘', permission: 'dashboard' },
  { path: '/buildings', label: '楼栋管理', permission: 'buildings' },
  { path: '/rooms', label: '房间管理', permission: 'rooms' },
  { path: '/tenants', label: '租客管理', permission: 'tenants_mgmt' },
  { path: '/fees', label: '费用管理', permission: 'fees' },
  { path: '/users', label: '用户管理', permission: 'users' },
  { path: '/permissions', label: '权限管理', permission: 'roles' },
  { path: '/audit-logs', label: '审计日志', permission: 'roles' },
] as const;

export function Sidebar() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const visibleItems = menuItems.filter((item) => hasPermission(item.permission));

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-white">
      <div className="border-b px-4 py-4">
        <h2 className="text-lg font-bold">租赁管理</h2>
        <p className="text-sm text-gray-500">{user?.tenantName}</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {visibleItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-2.5 text-sm transition-colors hover:bg-gray-100 ${
              location.pathname === item.path
                ? 'bg-primary-50 font-medium text-primary'
                : 'text-gray-700'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t px-4 py-3 text-sm text-gray-500">
        {user?.name} ({user?.role})
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: 创建 \_auth.tsx**

```tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../stores/auth';
import { Sidebar } from '../components/sidebar';
import { Button } from '@heroui/react';
import { authApi } from '../api/auth';

export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) {
      throw redirect({ to: '/login' });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { user, refreshToken, logout } = useAuthStore();

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {}
    }
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b bg-white px-6 py-3">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <Button size="sm" variant="light" onPress={handleLogout}>
              登出
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 创建 dashboard.tsx**

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/dashboard')({
  component: () => <div className="text-xl font-bold">仪表盘</div>,
});
```

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/routes apps/admin/src/components/sidebar.tsx
git commit -m "feat: add layout with sidebar and auth guard"
```

---

### Task 20: 用户管理页

**交付物：** 用户列表 + 创建用户 + 修改状态/解锁/删除
**验收标准：** 可创建用户、禁用/启用/解锁用户、删除用户

**Files:**

- Create: `apps/admin/src/routes/_auth/users.tsx`
- Create: `apps/admin/src/api/users.ts`

- [ ] **Step 1: 创建 api/users.ts**

```typescript
import request from './request';
import type { CreateUserInput, UpdateUserInput } from '@rent-app/schema';

export const usersApi = {
  list: (page = 1, pageSize = 20) =>
    request.get('/users', { params: { page, pageSize } }).then((r) => r.data),

  create: (data: CreateUserInput) => request.post('/users', data).then((r) => r.data),

  update: (id: string, data: UpdateUserInput) =>
    request.patch(`/users/${id}`, data).then((r) => r.data),

  remove: (id: string) => request.delete(`/users/${id}`).then((r) => r.data),
};
```

- [ ] **Step 2: 创建 users.tsx 页面**

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Chip,
  useDisclosure,
  Pagination,
} from '@heroui/react';
import { usersApi } from '../../api/users';

export const Route = createFileRoute('/_auth/users')({
  component: UsersPage,
});

function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'admin' as const,
  });

  const loadUsers = useCallback(async () => {
    const data = await usersApi.list(page);
    setUsers(data.items);
    setTotal(data.total);
  }, [page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreate = async () => {
    await usersApi.create(form);
    onClose();
    setForm({ name: '', phone: '', password: '', role: 'admin' });
    loadUsers();
  };

  const handleStatusChange = async (id: string, status: number) => {
    await usersApi.update(id, { status });
    loadUsers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该用户？')) return;
    await usersApi.remove(id);
    loadUsers();
  };

  const statusMap: Record<number, { label: string; color: 'success' | 'danger' | 'warning' }> = {
    0: { label: '禁用', color: 'danger' },
    1: { label: '正常', color: 'success' },
    2: { label: '锁定', color: 'warning' },
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">用户管理</h1>
        <Button color="primary" onPress={onOpen}>
          新建用户
        </Button>
      </div>

      <Table aria-label="用户列表">
        <TableHeader>
          <TableColumn>用户名</TableColumn>
          <TableColumn>手机号</TableColumn>
          <TableColumn>角色</TableColumn>
          <TableColumn>状态</TableColumn>
          <TableColumn>操作</TableColumn>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.phone}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Chip color={statusMap[user.status]?.color} size="sm">
                  {statusMap[user.status]?.label}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {user.status === 1 && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="warning"
                      onPress={() => handleStatusChange(user.id, 0)}
                    >
                      禁用
                    </Button>
                  )}
                  {user.status === 0 && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="success"
                      onPress={() => handleStatusChange(user.id, 1)}
                    >
                      启用
                    </Button>
                  )}
                  {user.status === 2 && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="success"
                      onPress={() => handleStatusChange(user.id, 1)}
                    >
                      解锁
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    onPress={() => handleDelete(user.id)}
                  >
                    删除
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 flex justify-center">
        <Pagination total={Math.ceil(total / 20)} page={page} onChange={setPage} />
      </div>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>新建用户</ModalHeader>
          <ModalBody className="gap-4">
            <Input
              label="用户名"
              value={form.name}
              onValueChange={(v) => setForm({ ...form, name: v })}
              isRequired
            />
            <Input
              label="手机号"
              value={form.phone}
              onValueChange={(v) => setForm({ ...form, phone: v })}
              isRequired
            />
            <Input
              label="密码"
              type="password"
              value={form.password}
              onValueChange={(v) => setForm({ ...form, password: v })}
              isRequired
            />
            <Select
              label="角色"
              selectedKeys={[form.role]}
              onSelectionChange={(keys) => setForm({ ...form, role: [...keys][0] as any })}
            >
              <SelectItem key="admin">admin</SelectItem>
              <SelectItem key="super_admin">super_admin</SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              取消
            </Button>
            <Button color="primary" onPress={handleCreate}>
              创建
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/routes/_auth/users.tsx apps/admin/src/api/users.ts
git commit -m "feat: add users management page"
```

---

### Task 21: 权限管理页

**交付物：** 查看/编辑 admin 角色的页面权限（checkbox 列表）
**验收标准：** 可勾选/取消权限并保存

**Files:**

- Create: `apps/admin/src/routes/_auth/permissions.tsx`
- Create: `apps/admin/src/api/permissions.ts`

- [ ] **Step 1: 创建 api/permissions.ts**

```typescript
import request from './request';

export const permissionsApi = {
  getAll: () => request.get('/permissions').then((r) => r.data),

  getRolePermissions: (role: string) =>
    request.get(`/permissions/role/${role}`).then((r) => r.data),

  updateRolePermissions: (role: string, permissions: string[]) =>
    request.put('/permissions/role', { role, permissions }).then((r) => r.data),
};
```

- [ ] **Step 2: 创建 permissions.tsx 页面**

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button, Checkbox, Card, CardBody, CardHeader } from '@heroui/react';
import { permissionsApi } from '../../api/permissions';
import { PERMISSIONS } from '@rent-app/schema';

export const Route = createFileRoute('/_auth/permissions')({
  component: PermissionsPage,
});

const permissionLabels: Record<string, string> = {
  dashboard: '仪表盘',
  buildings: '楼栋管理',
  rooms: '房间管理',
  tenants_mgmt: '租客管理',
  fees: '费用管理',
  users: '用户管理',
  roles: '权限管理',
};

function PermissionsPage() {
  const [adminPermissions, setAdminPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    permissionsApi.getRolePermissions('admin').then(setAdminPermissions);
  }, []);

  const togglePermission = (name: string) => {
    setAdminPermissions((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name],
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await permissionsApi.updateRolePermissions('admin', adminPermissions);
      alert('保存成功');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">权限管理</h1>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Admin 角色权限</h2>
        </CardHeader>
        <CardBody className="gap-3">
          {PERMISSIONS.map((name) => (
            <Checkbox
              key={name}
              isSelected={adminPermissions.includes(name)}
              onValueChange={() => togglePermission(name)}
            >
              {permissionLabels[name] || name}
            </Checkbox>
          ))}
          <Button color="primary" onPress={handleSave} isLoading={loading} className="mt-4 w-fit">
            保存
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/routes/_auth/permissions.tsx apps/admin/src/api/permissions.ts
git commit -m "feat: add permissions management page"
```

---

### Task 22: 审计日志页

**交付物：** 审计日志只读列表页（分页 + 按时间倒序）
**验收标准：** 显示操作记录，支持翻页

**Files:**

- Create: `apps/admin/src/routes/_auth/audit-logs.tsx`
- Create: `apps/admin/src/api/audit.ts`

- [ ] **Step 1: 创建 api/audit.ts**

```typescript
import request from './request';

export const auditApi = {
  list: (page = 1, pageSize = 20) =>
    request.get('/audit', { params: { page, pageSize } }).then((r) => r.data),
};
```

- [ ] **Step 2: 创建 audit-logs.tsx 页面**

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
} from '@heroui/react';
import { auditApi } from '../../api/audit';

export const Route = createFileRoute('/_auth/audit-logs')({
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const loadLogs = useCallback(async () => {
    const data = await auditApi.list(page);
    setLogs(data.items);
    setTotal(data.total);
  }, [page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">审计日志</h1>
      <Table aria-label="审计日志">
        <TableHeader>
          <TableColumn>操作</TableColumn>
          <TableColumn>目标类型</TableColumn>
          <TableColumn>目标ID</TableColumn>
          <TableColumn>操作时间</TableColumn>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id?.toString()}>
              <TableCell>{log.action}</TableCell>
              <TableCell>{log.targetType}</TableCell>
              <TableCell>{log.targetId?.toString() || '-'}</TableCell>
              <TableCell>{new Date(log.createdAt).toLocaleString('zh-CN')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-4 flex justify-center">
        <Pagination total={Math.ceil(total / 20)} page={page} onChange={setPage} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/routes/_auth/audit-logs.tsx apps/admin/src/api/audit.ts
git commit -m "feat: add audit logs page"
```

---

### Task 23: 业务占位页

**交付物：** buildings/rooms/tenants/fees 四个占位路由页面
**验收标准：** 点击侧边栏菜单能进入对应页面，显示"功能开发中"

**Files:**

- Create: `apps/admin/src/routes/_auth/buildings.tsx`
- Create: `apps/admin/src/routes/_auth/rooms.tsx`
- Create: `apps/admin/src/routes/_auth/tenants.tsx`
- Create: `apps/admin/src/routes/_auth/fees.tsx`

- [ ] **Step 1: 创建四个占位页面**

每个文件结构相同，以 buildings 为例：

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/buildings')({
  component: () => (
    <div className="flex h-64 items-center justify-center text-gray-400">楼栋管理 - 功能开发中</div>
  ),
});
```

rooms.tsx → `/_auth/rooms`，显示"房间管理 - 功能开发中"
tenants.tsx → `/_auth/tenants`，显示"租客管理 - 功能开发中"
fees.tsx → `/_auth/fees`，显示"费用管理 - 功能开发中"

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/routes/_auth/buildings.tsx apps/admin/src/routes/_auth/rooms.tsx apps/admin/src/routes/_auth/tenants.tsx apps/admin/src/routes/_auth/fees.tsx
git commit -m "feat: add placeholder pages for business modules"
```

---

## 最终验收

- [ ] **启动后端：** `pnpm --filter server dev` → 3000 端口
- [ ] **启动前端：** `pnpm --filter admin dev` → 5173 端口
- [ ] **登录测试：** code=default, account=admin, password=admin123 → 进入 dashboard
- [ ] **侧边栏：** super_admin 看到所有菜单项
- [ ] **用户管理：** 创建 admin 用户、禁用、解锁、删除
- [ ] **权限管理：** 修改 admin 角色权限并保存
- [ ] **审计日志：** 查看操作记录
- [ ] **锁定测试：** 连续5次错误密码 → 锁定 → 15分钟后自动解锁
