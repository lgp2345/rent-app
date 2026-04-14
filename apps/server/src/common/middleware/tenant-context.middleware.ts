import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

type RequestWithTenant = Request & {
  user?: { tenantId?: string };
  tenantId?: bigint;
};

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: RequestWithTenant, _res: Response, next: NextFunction) {
    if (req.user?.tenantId) {
      req.tenantId = BigInt(req.user.tenantId);
    }
    next();
  }
}
