# Gemini Prompt: FootyLinks Project Reorganization

## Context

You are helping reorganize the FootyLinks project - a football connection game where users find paths between players through shared teammates, managers, and national teams.

**Repository:** `/Users/darva/Projects/sixlinks` (folder name is legacy, product is FootyLinks)

The project has existing code from a proof-of-concept phase, but we're now restructuring for a proper MVP. Some code is valuable and should be preserved, other code should be removed or refactored.

---

## Your Task

Analyze the current project structure and reorganize it to align with our MVP architecture. This includes:

1. **Audit current files** - identify what to keep, modify, or delete
2. **Create new folder structure** - aligned with modular architecture
3. **Preserve valuable code** - especially the pathfinding algorithm
4. **Remove dead code** - unused components, old experiments
5. **Set up proper configuration** - environment variables, gitignore, etc.

---

## Target Architecture

```
sixlinks/                      # (folder name legacy, product is FootyLinks)
├── .env.local                 # Environment variables (git-ignored)
├── .env.example               # Template for env vars (committed)
├── .gitignore                 # Updated to include all secrets
├── README.md                  # Project overview (update to FootyLinks)
├── ROADMAP.md                 # Product roadmap (already exists)
├── AGENT_LOG.md               # AI assistant context (already exists)
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.js
├── postcss.config.mjs
│
├── prisma/
│   ├── schema.prisma          # PostgreSQL schema (clean, no hardcoded creds)
│   └── migrations/            # Migration files
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Home/Daily Challenge
│   │   ├── globals.css
│   │   │
│   │   └── api/               # API Routes
│   │       ├── game/          # Game session management
│   │       │   ├── start/route.ts
│   │       │   ├── select/route.ts
│   │       │   └── end/route.ts
│   │       │
│   │       ├── pathfinding/   # Path calculation
│   │       │   └── route.ts   # PRESERVE existing algorithm
│   │       │
│   │       ├── search/        # Player search
│   │       │   └── route.ts
│   │       │
│   │       ├── daily/         # Daily challenge
│   │       │   └── route.ts
│   │       │
│   │       ├── leaderboard/   # Rankings
│   │       │   └── route.ts
│   │       │
│   │       └── admin/         # Admin tools (daily curation)
│   │           └── challenge/route.ts
│   │
│   ├── components/
│   │   ├── ui/                # Base UI components (buttons, cards, etc.)
│   │   ├── game/              # Game-specific components
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── OptionGrid.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── Lives.tsx
│   │   │   ├── HintButton.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── ResultSummary.tsx
│   │   │
│   │   └── layout/            # Layout components
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   │
│   ├── lib/                   # Shared utilities
│   │   ├── neo4j.ts           # Neo4j driver (PRESERVE)
│   │   ├── supabase.ts        # Supabase client
│   │   ├── scoring.ts         # Scoring algorithm
│   │   └── utils.ts           # General utilities
│   │
│   ├── hooks/                 # React hooks
│   │   ├── useGame.ts         # Game state management
│   │   ├── useTimer.ts
│   │   └── usePathfinding.ts  # PRESERVE if useful
│   │
│   ├── types/                 # TypeScript definitions
│   │   ├── game.ts            # Game-related types (PRESERVE + extend)
│   │   ├── player.ts          # Player/Team/Manager types
│   │   └── api.ts             # API request/response types
│   │
│   └── constants/             # App constants
│       ├── game.ts            # Lives, timer, scoring config
│       └── ui.ts              # UI-related constants
│
├── scripts/                   # Data & utility scripts
│   ├── data-extraction/       # Scraping scripts
│   │   ├── transfermarkt/
│   │   └── validation/
│   │
│   ├── data-sync/             # PostgreSQL → Neo4j sync
│   │   └── sync-to-neo4j.ts
│   │
│   ├── seed/                  # Database seeding
│   │   └── seed-sample-data.ts
│   │
│   └── daily/                 # Daily challenge tools
│       ├── generate-options.ts
│       └── precompute-paths.ts
│
├── data/                      # Data files (git-ignored for large files)
│   ├── raw/                   # Raw scraped data
│   ├── processed/             # Cleaned data ready for import
│   └── sample/                # Small sample data for testing
│
├── prompts/                   # Gemini/Claude prompts for reference
│
└── docs/                      # Documentation
    ├── api.md                 # API documentation
    ├── database.md            # Database schema docs
    └── game-mechanics.md      # Game rules documentation
```

---

## Files to PRESERVE (Do Not Delete)

These files contain valuable, working code:

1. **`src/app/api/neo4j-pathfind/route.ts`** → Move to `src/app/api/pathfinding/route.ts`
   - This is the core pathfinding algorithm
   - It works and should NOT be rewritten
   - Only update import paths if needed

2. **`src/lib/neo4j.ts`** → Keep in place
   - Neo4j driver singleton
   - Working correctly

3. **`src/types/game.ts`** → Keep and extend
   - Core TypeScript interfaces
   - Will need new types for game mechanics

