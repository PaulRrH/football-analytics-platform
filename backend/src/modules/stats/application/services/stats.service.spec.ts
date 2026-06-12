import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  IStatsRepository,
  STATS_REPOSITORY,
  StatsMatchResult,
  StatsTeamInfo,
} from '../../domain/stats-repository.interface';
import { StatsService } from './stats.service';

describe('StatsService', () => {
  let service: StatsService;
  let repository: jest.Mocked<IStatsRepository>;

  const team1: StatsTeamInfo = {
    id: 'team-1',
    name: 'Team One',
    shortName: 'TM1',
    logoUrl: null,
  };
  const team2: StatsTeamInfo = {
    id: 'team-2',
    name: 'Team Two',
    shortName: 'TM2',
    logoUrl: null,
  };
  const team3: StatsTeamInfo = {
    id: 'team-3',
    name: 'Team Three',
    shortName: 'TM3',
    logoUrl: null,
  };
  const team4: StatsTeamInfo = {
    id: 'team-4',
    name: 'Team Four',
    shortName: 'TM4',
    logoUrl: null,
  };

  beforeEach(async () => {
    repository = {
      findTeamInfo: jest.fn(),
      findRecentFinishedMatches: jest.fn(),
      findHeadToHeadMatches: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: STATS_REPOSITORY, useValue: repository },
      ],
    }).compile();

    service = module.get(StatsService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getTeamForm', () => {
    it('lanza NotFoundException si el equipo no existe', async () => {
      repository.findTeamInfo.mockResolvedValue(null);

      await expect(service.getTeamForm('missing-team', 5)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findRecentFinishedMatches).not.toHaveBeenCalled();
    });

    it('calcula la forma reciente a partir de los partidos finalizados', async () => {
      repository.findTeamInfo.mockResolvedValue(team1);

      const matches: StatsMatchResult[] = [
        {
          id: 'match-1',
          matchDate: new Date('2026-06-03'),
          competitionName: 'Friendlies',
          homeTeamId: team1.id,
          awayTeamId: team2.id,
          homeGoals: 2,
          awayGoals: 1,
          homeTeam: team1,
          awayTeam: team2,
        },
        {
          id: 'match-2',
          matchDate: new Date('2026-06-02'),
          competitionName: 'Friendlies',
          homeTeamId: team3.id,
          awayTeamId: team1.id,
          homeGoals: 0,
          awayGoals: 0,
          homeTeam: team3,
          awayTeam: team1,
        },
        {
          id: 'match-3',
          matchDate: new Date('2026-06-01'),
          competitionName: 'Friendlies',
          homeTeamId: team1.id,
          awayTeamId: team4.id,
          homeGoals: 1,
          awayGoals: 2,
          homeTeam: team1,
          awayTeam: team4,
        },
      ];
      repository.findRecentFinishedMatches.mockResolvedValue(matches);

      const result = await service.getTeamForm(team1.id, 5);

      expect(repository.findRecentFinishedMatches).toHaveBeenCalledWith(
        team1.id,
        5,
      );
      expect(result.team).toEqual(team1);
      expect(result.matchesPlayed).toBe(3);
      expect(result.wins).toBe(1);
      expect(result.draws).toBe(1);
      expect(result.losses).toBe(1);
      expect(result.goalsFor).toBe(3);
      expect(result.goalsAgainst).toBe(3);
      expect(result.points).toBe(4);

      expect(result.recentMatches).toHaveLength(3);
      expect(result.recentMatches[0]).toMatchObject({
        id: 'match-1',
        opponent: team2,
        isHome: true,
        goalsFor: 2,
        goalsAgainst: 1,
        result: 'W',
      });
      expect(result.recentMatches[1]).toMatchObject({
        id: 'match-2',
        opponent: team3,
        isHome: false,
        goalsFor: 0,
        goalsAgainst: 0,
        result: 'D',
      });
      expect(result.recentMatches[2]).toMatchObject({
        id: 'match-3',
        opponent: team4,
        isHome: true,
        goalsFor: 1,
        goalsAgainst: 2,
        result: 'L',
      });

      expect(result.form).toEqual(['L', 'D', 'W']);
    });

    it('devuelve valores en cero cuando el equipo no tiene partidos finalizados', async () => {
      repository.findTeamInfo.mockResolvedValue(team1);
      repository.findRecentFinishedMatches.mockResolvedValue([]);

      const result = await service.getTeamForm(team1.id, 5);

      expect(result.matchesPlayed).toBe(0);
      expect(result.wins).toBe(0);
      expect(result.draws).toBe(0);
      expect(result.losses).toBe(0);
      expect(result.goalsFor).toBe(0);
      expect(result.goalsAgainst).toBe(0);
      expect(result.points).toBe(0);
      expect(result.form).toEqual([]);
      expect(result.recentMatches).toEqual([]);
    });
  });

  describe('getHeadToHead', () => {
    it('lanza BadRequestException si los dos equipos son el mismo', async () => {
      await expect(service.getHeadToHead(team1.id, team1.id)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.findTeamInfo).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si alguno de los equipos no existe', async () => {
      repository.findTeamInfo.mockImplementation((id) =>
        Promise.resolve(id === team1.id ? team1 : null),
      );

      await expect(service.getHeadToHead(team1.id, team2.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calcula los agregados del historial de enfrentamientos', async () => {
      repository.findTeamInfo.mockImplementation((id) => {
        if (id === team1.id) return Promise.resolve(team1);
        if (id === team2.id) return Promise.resolve(team2);
        return Promise.resolve(null);
      });

      const matches: StatsMatchResult[] = [
        {
          id: 'match-1',
          matchDate: new Date('2026-06-03'),
          competitionName: 'Friendlies',
          homeTeamId: team1.id,
          awayTeamId: team2.id,
          homeGoals: 2,
          awayGoals: 1,
          homeTeam: team1,
          awayTeam: team2,
        },
        {
          id: 'match-2',
          matchDate: new Date('2026-06-02'),
          competitionName: 'Friendlies',
          homeTeamId: team2.id,
          awayTeamId: team1.id,
          homeGoals: 1,
          awayGoals: 1,
          homeTeam: team2,
          awayTeam: team1,
        },
        {
          id: 'match-3',
          matchDate: new Date('2026-06-01'),
          competitionName: 'Friendlies',
          homeTeamId: team1.id,
          awayTeamId: team2.id,
          homeGoals: 0,
          awayGoals: 3,
          homeTeam: team1,
          awayTeam: team2,
        },
      ];
      repository.findHeadToHeadMatches.mockResolvedValue(matches);

      const result = await service.getHeadToHead(team1.id, team2.id);

      expect(repository.findHeadToHeadMatches).toHaveBeenCalledWith(
        team1.id,
        team2.id,
      );
      expect(result.teamA).toEqual(team1);
      expect(result.teamB).toEqual(team2);
      expect(result.totalMatches).toBe(3);
      expect(result.teamAWins).toBe(1);
      expect(result.teamBWins).toBe(1);
      expect(result.draws).toBe(1);
      expect(result.teamAGoals).toBe(3);
      expect(result.teamBGoals).toBe(5);
      expect(result.matches).toHaveLength(3);
    });

    it('devuelve valores en cero cuando no hay enfrentamientos previos', async () => {
      repository.findTeamInfo.mockImplementation((id) => {
        if (id === team1.id) return Promise.resolve(team1);
        if (id === team2.id) return Promise.resolve(team2);
        return Promise.resolve(null);
      });
      repository.findHeadToHeadMatches.mockResolvedValue([]);

      const result = await service.getHeadToHead(team1.id, team2.id);

      expect(result.totalMatches).toBe(0);
      expect(result.teamAWins).toBe(0);
      expect(result.teamBWins).toBe(0);
      expect(result.draws).toBe(0);
      expect(result.teamAGoals).toBe(0);
      expect(result.teamBGoals).toBe(0);
      expect(result.matches).toEqual([]);
    });
  });
});
