import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../../db';
import * as schema from '../../../db/schema';

type JwtPayload = {
  sub: string;
  tenantId: string;
  role: string;
  sessionId: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const [session] = await db
      .select()
      .from(schema.userSessions)
      .where(
        and(
          eq(schema.userSessions.id, BigInt(payload.sessionId)),
          isNull(schema.userSessions.revokedAt),
        ),
      );

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session revoked');
    }

    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, BigInt(payload.sub)));
    if (!user || user.status === 0 || user.status === 2) {
      throw new UnauthorizedException('User disabled');
    }

    return {
      sub: user.id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role,
      sessionId: session.id.toString(),
    };
  }
}
