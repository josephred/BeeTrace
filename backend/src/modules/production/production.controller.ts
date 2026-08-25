import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExtractionService } from './extraction.service';
import { LotService } from './lot.service';
import { DrumService } from './drum.service';
import {
  AddLotInputsDto,
  CompleteExtractionDto,
  CreateDrumDto,
  CreateExtractionDto,
  CreateLotDto,
  CreateSampleDto,
  TransferDrumDto,
  UpdateLotStatusDto,
} from './dto/production.dto';
import { Audit, CorrelationId, CurrentUser, Roles } from '../../common/decorators';
import { paginated } from '../../common/dto/pagination.dto';
import {
  ListDrumsQueryDto,
  ListExtractionsQueryDto,
  ListLotsQueryDto,
} from '../../common/dto/filters.dto';
import type { AuthenticatedUser } from '../../common/types';

@ApiTags('Extraccion, lotes y tambores')
@ApiBearerAuth()
@Controller('extractions')
export class ExtractionController {
  constructor(private readonly extractions: ExtractionService) {}

  @Post()
  @Roles('ADMIN', 'SALA', 'ACOPIADOR')
  @Audit('EXTRACTION_CREATED', 'extraction')
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiOperation({
    summary: 'CU-13 Registrar extraccion',
    description:
      'Consume movimientos recibidos en la sala. Un movimiento no puede alimentar dos extracciones.',
  })
  create(
    @Body() dto: CreateExtractionDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string,
  ) {
    return this.extractions.create(dto, actor, correlationId);
  }

  @Get()
  async list(@Query() query: ListExtractionsQueryDto, @CurrentUser() actor: AuthenticatedUser) {
    const { rows, total } = await this.extractions.list(query, actor, {
      establishmentId: query.establishmentId,
    });
    return paginated(rows, total, query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.extractions.findOneDetailed(id, actor);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'SALA', 'ACOPIADOR')
  @Audit('EXTRACTION_COMPLETED', 'extraction')
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteExtractionDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string,
  ) {
    return this.extractions.complete(id, dto, actor, correlationId);
  }
}

@ApiTags('Extraccion, lotes y tambores')
@ApiBearerAuth()
@Controller('lots')
export class LotController {
  constructor(
    private readonly lots: LotService,
    private readonly drums: DrumService,
  ) {}

  @Post()
  @Roles('ADMIN', 'SALA', 'ACOPIADOR', 'FRACCIONADOR')
  @Audit('LOT_CREATED', 'lot')
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiOperation({
    summary: 'CU-14 Crear lote',
    description:
      'El lote es la unidad logica de trazabilidad. Sus entradas (CU-15) definen la arista hacia atras del grafo.',
  })
  create(
    @Body() dto: CreateLotDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string,
  ) {
    return this.lots.create(dto, actor, correlationId);
  }

  @Get()
  async list(@Query() query: ListLotsQueryDto, @CurrentUser() actor: AuthenticatedUser) {
    const { rows, total } = await this.lots.list(query, actor, {
      status: query.status,
      establishmentId: query.establishmentId,
    });
    return paginated(rows, total, query);
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Buscar un lote por su codigo legible (LOTE-2026-000001).' })
  findByCode(@Param('code') code: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.lots.findByCode(code, actor);
  }

  @Get('available-inputs/:establishmentId')
  @ApiOperation({
    summary: 'Movimientos recibidos aun no procesados en un establecimiento.',
    description: 'Insumo para armar una extraccion o un lote de acopio.',
  })
  availableInputs(
    @Param('establishmentId', ParseUUIDPipe) establishmentId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.lots.availableInputsAt(establishmentId, actor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle del lote con entradas, tambores y resumen de pesos.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.lots.findOneDetailed(id, actor);
  }

  @Post(':id/inputs')
  @Roles('ADMIN', 'SALA', 'ACOPIADOR', 'FRACCIONADOR')
  @Audit('LOT_INPUTS_ADDED', 'lot')
  @ApiOperation({ summary: 'CU-15 Asociar entradas a un lote existente.' })
  addInputs(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddLotInputsDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string,
  ) {
    return this.lots.addInputs(id, dto, actor, correlationId);
  }

  @Post(':id/status')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'SALA', 'ACOPIADOR', 'FRACCIONADOR')
  @Audit('LOT_STATUS_UPDATED', 'lot')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLotStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string,
  ) {
    return this.lots.updateStatus(id, dto, actor, correlationId);
  }

  @Post(':id/drums')
  @Roles('ADMIN', 'SALA', 'ACOPIADOR')
  @Audit('DRUM_CREATED', 'drum')
  @ApiOperation({
    summary: 'CU-16 Registrar tambor',
    description: 'La suma de pesos netos de los tambores no puede superar la cantidad del lote.',
  })
  createDrum(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDrumDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string,
  ) {
    return this.drums.create(id, dto, actor, correlationId);
  }

  @Get(':id/samples')
  listSamples(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.drums.listSamples(id, actor);
  }
}

@ApiTags('Extraccion, lotes y tambores')
@ApiBearerAuth()
@Controller('drums')
export class DrumController {
  constructor(private readonly drums: DrumService) {}

  @Get()
  async list(@Query() query: ListDrumsQueryDto, @CurrentUser() actor: AuthenticatedUser) {
    const { rows, total } = await this.drums.list(query, actor, {
      lotId: query.lotId,
      status: query.status,
    });
    return paginated(rows, total, query);
  }

  @Get('by-code/:code')
  findByCode(@Param('code') code: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.drums.findByCode(code, actor);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.drums.findOneDetailed(id, actor);
  }

  @Post(':id/transfer')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'SALA', 'ACOPIADOR', 'FRACCIONADOR')
  @Audit('DRUM_TRANSFERRED', 'drum')
  @ApiOperation({ summary: 'CU-25 Transferir el tambor a otra ubicacion.' })
  transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferDrumDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string,
  ) {
    return this.drums.transfer(id, dto, actor, correlationId);
  }
}

@ApiTags('Extraccion, lotes y tambores')
@ApiBearerAuth()
@Controller('samples')
export class SampleController {
  constructor(private readonly drums: DrumService) {}

  @Post()
  @Roles('ADMIN', 'SALA', 'ACOPIADOR', 'FRACCIONADOR', 'LABORATORIO')
  @Audit('SAMPLE_CREATED', 'sample')
  @ApiOperation({ summary: 'CU-21 Registrar muestra asociada a un lote o tambor.' })
  create(
    @Body() dto: CreateSampleDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string,
  ) {
    return this.drums.createSample(dto, actor, correlationId);
  }
}
