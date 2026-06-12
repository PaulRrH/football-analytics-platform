import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Confederation, MatchStage, Team } from '@prisma/client';
import {
  ITeamRepository,
  TEAM_REPOSITORY,
} from '../../domain/team-repository.interface';
import { EloRatingService } from './elo-rating.service';

describe('EloRatingService', () => {
  let service: EloRatingService;
  let repository: jest.Mocked<ITeamRepository>;

  const buildTeam = (overrides: Partial<Team>): Team => ({
    id: 'team-id',
    name: 'Team',
    shortName: 'TM',
    country: 'Country',
    confederation: Confederation.UEFA,
    logoUrl: null,
    fifaRanking: 10,
    fifaRankingPoints: 1500,
    eloRating: 1500,
    foundedYear: 1900,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  });

  const homeTeam = buildTeam({ id: 'home-team', eloRating: 1500 });
  const awayTeam = buildTeam({ id: 'away-team', eloRating: 1500 });

  beforeEach(async () => {
    repository = {
      findAll: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findRankingHistory: jest.fn(),
      recordRankingHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EloRatingService,
        { provide: TEAM_REPOSITORY, useValue: repository },
      ],
    }).compile();

    service = module.get(EloRatingService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('lanza NotFoundException si alguno de los equipos no existe', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.applyMatchResult(
        'home-team',
        'away-team',
        1,
        0,
        MatchStage.FRIENDLY,
      ),
    ).rejects.toThrow(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('actualiza el eloRating de ambos equipos y registra el historial tras una victoria local', async () => {
    repository.findById.mockImplementation((id) =>
      Promise.resolve(id === homeTeam.id ? homeTeam : awayTeam),
    );

    await service.applyMatchResult(
      homeTeam.id,
      awayTeam.id,
      2,
      0,
      MatchStage.GROUP_STAGE,
    );

    const [, homeUpdateData] = repository.update.mock.calls.find(
      ([id]) => id === homeTeam.id,
    )!;
    const [, awayUpdateData] = repository.update.mock.calls.find(
      ([id]) => id === awayTeam.id,
    )!;

    expect(homeUpdateData.eloRating).toBeGreaterThan(homeTeam.eloRating);
    expect(awayUpdateData.eloRating).toBeLessThan(awayTeam.eloRating);

    expect(repository.recordRankingHistory).toHaveBeenCalledWith(homeTeam.id, {
      eloRating: homeUpdateData.eloRating,
      fifaRanking: homeTeam.fifaRanking,
      fifaPoints: homeTeam.fifaRankingPoints,
      recordedAt: expect.any(Date),
    });
    expect(repository.recordRankingHistory).toHaveBeenCalledWith(awayTeam.id, {
      eloRating: awayUpdateData.eloRating,
      fifaRanking: awayTeam.fifaRanking,
      fifaPoints: awayTeam.fifaRankingPoints,
      recordedAt: expect.any(Date),
    });
  });
});
