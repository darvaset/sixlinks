export interface Player {
  id: number;
  name: string;
  fullName?: string;
  nationality?: string;
  position?: string;
  currentTeam?: {
    name: string;
    country?: string;
    league?: string;
  };
}

export interface PathStep {
  from: {
    id: number;
    name: string;
    type: 'player' | 'manager';
    nationality?: string;
    position?: string;
  };
  to: {
    id: number;
    name: string;
    type: 'player' | 'manager';
    nationality?: string;
    position?: string;
  };
  connection: {
    type: 'teammate' | 'manager' | 'national_team';
    description: string;
    team?: string;
    period?: string; // Can be "current", date range like "2017-2019", or descriptive like "from 2015 to 2018"
  };
}

export interface GameResult {
  found: boolean;
  path: PathStep[];
  totalSteps: number;
  searchTime: number;
  score: number;
  startPlayer: Player;
  endPlayer: Player;
}