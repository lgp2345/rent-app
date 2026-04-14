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

export const userSessions = pgTable(
  'user_sessions',
  {
    id: bigint('id', { mode: 'bigint' }).primaryKey(),
    userId: bigint('user_id', { mode: 'bigint' })
      .notNull()
      .references(() => users.id),
    tenantId: bigint('tenant_id', { mode: 'bigint' })
      .notNull()
      .references(() => tenants.id),
    revokedAt: timestamp('revoked_at'),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('user_sessions_user_id_idx').on(table.userId)],
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
