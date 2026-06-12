import { ApiProperty } from '@nestjs/swagger';

export class SyncResultResponseDto {
  @ApiProperty({ example: 12 })
  created: number;

  @ApiProperty({ example: 3 })
  updated: number;

  @ApiProperty({ example: 1 })
  skipped: number;
}
