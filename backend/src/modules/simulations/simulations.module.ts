import { Module } from '@nestjs/common';
import { SIMULATION_REPOSITORY } from './domain/simulation-repository.interface';
import { PrismaSimulationRepository } from './infrastructure/repositories/prisma-simulation.repository';
import { SimulationsController } from './presentation/controllers/simulations.controller';
import { SimulationsService } from './application/services/simulations.service';

@Module({
  controllers: [SimulationsController],
  providers: [
    SimulationsService,
    {
      provide: SIMULATION_REPOSITORY,
      useClass: PrismaSimulationRepository,
    },
  ],
})
export class SimulationsModule {}
