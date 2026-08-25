import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { UNITS } from '../../movement/dto/movement.dto';

export class ExtractionInputDto {
  @ApiProperty({ format: 'uuid', description: 'Movimiento recibido que alimenta la extraccion.' })
  @IsUUID()
  movementId!: string;

  @ApiProperty({ example: 850 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity!: number;

  @ApiPropertyOptional({ enum: UNITS })
  @IsOptional()
  @IsEnum(UNITS)
  unit?: (typeof UNITS)[number];
}

export class CreateExtractionDto {
  @ApiProperty({ format: 'uuid', description: 'Sala de extraccion donde se realiza la operacion.' })
  @IsUUID()
  establishmentId!: string;

  @ApiProperty({ type: [ExtractionInputDto], description: 'Movimientos recibidos a procesar.' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExtractionInputDto)
  inputs!: ExtractionInputDto[];

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  startedAt!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  finishedAt?: string;

  @ApiPropertyOptional({ example: 620.5, description: 'Miel obtenida. Puede cargarse al cerrar.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  outputQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  operatorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CompleteExtractionDto {
  @ApiProperty({ example: 620.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  outputQuantity!: number;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  finishedAt?: string;
}

export class LotInputDto {
  @ApiProperty({ enum: ['MOVEMENT', 'LOT', 'EXTRACTION', 'MANUAL'] })
  @IsEnum(['MOVEMENT', 'LOT', 'EXTRACTION', 'MANUAL'])
  sourceType!: 'MOVEMENT' | 'LOT' | 'EXTRACTION' | 'MANUAL';

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sourceMovementId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sourceLotId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sourceExtractionId?: string;

  @ApiProperty({ example: 300 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity!: number;

  @ApiPropertyOptional({ enum: UNITS })
  @IsOptional()
  @IsEnum(UNITS)
  unit?: (typeof UNITS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(600)
  notes?: string;
}

export class CreateLotDto {
  @ApiProperty({ format: 'uuid', description: 'Establecimiento donde se conforma el lote.' })
  @IsUUID()
  establishmentId!: string;

  @ApiPropertyOptional({
    enum: ['EXTRACCION', 'ACOPIO', 'MEZCLA', 'FRACCIONAMIENTO'],
    default: 'EXTRACCION',
  })
  @IsOptional()
  @IsEnum(['EXTRACCION', 'ACOPIO', 'MEZCLA', 'FRACCIONAMIENTO'])
  lotType?: 'EXTRACCION' | 'ACOPIO' | 'MEZCLA' | 'FRACCIONAMIENTO';

  @ApiPropertyOptional({ format: 'uuid', description: 'Extraccion que origina el lote.' })
  @IsOptional()
  @IsUUID()
  extractionId?: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  productionDate!: string;

  @ApiProperty({ example: 620.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity!: number;

  @ApiPropertyOptional({ enum: UNITS, default: 'KG' })
  @IsOptional()
  @IsEnum(UNITS)
  unit?: (typeof UNITS)[number];

  @ApiPropertyOptional({
    type: [LotInputDto],
    description: 'Origenes del lote. CU-15: define la arista hacia atras del grafo.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LotInputDto)
  inputs?: LotInputDto[];

  @ApiPropertyOptional({ example: 'Multifloral' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  honeyType?: string;

  @ApiPropertyOptional({ example: 17.4, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  moisturePercent?: number;

  @ApiPropertyOptional({ example: 'Ambar claro' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class AddLotInputsDto {
  @ApiProperty({ type: [LotInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LotInputDto)
  inputs!: LotInputDto[];
}

export class UpdateLotStatusDto {
  @ApiProperty({ enum: ['OPEN', 'CLOSED', 'BLOCKED', 'DISPATCHED', 'CONSUMED'] })
  @IsEnum(['OPEN', 'CLOSED', 'BLOCKED', 'DISPATCHED', 'CONSUMED'])
  status!: 'OPEN' | 'CLOSED' | 'BLOCKED' | 'DISPATCHED' | 'CONSUMED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(600)
  reason?: string;
}

export class CreateDrumDto {
  @ApiPropertyOptional({ description: 'Codigo del tambor. Si se omite se genera automaticamente.' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  code?: string;

  @ApiProperty({ example: 300, description: 'Peso neto de miel.' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  netWeight!: number;

  @ApiPropertyOptional({ example: 24.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  tareWeight?: number;

  @ApiPropertyOptional({ example: 324.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  grossWeight?: number;

  @ApiPropertyOptional({ format: 'uuid', description: 'Ubicacion fisica. Por defecto, la del lote.' })
  @IsOptional()
  @IsUUID()
  locationEstablishmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  sealNumber?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  filledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(600)
  notes?: string;
}

/** CU-25: transferencia de ubicacion sin perder trazabilidad. */
export class TransferDrumDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  toEstablishmentId!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(600)
  notes?: string;
}

export class CreateSampleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  lotId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  drumId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Laboratorio destinatario.' })
  @IsOptional()
  @IsUUID()
  laboratoryOrganizationId?: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  takenAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  takenBy?: string;

  @ApiPropertyOptional({ example: 'HMF y humedad' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  analysisType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
