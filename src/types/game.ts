export interface Person {
  id: number;
  name: string;
  fullName?: string;
  nationality?: string;
  primaryPosition?: string;
  photoUrl?: string;
  isRetired?: boolean;
}

export interface PathStep {
  from: {
    id: number;
    name: string;
    type: 'person';
    nationality?: string;
    position?: string; // Using 'position' for primaryPosition from Person
  };
  to: {
    id: number;
    name: string;
    type: 'person';
    nationality?: string;
    position?: string; // Using 'position' for primaryPosition from Person
  };
  connection: {
    type: 'club_teammates' | 'national_teammates' | 'player_manager_club' | 'player_manager_national' | 'co_managers_club' | 'co_managers_national';
    description: string;
    venue?: string; // Club or NationalTeam name
    period?: string;
  };
}

export interface GameResult {
  found: boolean;
  path: PathStep[];
  totalSteps: number;
  searchTime: number;
  score: number;
  startPerson: Person;
  endPerson: Person;
  message?: string;
}
