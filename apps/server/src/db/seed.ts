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
