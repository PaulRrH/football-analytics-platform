import { Module } from '@nestjs/common';
import { EventsGateway } from './presentation/gateways/events.gateway';

@Module({
  providers: [EventsGateway],
})
export class RealtimeModule {}
