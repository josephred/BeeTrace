import { Global, Module } from '@nestjs/common';
import { AccessControlService } from './services/access-control.service';
import { AuditService } from './services/audit.service';
import { CodeService } from './services/code.service';
import { EventsService } from './services/events.service';
import { IdempotencyService } from './services/idempotency.service';
import { OutboxDispatcher } from './services/outbox-dispatcher.service';

const providers = [
  AccessControlService,
  AuditService,
  CodeService,
  EventsService,
  IdempotencyService,
  OutboxDispatcher,
];

@Global()
@Module({
  providers,
  exports: providers,
})
export class CommonModule {}
