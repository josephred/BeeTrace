import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from '../../common/services/audit.service';
import { EventsService } from '../../common/services/events.service';
import { Roles } from '../../common/decorators';
import { paginated } from '../../common/dto/pagination.dto';
import {
  AuditQueryDto,
  TraceabilityEventQueryDto,
} from '../../common/dto/filters.dto';

@ApiTags('Auditoria')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(
    private readonly audit: AuditService,
    private readonly events: EventsService,
  ) {}

  @Get('events')
  @Roles('ADMIN', 'AUDITOR')
  @ApiOperation({ summary: 'CU-34 Consultar auditoria.' })
  async list(@Query() query: AuditQueryDto) {
    const { rows, total } = await this.audit.search({
      entityType: query.entityType,
      entityId: query.entityId,
      actorUserId: query.actorUserId,
      action: query.action,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page,
      pageSize: query.pageSize,
    });
    return paginated(rows, total, query);
  }

  @Get('traceability-events')
  @Roles('ADMIN', 'AUDITOR')
  @ApiOperation({ summary: 'Eventos de trazabilidad registrados por el sistema.' })
  async listTraceabilityEvents(@Query() query: TraceabilityEventQueryDto) {
    const { rows, total } = await this.events.search({
      eventType: query.eventType,
      entityType: query.entityType,
      page: query.page,
      pageSize: query.pageSize,
    });
    return paginated(rows, total, query);
  }
}
