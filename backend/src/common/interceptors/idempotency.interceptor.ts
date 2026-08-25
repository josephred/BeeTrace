import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { firstValueFrom, of, type Observable } from 'rxjs';
import { IdempotencyService } from '../services/idempotency.service';
import type { AuthenticatedUser } from '../types';

export const IDEMPOTENCY_HEADER = 'idempotency-key';

/**
 * Aplica idempotencia a los POST que envien la cabecera Idempotency-Key.
 * Si no la envian, el comportamiento es el habitual: la cabecera es opcional
 * pero recomendada para los comandos que crean movimientos y documentos.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotency: IdempotencyService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { user?: AuthenticatedUser }>();

    if (request.method !== 'POST') {
      return next.handle();
    }

    const raw = request.headers[IDEMPOTENCY_HEADER];
    const key = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (!key) {
      return next.handle();
    }

    const endpoint = `${request.method} ${request.route?.path ?? request.url}`;
    const cached = await this.idempotency.begin(key, endpoint, request.body, request.user?.id);
    if (cached) {
      const response = http.getResponse<Response>();
      response.status(cached.status);
      response.setHeader('idempotent-replay', 'true');
      return of(cached.body);
    }

    try {
      const result = await firstValueFrom(next.handle());
      const status = http.getResponse<Response>().statusCode;
      await this.idempotency.complete(key, status, result);
      return of(result);
    } catch (error) {
      // Una operacion fallida no debe bloquear el reintento con la misma clave.
      await this.idempotency.release(key);
      throw error;
    }
  }
}
