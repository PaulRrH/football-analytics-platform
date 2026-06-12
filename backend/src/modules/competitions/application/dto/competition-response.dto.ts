import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { CompetitionStatus } from '../../../../common/enums/competition-status.enum';
import { CompetitionType } from '../../../../common/enums/competition-type.enum';

@Exclude()
export class CompetitionResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty({ enum: CompetitionType })
  type: CompetitionType;

  @Expose()
  @ApiProperty()
  season: string;

  @Expose()
  @ApiProperty()
  startDate: Date;

  @Expose()
  @ApiProperty()
  endDate: Date;

  @Expose()
  @ApiProperty({ enum: CompetitionStatus })
  status: CompetitionStatus;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
