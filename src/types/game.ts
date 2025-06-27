// This file is the single source of truth for your game's data structures.

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
    period?: string;
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
  error?: string;
  message?: string;
}