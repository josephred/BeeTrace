import { Module } from '@nestjs/common';
import {
  DrumController,
  ExtractionController,
  LotController,
  SampleController,
} from './production.controller';
import { ExtractionService } from './extraction.service';
import { LotService } from './lot.service';
import { DrumService } from './drum.service';
import { EstablishmentModule } from '../establishment/establishment.module';
import { MovementModule } from '../movement/movement.module';

@Module({
  imports: [EstablishmentModule, MovementModule],
  controllers: [ExtractionController, LotController, DrumController, SampleController],
  providers: [ExtractionService, LotService, DrumService],
  exports: [ExtractionService, LotService, DrumService],
})
export class ProductionModule {}
