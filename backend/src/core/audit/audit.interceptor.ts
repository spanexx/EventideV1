/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AuditLog } from '../audit-log.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../modules/users/user.schema'; // Import User entity

interface AuthenticatedRequest extends Request {
  user?: User; // Extend Request to include the user property
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>(); // Use AuthenticatedRequest
    const { method, url, body, user } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(
        (data) => {
          // On success
          const auditLog = new this.auditLogModel({
            timestamp: new Date(),
            method,
            url,
            requestBody: body,
            userId: user ? (user as any).id || (user as any)._id : null, // user.id should now be recognized
            responseBody: data,
            statusCode: context.switchToHttp().getResponse().statusCode,
            duration: Date.now() - now,
            status: 'success',
          });
          void auditLog.save();
        },
        (err: any) => {
          // On error
          const auditLog = new this.auditLogModel({
            timestamp: new Date(),
            method,
            url,
            requestBody: body,
            userId: user ? (user as any).id || (user as any)._id : null, // user.id should now be recognized
            error: err.message,
            statusCode: err.status || 500,
            duration: Date.now() - now,
            status: 'error',
          });
          void auditLog.save();
        },
      ),
    );
  }
}
