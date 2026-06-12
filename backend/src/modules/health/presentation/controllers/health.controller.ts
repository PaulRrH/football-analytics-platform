import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../common/decorators/public.decorator';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
  database: 'up';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Estado de la API y conexion a la base de datos' })
  async check(): Promise<HealthResponse> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException(
        'La base de datos no esta disponible',
      );
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'up',
    };
  }
}
