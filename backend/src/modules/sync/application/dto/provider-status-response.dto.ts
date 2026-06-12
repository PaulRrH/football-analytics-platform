import { ApiProperty } from '@nestjs/swagger';

export class ProviderStatusResponseDto {
  @ApiProperty({ example: 'football-data.org' })
  provider: string;

  @ApiProperty({ example: true })
  configured: boolean;
}
