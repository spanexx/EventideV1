import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './audit-log.schema';
import { UserDocument } from '../modules/users/user.schema';

interface RequestWithUser extends Request {
  user?: UserDocument;
}

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
  ) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      // Create an audit log entry for the request
      const auditLog = new this.auditLogModel({
        userId: req.user?.id as string | undefined, // Will be undefined if no user is logged in
        action: req.method,
        entityType: 'request',
        entityId: req.originalUrl,
        metadata: {
          ip: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
          method: req.method,
          path: req.originalUrl,
        },
      });

      await auditLog.save();
      console.log(`[Audit Log] ${req.method} ${req.originalUrl}`);
    } catch (error: any) {
      // Log the error but don't block the request
      console.error('Audit logging failed:', error);
    }

    next();
  }
}
