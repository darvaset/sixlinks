# Gemini Task: Update Neo4j Pathfinding for Schema v3

## Context

We've redesigned the FootyLinks database schema. The key changes are:

1. **`Player` and `Manager` are now unified as `Person`** - A single entity that can have both playing and managing stints
2. **New relationship types:**
   - `ClubPlayerStint` - Person played for a club
   - `ClubManagerStint` - Person managed a club  
   - `NationalTeamPlayerStint` - Person represented a national team (with firstCap/lastCap instead of individual caps)
   - `NationalTeamManagerStint` - Person managed a national team
3. **Connection types for pathfinding:**
   - Teammates at club (two persons with overlapping ClubPlayerStints at same club)
   - Teammates at national team (two persons with overlapping NationalTeamPlayerStints)
   - Player under manager at club (Person's ClubPlayerStint overlaps with another Person's ClubManagerStint at same club)
   - Player under manager at national team (NationalTeamPlayerStint overlaps with NationalTeamManagerStint)
   - Managers at same club (two persons with overlapping ClubManagerStints)
   - Managers at same national team (two persons with overlapping NationalTeamManagerStints)

## Your Tasks

### Task 1: Update Neo4j Schema Documentation

Create a file `docs/NEO4J_SCHEMA.md` that documents:

```markdown
# Neo4j Graph Schema for FootyLinks

## Nodes

### Person
Properties synced from PostgreSQL `persons` table:
- id (Int) - Primary key, matches PostgreSQL
- name (String)
- fullName (String, optional)
- nationality (String)
- primaryPosition (String, optional)
- photoUrl (String, optional)
- isRetired (Boolean)

### Club
Properties synced from PostgreSQL `clubs` table:
- id (Int)
- name (String)
- shortName (String, optional)
- country (String)
- currentLeague (String, optional)
- logoUrl (String, optional)

### NationalTeam
Properties synced from PostgreSQL `national_teams` table:
- id (Int)
- name (String)
- fifaCode (String, optional)
- confederation (String, optional)
- flagUrl (String, optional)

## Relationships

### PLAYED_FOR
`(Person)-[:PLAYED_FOR]->(Club)`
- startDate (DateTime)
- endDate (DateTime, optional)
- position (String, optional)
- isLoan (Boolean)

### MANAGED
`(Person)-[:MANAGED]->(Club)`
- startDate (DateTime)
- endDate (DateTime, optional)
- role (String) - "manager", "assistant", etc.

### REPRESENTED
`(Person)-[:REPRESENTED]->(NationalTeam)`
- firstCap (DateTime)
- lastCap (DateTime, optional)
- totalCaps (Int, optional)

### MANAGED_NT
`(Person)-[:MANAGED_NT]->(NationalTeam)`
- startDate (DateTime)
- endDate (DateTime, optional)
- role (String)

## Pathfinding Logic

Two persons are connected if:
1. They both PLAYED_FOR the same Club with overlapping dates
2. They both REPRESENTED the same NationalTeam with overlapping caps
3. One PLAYED_FOR a Club while the other MANAGED the same Club (overlapping dates)
4. One REPRESENTED a NationalTeam while the other MANAGED_NT the same team (overlapping dates)
5. They both MANAGED the same Club with overlapping dates
6. They both MANAGED_NT the same NationalTeam with overlapping dates
```

### Task 2: Update the Pathfinding Route

Modify `src/app/api/pathfinding/route.ts` to handle the new schema:

**Key changes needed:**

1. Change all references from `Player` to `Person`
2. Update the Cypher queries to handle all 6 connection types
3. Update the 1-step query to check for:
   - Same Club via PLAYED_FOR (teammates)
   - Same Club via PLAYED_FOR + MANAGED (player-manager)
   - Same Club via MANAGED (co-managers)
   - Same NationalTeam via REPRESENTED
   - Same NationalTeam via REPRESENTED + MANAGED_NT
   - Same NationalTeam via MANAGED_NT