4. **`src/hooks/usePathfinding.ts`** → Evaluate, likely keep

5. **`data-archive/manual-players.json`** → Move to `data/sample/`
   - Sample player data for testing

---

## Files to DELETE

1. **`prisma/schema.prisma`** - Contains hardcoded credentials, will recreate
2. **`DEVELOPMENT_NOTES.md`** - Superseded by ROADMAP.md and AGENT_LOG.md
3. **`project-structure.txt`** - Will be replaced by this new structure
4. **`test-neo4j-env.js`** - Old test file, will create proper tests
5. **`venv/`** - Python virtual env, not needed for Next.js project
6. **`reports/`** - Old reports, archive or delete

---

## Files to CREATE

### 1. `.env.example`
```
# Neo4j Aura
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_SECRET=

# Database (Prisma)
DATABASE_URL=postgresql://postgres:xxxxx@db.xxxxx.supabase.co:5432/postgres
```

### 2. New `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ CORE ENTITIES ============

model Player {
  id          Int       @id @default(autoincrement())
  name        String    // Display name (e.g., "Ronaldo", "Messi")
  fullName    String?   @map("full_name")
  nationality String
  position    String?
  birthDate   DateTime? @map("birth_date")
  photoUrl    String?   @map("photo_url")
  
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relationships
  clubStints      ClubStint[]
  nationalTeamCaps NationalTeamCap[]
  
  @@index([name])
  @@index([nationality])
  @@map("players")
}

model Club {
  id          Int      @id @default(autoincrement())
  name        String
  country     String
  league      String?
  logoUrl     String?  @map("logo_url")
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relationships
  playerStints  ClubStint[]
  managerStints ManagerClubStint[]

  @@unique([name, country])
  @@map("clubs")
}

model Manager {
  id          Int       @id @default(autoincrement())
  name        String
  fullName    String?   @map("full_name")
  nationality String
  birthDate   DateTime? @map("birth_date")
  photoUrl    String?   @map("photo_url")
  
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relationships
  clubStints ManagerClubStint[]

  @@index([name])
  @@map("managers")
}

model NationalTeam {
  id          Int      @id @default(autoincrement())
  name        String   @unique // e.g., "England", "Brazil"
  fifaCode    String?  @map("fifa_code") // e.g., "ENG", "BRA"
  confederation String? // e.g., "UEFA", "CONMEBOL"
  flagUrl     String?  @map("flag_url")
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relationships
  caps NationalTeamCap[]

  @@map("national_teams")
}

// ============ RELATIONSHIPS ============

model ClubStint {
  id        Int       @id @default(autoincrement())
  playerId  Int       @map("player_id")
  clubId    Int       @map("club_id")
  startDate DateTime  @map("start_date")
  endDate   DateTime? @map("end_date") // null = current
  isLoan    Boolean   @default(false) @map("is_loan")
  
  createdAt DateTime  @default(now()) @map("created_at")

  player Player @relation(fields: [playerId], references: [id], onDelete: Cascade)
  club   Club   @relation(fields: [clubId], references: [id], onDelete: Cascade)

  @@index([playerId])
  @@index([clubId])
  @@index([startDate, endDate])
  @@map("club_stints")
}

model ManagerClubStint {
  id        Int       @id @default(autoincrement())
  managerId Int       @map("manager_id")
  clubId    Int       @map("club_id")
  startDate DateTime  @map("start_date")
  endDate   DateTime? @map("end_date")
  
  createdAt DateTime  @default(now()) @map("created_at")

  manager Manager @relation(fields: [managerId], references: [id], onDelete: Cascade)
  club    Club    @relation(fields: [clubId], references: [id], onDelete: Cascade)

  @@index([managerId])
  @@index([clubId])
  @@map("manager_club_stints")
}

model NationalTeamCap {
  id             Int      @id @default(autoincrement())
  playerId       Int      @map("player_id")
  nationalTeamId Int      @map("national_team_id")
  matchDate      DateTime @map("match_date")
  competition    String?  // e.g., "World Cup", "Euro Qualifiers"
  
  createdAt      DateTime @default(now()) @map("created_at")

  player       Player       @relation(fields: [playerId], references: [id], onDelete: Cascade)
  nationalTeam NationalTeam @relation(fields: [nationalTeamId], references: [id], onDelete: Cascade)

  @@unique([playerId, nationalTeamId, matchDate])
  @@index([playerId])
  @@index([nationalTeamId])
  @@index([matchDate])
  @@map("national_team_caps")
}

// ============ GAME ENTITIES ============

model DailyChallenge {
  id            Int      @id @default(autoincrement())
  date          DateTime @unique @db.Date
  startPlayerId Int      @map("start_player_id")
  endPlayerId   Int      @map("end_player_id")
  optimalPath   Json     @map("optimal_path") // Pre-computed optimal path
  optimalSteps  Int      @map("optimal_steps")
  difficulty    String?  // "easy", "medium", "hard"
  theme         String?  // "El Clasico", "Premier League", etc.
  
  createdAt     DateTime @default(now()) @map("created_at")

  // Relationships
  sessions GameSession[]

  @@map("daily_challenges")
}

