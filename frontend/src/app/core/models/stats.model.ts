export type MatchResult = 'W' | 'D' | 'L';

export interface StatsTeam {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
}

export interface TeamFormMatch {
  id: string;
  matchDate: string;
  competitionName: string;
  opponent: StatsTeam;
  isHome: boolean;
  goalsFor: number;
  goalsAgainst: number;
  result: MatchResult;
}

export interface TeamForm {
  team: StatsTeam;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: MatchResult[];
  recentMatches: TeamFormMatch[];
}

export interface HeadToHeadMatch {
  id: string;
  matchDate: string;
  competitionName: string;
  homeTeam: StatsTeam;
  awayTeam: StatsTeam;
  homeGoals: number;
  awayGoals: number;
}

export interface HeadToHead {
  teamA: StatsTeam;
  teamB: StatsTeam;
  totalMatches: number;
  teamAWins: number;
  teamBWins: number;
  draws: number;
  teamAGoals: number;
  teamBGoals: number;
  matches: HeadToHeadMatch[];
}
