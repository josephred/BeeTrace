import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Numero de pagina (base 1).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize = 20;

  @ApiPropertyOptional({ description: 'Busqueda libre sobre los campos principales.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  get offset(): number {
    return (this.page - 1) * this.pageSize;
  }
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const paginated = <T>(
  data: T[],
  total: number,
  query: { page: number; pageSize: number },
): PaginatedResult<T> => ({
  data,
  meta: {
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  },
});