model GameSession {
  id               String    @id @default(uuid())
  
  // Challenge info
  dailyChallengeId Int?      @map("daily_challenge_id")
  startPlayerId    Int       @map("start_player_id")
  endPlayerId      Int       @map("end_player_id")
  
  // User info (nickname for MVP, user_id for future)
  nickname         String?
  
  // Game state
  status           String    @default("in_progress") // "in_progress", "completed", "abandoned"
  pathTaken        Json      @default("[]") @map("path_taken")
  currentStep      Int       @default(0) @map("current_step")
  livesRemaining   Int       @default(3) @map("lives_remaining")
  hintsUsed        Int       @default(0) @map("hints_used")
  
  // Results
  totalSteps       Int?      @map("total_steps")
  isOptimalPath    Boolean?  @map("is_optimal_path")
  timeSeconds      Int?      @map("time_seconds")
  score            Int?
  
  // Timestamps
  startedAt        DateTime  @default(now()) @map("started_at")
  completedAt      DateTime? @map("completed_at")

  dailyChallenge DailyChallenge? @relation(fields: [dailyChallengeId], references: [id])

  @@index([dailyChallengeId])
  @@index([nickname])
  @@index([score])
  @@map("game_sessions")
}

// ============ LEADERBOARD VIEW ============
// Note: Create as a database view for performance

// CREATE VIEW daily_leaderboard AS
// SELECT 
//   gs.nickname,
//   gs.score,
//   gs.total_steps,
//   gs.time_seconds,
//   gs.is_optimal_path,
//   gs.lives_remaining,
//   dc.date as challenge_date
// FROM game_sessions gs
// JOIN daily_challenges dc ON gs.daily_challenge_id = dc.id
// WHERE gs.status = 'completed'
// ORDER BY dc.date DESC, gs.score DESC;
```

### 3. `src/constants/game.ts`
```typescript
export const GAME_CONFIG = {
  // Lives
  INITIAL_LIVES: 3,
  
  // Timer (in seconds)
  TIMER_DURATION: 120, // 2 minutes
  
  // Hints
  MAX_HINTS: 2,
  HINT_TIME_PENALTY: 10, // seconds
  
  // Options
  OPTIONS_PER_STEP: 4,
  
  // Scoring
  BASE_SCORE: 1000,
  PENALTY_PER_EXTRA_STEP: 100,
  PENALTY_PER_LIFE_LOST: 150,
  PENALTY_PER_HINT: 50,
  TIME_BONUS_THRESHOLD: 60, // seconds - bonus if completed under this
  TIME_BONUS_AMOUNT: 100,
  
  // Path limits
  MAX_PATH_LENGTH: 6, // Six degrees
} as const;

export type GameConfig = typeof GAME_CONFIG;
```

### 4. `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations requiring elevated privileges
export function getSupabaseAdmin() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_SECRET!;
  return createClient(supabaseUrl, supabaseServiceKey);
}
```

### 5. Updated `README.md`
```markdown
# FootyLinks

A football connection game where players find the path between two footballers through shared teammates, managers, and national teams.

**Domain:** [footylinks.app](https://footylinks.app)

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

## Documentation

- [ROADMAP.md](./ROADMAP.md) - Product roadmap and architecture
- [AGENT_LOG.md](./AGENT_LOG.md) - Development log and AI assistant context
- [docs/](./docs/) - Additional documentation

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Databases:** PostgreSQL (Supabase), Neo4j (Aura)

## MVP Target

End of January 2026

## License

Private - All rights reserved
```

---

## Execution Steps

1. **First, read and understand:**
   - `ROADMAP.md`
   - `AGENT_LOG.md`
   - Current project structure

2. **Create backup:**
   ```bash
   cp -r /Users/darva/Projects/sixlinks /Users/darva/Projects/sixlinks-backup-$(date +%Y%m%d)
   ```

3. **Create new folder structure** (empty folders first)

4. **Move preserved files** to their new locations

5. **Delete deprecated files**

6. **Create new files** as specified above

7. **Update imports** in preserved files to match new paths

8. **Update `.gitignore`** to include:
   ```
   .env.local
   .env
   node_modules/
   .next/
   data/raw/
   data/processed/
   *.log
   ```

9. **Test that project still builds:**
   ```bash
   npm install
   npm run build
   ```

10. **Document changes** in AGENT_LOG.md

---

## Important Notes

- **DO NOT** recreate the pathfinding algorithm - just move it
- **DO NOT** delete ROADMAP.md or AGENT_LOG.md
- **ASK** before deleting anything not explicitly listed
- **PRESERVE** the Git history - don't delete .git folder
- After reorganization, the project may not run (missing credentials) - that's expected
- **USE "FootyLinks"** as the product name in all documentation and comments

---

## Output Expected

After completing this task, provide:

1. List of all files moved/renamed
2. List of all files deleted
3. List of all files created
4. Any issues encountered
5. Updated section for AGENT_LOG.md documenting this work
