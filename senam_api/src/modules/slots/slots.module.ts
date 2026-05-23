import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlotTemplateEntity } from './entities/slot-template.entity.js';
import { TimeSlotEntity } from './entities/time-slot.entity.js';
import { SlotsService } from './slots.service.js';
import { SlotsController } from './slots.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([SlotTemplateEntity, TimeSlotEntity])],
  controllers: [SlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
