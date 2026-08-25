import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TraceabilityService } from './traceability.service';
import { CurrentUser } from '../../common/decorators';
import type { AuthenticatedUser } from '../../common/types';

@ApiTags('Trazabilidad')
@ApiBearerAuth()
@Controller()
export class TraceabilityController {
  constructor(private readonly traceability: TraceabilityService) {}

  @Get('lots/:id/trace/backward')
  @ApiOperation({
    summary: 'CU-17 Trazabilidad hacia atras desde un lote',
    description:
      'Recorre lote -> lotes previos -> extraccion -> movimiento -> apiario -> establecimiento -> RENSPA -> productor -> RENAPA. Devuelve el grafo, un resumen y los huecos detectados.',
  })
  backwardFromLot(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.traceability.backwardFromLot(id, actor);
  }

  @Get('lots/:id/trace/forward')
  @ApiOperation({ summary: 'CU-18 Trazabilidad hacia adelante desde un lote.' })
  forwardFromLot(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.traceability.forwardFrom('lot', id, actor);
  }

  @Get('drums/:id/trace/backward')
  @ApiOperation({ summary: 'CU-17 Trazabilidad hacia atras desde un tambor.' })
  backwardFromDrum(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.traceability.backwardFromDrum(id, actor);
  }

  @Get('traceability/forward/:entityType/:id')
  @ApiParam({
    name: 'entityType',
    enum: ['producer', 'establishment', 'apiary', 'movement', 'lot'],
  })
  @ApiOperation({
    summary: 'CU-18 Trazabilidad hacia adelante desde cualquier origen',
    description: 'Responde: donde termino la miel producida por este apiario / productor.',
  })
  forward(
    @Param('entityType') entityType: 'producer' | 'establishment' | 'apiary' | 'movement' | 'lot',
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.traceability.forwardFrom(entityType, id, actor);
  }

  @Get('traceability/timeline/:entityType/:id')
  @ApiParam({
    name: 'entityType',
    enum: ['producer', 'establishment', 'apiary', 'movement', 'extraction', 'lot', 'drum'],
  })
  @ApiOperation({ summary: 'CU-19 Historial de eventos de una entidad.' })
  timeline(
    @Param('entityType') entityType: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.traceability.timeline(entityType, id, actor);
  }
}
