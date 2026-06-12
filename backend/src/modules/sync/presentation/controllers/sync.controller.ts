import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { Role } from '../../../../common/enums/role.enum';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { ProviderStatusResponseDto } from '../../application/dto/provider-status-response.dto';
import { SyncResultResponseDto } from '../../application/dto/sync-result-response.dto';
import { SyncService } from '../../application/services/sync.service';

@ApiTags('admin/sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Consultar el proveedor de datos externos activo (solo ADMIN)',
  })
  getStatus(): ProviderStatusResponseDto {
    return this.syncService.getStatus();
  }

  @Post('competitions')
  @ApiOperation({
    summary:
      'Sincronizar competiciones desde el proveedor externo (solo ADMIN)',
  })
  syncCompetitions(): Promise<SyncResultResponseDto> {
    return this.syncService.syncCompetitions();
  }

  @Post('competitions/:id/teams')
  @ApiOperation({
    summary:
      'Sincronizar los equipos de una competicion vinculada (solo ADMIN)',
  })
  syncTeams(@Param('id') id: string): Promise<SyncResultResponseDto> {
    return this.syncService.syncTeams(id);
  }

  @Post('competitions/:id/matches')
  @ApiOperation({
    summary:
      'Sincronizar los partidos de una competicion vinculada (solo ADMIN)',
  })
  syncMatches(@Param('id') id: string): Promise<SyncResultResponseDto> {
    return this.syncService.syncMatches(id);
  }
}
