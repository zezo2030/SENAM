import { Global, Module } from '@nestjs/common';
import { EventBusService } from './event-bus.js';

@Global()
@Module({
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventBusModule {}
