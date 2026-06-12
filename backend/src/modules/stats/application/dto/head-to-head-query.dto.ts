import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class HeadToHeadQueryDto {
  @ApiProperty({ description: 'ID del primer equipo' })
  @IsUUID()
  teamA: string;

  @ApiProperty({ description: 'ID del segundo equipo' })
  @IsUUID()
  teamB: string;
}
