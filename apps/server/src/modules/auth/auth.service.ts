import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { and, eq, isNull, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { LoginInput, RefreshInput } from '@rent-app/schema';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { generateId } from '../../common/utils/snowflake';

const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(input: LoginInput) {
    const [tenant] = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.code, input.code));

    if (!tenant) {
      throw new UnauthorizedException('租户编码不存在');
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.tenantId, tenant.id),
          or(eq(schema.users.name, input.account), eq(schema.users.phone, input.account)),
        ),
      );

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.status === 0) {
      throw new ForbiddenException('账号已禁用');
    }

    if (user.status === 2) {
      if (user.lockedAt && Date.now() - user.lockedAt.getTime() > LOCK_DURATION_MS) {
        await db
          .update(schema.users)
          .set({ status: 1, loginAttempts: 0, lockedAt: null, updatedAt: new Date() })
          .where(eq(schema.users.id, user.id));
      } else {
        const remainingMs = user.lockedAt ? LOCK_DURATION_MS - (Date.now() - user.lockedAt.getTime()) : 0;
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
          .set({ loginAttempts: attempts, status: 2, lockedAt: new Date(), updatedAt: new Date() })
          .where(eq(schema.users.id, user.id));
        await this.logAudit(tenant.id, user.id, 'login_failed', 'user', user.id, { reason: 'locked' });
        throw new ForbiddenException('密码错误次数过多，账号已锁定15分钟');
      }

      await db
        .update(schema.users)
        .set({ loginAttempts: attempts, updatedAt: new Date() })
        .where(eq(schema.users.id, user.id));
      await this.logAudit(tenant.id, user.id, 'login_failed', 'user', user.id, { remaining });
      throw new UnauthorizedException(`密码错误，还剩${remaining}次机会`);
    }

    await db
      .update(schema.users)
      .set({ loginAttempts: 0, lockedAt: null, status: 1, updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));

    const sessionId = generateId();
    await db.insert(schema.userSessions).values({
      id: sessionId,
      userId: user.id,
      tenantId: tenant.id,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    });

    const payload = {
      sub: user.id.toString(),
      tenantId: tenant.id.toString(),
      role: user.role,
      sessionId: sessionId.toString(),
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await db.insert(schema.refreshTokens).values({
      id: generateId(),
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
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
      permissions: userPermissions.map((item) => item.name),
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

    const [session] = await db
      .select()
      .from(schema.userSessions)
      .where(and(eq(schema.userSessions.userId, token.userId), isNull(schema.userSessions.revokedAt)))
      .orderBy(schema.userSessions.createdAt);

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('session 无效或已过期');
    }

    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, token.userId));
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const payload = {
      sub: user.id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role,
      sessionId: session.id.toString(),
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await db.insert(schema.refreshTokens).values({
      id: generateId(),
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: bigint, sessionId: bigint, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await db
        .update(schema.refreshTokens)
        .set({ revokedAt: new Date(), updatedAt: new Date() })
        .where(
          and(eq(schema.refreshTokens.tokenHash, tokenHash), eq(schema.refreshTokens.userId, userId)),
        );
    }

    await db
      .update(schema.userSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(schema.userSessions.id, sessionId), eq(schema.userSessions.userId, userId)));

    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
    if (user) {
      await this.logAudit(user.tenantId, user.id, 'logout', 'user', user.id, null);
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
