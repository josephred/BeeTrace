import { Module } from '@nestjs/common';
import { ApiaryController } from './apiary.controller';
import { ApiaryService } from './apiary.service';
import { EstablishmentModule } from '../establishment/establishment.module';

@Module({
  imports: [EstablishmentModule],
  controllers: [ApiaryController],
  providers: [ApiaryService],
  exports: [ApiaryService],
})
export class ApiaryModule {}
