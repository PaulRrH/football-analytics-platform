import { Test, TestingModule } from '@nestjs/testing';
import { Confederation, MatchStage } from '@prisma/client';
import {
  DASHBOARD_REPOSITORY,
  type DashboardMatchInfo,
  type DashboardTeamInfo,
  type IDashboardRepository,
  type RankedTeam,
} from '../../domain/dashboard-repository.interface';
import {
  DashboardService,
  DASHBOARD_RECENT_LIMIT,
  DASHBOARD_TOP_TEAMS_LIMIT,
} from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let repository: jest.Mocked<IDashboardRepository>;

  const teamRef = (id: string) => ({
    id,
    name: `Team ${id}`,
    shortName: id.toUpperCase(),
    logoUrl: null,
  });

  const buildTeamInfo = (id: string): DashboardTeamInfo => ({
    ...teamRef(id),
    eloRating: 1700,
    fifaRanking: 1,
  });

  const buildMatchInfo = (id: string): DashboardMatchInfo => ({
    id,
    matchDate: new Date('2026-06-01'),
    stage: MatchStage.GROUP_STAGE,
    homeGoals: null,
    awayGoals: null,
    homeTeam: teamRef('home'),
    awayTeam: teamRef('away'),
    competition: { id: 'comp-1', name: 'World Cup 2026' },
  });

  const buildRankedTeam = (id: string, eloRating: number): RankedTeam => ({
    ...buildTeamInfo(id),
    eloRating,
    confederation: Confederation.UEFA,
  });

  beforeEach(async () => {
    repository = {
      getCounts: jest.fn(),
      getMatchesByStatus: jest.fn(),
      findTopTeamsByElo: jest.fn(),
      findUpcomingMatches: jest.fn(),
      findRecentResults: jest.fn(),
      findRankedTeams: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: DASHBOARD_REPOSITORY, useValue: repository },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getSummary', () => {
    it('combina counts, matchesByStatus, topTeams, upcomingMatches y recentResults', async () => {
      repository.getCounts.mockResolvedValue({
        teams: 18,
        competitions: 44,
        matches: 2465,
        predictions: 3,
        simulations: 1,
      });
      repository.getMatchesByStatus.mockResolvedValue({
        scheduled: 10,
        live: 0,
        finished: 2455,
        postponed: 0,
        cancelled: 0,
      });
      repository.findTopTeamsByElo.mockResolvedValue([buildTeamInfo('arg')]);
      repository.findUpcomingMatches.mockResolvedValue([
        buildMatchInfo('match-1'),
      ]);
      repository.findRecentResults.mockResolvedValue([
        buildMatchInfo('match-2'),
      ]);

      const result = await service.getSummary();

      expect(repository.findTopTeamsByElo).toHaveBeenCalledWith(
        DASHBOARD_TOP_TEAMS_LIMIT,
      );
      expect(repository.findUpcomingMatches).toHaveBeenCalledWith(
        DASHBOARD_RECENT_LIMIT,
      );
      expect(repository.findRecentResults).toHaveBeenCalledWith(
        DASHBOARD_RECENT_LIMIT,
      );

      expect(result.counts).toEqual({
        teams: 18,
        competitions: 44,
        matches: 2465,
        predictions: 3,
        simulations: 1,
      });
      expect(result.matchesByStatus).toEqual({
        scheduled: 10,
        live: 0,
        finished: 2455,
        postponed: 0,
        cancelled: 0,
      });
      expect(result.topTeams).toHaveLength(1);
      expect(result.topTeams[0].id).toBe('arg');
      expect(result.upcomingMatches).toHaveLength(1);
      expect(result.upcomingMatches[0].id).toBe('match-1');
      expect(result.upcomingMatches[0].homeTeam.id).toBe('home');
      expect(result.upcomingMatches[0].competition.name).toBe('World Cup 2026');
      expect(result.recentResults).toHaveLength(1);
      expect(result.recentResults[0].id).toBe('match-2');
    });
  });

  describe('getRankings', () => {
    it('asigna rank a partir de page/limit', async () => {
      const data = Array.from({ length: 10 }, (_, i) =>
        buildRankedTeam(`team-${i}`, 2000 - i),
      );
      repository.findRankedTeams.mockResolvedValue({ data, total: 30 });

      const result = await service.getRankings({ page: 2, limit: 10 });

      expect(repository.findRankedTeams).toHaveBeenCalledWith(10, 10);
      expect(result.data).toHaveLength(10);
      expect(result.data.map((r) => r.rank)).toEqual(
        Array.from({ length: 10 }, (_, i) => i + 11),
      );
      expect(result.meta).toEqual({
        total: 30,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
    });

    it('usa page=1 y limit=10 por defecto', async () => {
      repository.findRankedTeams.mockResolvedValue({
        data: [buildRankedTeam('team-0', 2000)],
        total: 1,
      });

      const result = await service.getRankings({});

      expect(repository.findRankedTeams).toHaveBeenCalledWith(0, 10);
      expect(result.data[0].rank).toBe(1);
    });
  });
});
