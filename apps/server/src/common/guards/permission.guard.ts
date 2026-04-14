import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import * as schema from '../../db/schema';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { tenantId: string; role: string } }>();
    if (!request.user) {
      throw new ForbiddenException('未认证');
    }

    const tenantId = BigInt(request.user.tenantId);
    const role = request.user.role;

    const [permission] = await db
      .select()
      .from(schema.permissions)
      .where(eq(schema.permissions.name, requiredPermission));

    if (!permission) {
      throw new ForbiddenException('权限不存在');
    }

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

    if (!rolePermission) {
      throw new ForbiddenException('无权访问');
    }

    return true;
  }
}
