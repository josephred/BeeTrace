import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { tap, type Observable } from 'rxjs';
import { AUDIT_KEY, type AuditMetadata } from '../decorators';
import { AuditService } from '../services/audit.service';
import type { AuthenticatedUser } from '../types';

/**
 * CU-33: registra automaticamente los endpoints decorados con @Audit.
 * Se ejecuta despues del handler para no auditar operaciones fallidas.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.getAllAndOverride<AuditMetadata | undefined>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!metadata) return next.handle();

    const request = context.switchToHttp().getRequest<
      Request & { user?: AuthenticatedUser; correlationId?: string }
    >();

    return next.handle().pipe(
      tap((result) => {
        const entityId =
          result && typeof result === 'object' && 'id' in result
            ? String((result as { id: unknown }).id)
            : this.headerValue(request.params?.id);

        void this.audit.record({
          action: metadata.action,
          entityType: metadata.entityType,
          entityId,
          actor: request.user ?? null,
          after: result,
          correlationId: request.correlationId ?? null,
          ip: request.ip ?? null,
          userAgent: this.headerValue(request.headers['user-agent']),
        });
      }),
    );
  }

  private headerValue(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  }
}