4. Update connection descriptions to be more specific:
   - "X and Y were teammates at Club (2010-2015)"
   - "X played under manager Y at Club (2012-2014)"
   - "X and Y both represented Argentina (2008-2020)"
   - "X played for Argentina under manager Y (2018-2022)"

**Important:** The `shortestPath` query should work automatically since it traverses all relationship types. The main work is in:
- The 1-step optimized query (needs to check all 6 connection types)
- The description generation (needs to identify which type of connection)

### Task 3: Create Neo4j Sync Utility

Create `src/lib/neo4j-sync.ts` with functions to sync data from PostgreSQL to Neo4j:

```typescript
// Functions needed:
export async function syncPersonToNeo4j(personId: number): Promise<void>
export async function syncClubToNeo4j(clubId: number): Promise<void>
export async function syncNationalTeamToNeo4j(teamId: number): Promise<void>
export async function syncAllToNeo4j(): Promise<SyncResult>
export async function clearNeo4jDatabase(): Promise<void>

// The sync should:
// 1. Read from PostgreSQL using Prisma
// 2. Create/update nodes in Neo4j
// 3. Create relationships based on stint tables
// 4. Handle soft-deleted records (don't sync if deletedAt is set)
```

### Task 4: Update Type Definitions

Update `src/types/game.ts` to reflect the new schema:

```typescript
// Change Player to Person
export interface Person {
  id: number;
  name: string;
  fullName?: string;
  nationality?: string;
  primaryPosition?: string;
  photoUrl?: string;
  isRetired?: boolean;
}

// Update PathStep to handle all connection types
export interface PathStep {
  from: {
    id: number;
    name: string;
    type: 'person'; // Simplified from 'player' | 'manager'
    nationality?: string;
    position?: string;
  };
  to: {
    id: number;
    name: string;
    type: 'person';
    nationality?: string;
    position?: string;
  };
  connection: {
    type: 'club_teammates' | 'national_teammates' | 'player_manager_club' | 'player_manager_national' | 'co_managers_club' | 'co_managers_national';
    description: string;
    venue?: string; // Club or NationalTeam name
    period?: string;
  };
}

// Update GameResult
export interface GameResult {
  found: boolean;
  path: PathStep[];
  totalSteps: number;
  searchTime: number;
  score: number;
  startPerson: Person;
  endPerson: Person;
}
```

### Task 5: Update UI Components

Update any components that reference `Player` to use `Person`:
- `src/components/game/PlayerSearch.tsx` → Consider renaming to `PersonSearch.tsx`
- `src/components/game/PlayerCard.tsx` → Consider renaming to `PersonCard.tsx`
- Update prop types and variable names
- The search should work for both players and managers

## Testing Plan

After implementation:

1. Run `npx prisma db push` to update the PostgreSQL schema
2. Manually insert test data (at least 5 persons with various stints)
3. Run the Neo4j sync
4. Test pathfinding with different connection types:
   - Two players who were teammates
   - A player and their former manager
   - Two managers who managed the same club
   - International teammates
   - Player who played under a national team manager

## Files to Create/Modify

| File | Action |
|------|--------|
| `docs/NEO4J_SCHEMA.md` | CREATE |
| `src/lib/neo4j-sync.ts` | CREATE |
| `src/app/api/pathfinding/route.ts` | MODIFY |
| `src/types/game.ts` | MODIFY |
| `src/components/game/PlayerSearch.tsx` | MODIFY (rename to PersonSearch.tsx) |
| `src/components/game/PlayerCard.tsx` | MODIFY (rename to PersonCard.tsx) |
| `src/app/page.tsx` | MODIFY (update references) |

## DO NOT MODIFY

- `prisma/schema.prisma` - Already updated
- `src/lib/neo4j.ts` - Driver config is correct
- Database credentials in `.env`

## Constraints

- Keep backward compatibility where possible
- Use TypeScript strict mode
- Add JSDoc comments to new functions
- Handle errors gracefully with meaningful messages
- Log sync progress for debugging
