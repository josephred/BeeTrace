import { Module } from '@nestjs/common';
import { MovementController, MovementRuleController } from './movement.controller';
import { MovementService } from './movement.service';
import { MovementRuleService } from './movement-rule.service';
import { DteService } from './dte.service';
import { EstablishmentModule } from '../establishment/establishment.module';

@Module({
  imports: [EstablishmentModule],
  controllers: [MovementController, MovementRuleController],
  providers: [MovementService, MovementRuleService, DteService],
  exports: [MovementService, MovementRuleService, DteService],
})
export class MovementModule {}
