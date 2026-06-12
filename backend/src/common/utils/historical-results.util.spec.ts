import { CompetitionType, MatchStage } from '@prisma/client';
import {
  mapTournamentToCompetitionType,
  mapTournamentToMatchStage,
  parseHistoricalMatchesCsv,
} from './historical-results.util';

describe('historical-results.util', () => {
  describe('parseHistoricalMatchesCsv', () => {
    it('parsea las filas del CSV ignorando la cabecera', () => {
      const csv = [
        'date,home_team,away_team,home_score,away_score,tournament',
        '1902-07-20,Uruguay,Argentina,0,6,Friendly',
        '1930-07-30,Argentina,Uruguay,2,4,FIFA World Cup',
        '2026-03-31,Mexico,Belgium,1,1,Friendly',
      ].join('\n');

      expect(parseHistoricalMatchesCsv(csv)).toEqual([
        {
          date: '1902-07-20',
          homeTeam: 'Uruguay',
          awayTeam: 'Argentina',
          homeGoals: 0,
          awayGoals: 6,
          tournament: 'Friendly',
        },
        {
          date: '1930-07-30',
          homeTeam: 'Argentina',
          awayTeam: 'Uruguay',
          homeGoals: 2,
          awayGoals: 4,
          tournament: 'FIFA World Cup',
        },
        {
          date: '2026-03-31',
          homeTeam: 'Mexico',
          awayTeam: 'Belgium',
          homeGoals: 1,
          awayGoals: 1,
          tournament: 'Friendly',
        },
      ]);
    });
  });

  describe('mapTournamentToCompetitionType', () => {
    it('mapea "FIFA World Cup" a WORLD_CUP', () => {
      expect(mapTournamentToCompetitionType('FIFA World Cup')).toBe(
        CompetitionType.WORLD_CUP,
      );
    });

    it('mapea torneos con "qualification" a QUALIFIER', () => {
      expect(
        mapTournamentToCompetitionType('FIFA World Cup qualification'),
      ).toBe(CompetitionType.QUALIFIER);
      expect(mapTournamentToCompetitionType('UEFA Euro qualification')).toBe(
        CompetitionType.QUALIFIER,
      );
    });

    it('mapea "Friendly" a FRIENDLY', () => {
      expect(mapTournamentToCompetitionType('Friendly')).toBe(
        CompetitionType.FRIENDLY,
      );
    });

    it('mapea el resto de torneos a CONTINENTAL', () => {
      expect(mapTournamentToCompetitionType('Copa América')).toBe(
        CompetitionType.CONTINENTAL,
      );
      expect(mapTournamentToCompetitionType('UEFA Nations League')).toBe(
        CompetitionType.CONTINENTAL,
      );
    });
  });

  describe('mapTournamentToMatchStage', () => {
    it('mapea "Friendly" a FRIENDLY', () => {
      expect(mapTournamentToMatchStage('Friendly')).toBe(MatchStage.FRIENDLY);
    });

    it('mapea torneos con "qualification" a QUALIFIER', () => {
      expect(mapTournamentToMatchStage('FIFA World Cup qualification')).toBe(
        MatchStage.QUALIFIER,
      );
    });

    it('mapea el resto de torneos a GROUP_STAGE', () => {
      expect(mapTournamentToMatchStage('FIFA World Cup')).toBe(
        MatchStage.GROUP_STAGE,
      );
      expect(mapTournamentToMatchStage('Copa América')).toBe(
        MatchStage.GROUP_STAGE,
      );
    });
  });
});
