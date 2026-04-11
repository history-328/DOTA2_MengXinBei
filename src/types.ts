export type Team = {
  id: string;
  name: string;
  className: string;
  isSupernova?: boolean;
  players: string[];
};

export type MatchStatus = 'pending' | 'completed';

export type Match = {
  id: string;
  team1Id: string | null;
  team2Id: string | null;
  score1: number;
  score2: number;
  status: MatchStatus;
  winnerId?: string | null;
  loserId?: string | null;
};

export type Round = {
  id: string;
  name: string;
  matches: Match[];
};

export type BracketNode = {
  id: string;
  match: Match;
  nextMatchId?: string | null;
  roundIndex: number;
  position: number; // 0 for top, 1 for bottom in the next match
};

export type TournamentData = {
  teams: Team[];
  preSeason: {
    rounds: Round[];
  };
  novaCup: {
    swissRounds: Round[];
    bracket: BracketNode[];
  };
  superNovaCup: {
    bracket: BracketNode[];
  };
};

export const initialData: TournamentData = {
  teams: [],
  preSeason: { rounds: [] },
  novaCup: { swissRounds: [], bracket: [] },
  superNovaCup: { bracket: [] }
};
