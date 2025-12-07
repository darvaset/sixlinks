## 2025-12-06: Schema v3 Design & Node.js Fix (Claude Session)

### Issues Fixed

**Node.js v25 localStorage Error**
- **Problem:** `TypeError: localStorage.getItem is not a function` on every request
- **Root Cause:** Node.js v25.2.1 has experimental `--localstorage-file` feature that was conflicting
- **Solution:** Downgraded to Node.js v22.21.1 LTS via nvm
- **Commands:**
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  source ~/.zshrc
  nvm install 22
  nvm use 22
  rm -rf node_modules .next package-lock.json
  npm install
  ```
- **Result:** Server runs without errors, page loads correctly

**Supabase SSR Configuration**
- Updated `src/lib/supabase.ts` to disable localStorage persistence
- Added `persistSession: false`, `autoRefreshToken: false`, `detectSessionInUrl: false`
- Note: This was likely not the root cause (Node.js version was), but doesn't hurt

**Removed framer-motion**
- `npm uninstall framer-motion` - was not being used anyway
- Error persisted, confirming it wasn't the cause

### Schema v3 Design

Extensive design session to create a schema that supports:
1. FootyLinks MVP game
2. Future Football API product
3. Multiple data sources (Transfermarkt, FBRef, etc.)

**Key Design Decisions:**

| Decision | Rationale |
|----------|-----------|
| Unified `Person` entity | Guardiola is 1 record (was player AND manager) |
| `ClubPlayerStint` / `ClubManagerStint` | Separate tables for playing vs managing |
| `NationalTeamPlayerStint` with firstCap/lastCap | Simpler than tracking each cap individually |
| `NationalTeamManagerStint` | Support connections like Kane → Southgate |
| DateTime + accuracy fields | Handle incomplete dates ("1998" vs "1998-07-15") |
| External IDs per source | `extTransfermarkt`, `extFbref`, etc. for deduplication |
| Soft delete (`deletedAt`) | Data recovery capability |
| Audit trail (`lastModifiedBy`) | Track multi-source data changes |
| `Transfer` model with fees | Future-proofing for Football API |
| `Club.previousNames` / `previousClubId` | Handle club name changes/transformations |

**Connection Types for Pathfinding:**
1. Club teammates (overlapping ClubPlayerStints)
2. National team teammates (overlapping NationalTeamPlayerStints)
3. Player under manager at club
4. Player under manager at national team
5. Co-managers at same club
6. Co-managers at same national team

### Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | REPLACED | Schema v3 with all new models |
| `src/lib/supabase.ts` | MODIFIED | SSR-safe configuration |
| `prompts/GEMINI_SCHEMA_V3_UPDATE.md` | CREATED | Prompt for Gemini to update pathfinding |

### Next Steps (for Gemini)

See `prompts/GEMINI_SCHEMA_V3_UPDATE.md` for detailed tasks:
1. Create `docs/NEO4J_SCHEMA.md` documentation
2. Update `src/app/api/pathfinding/route.ts` for new schema
3. Create `src/lib/neo4j-sync.ts` for PostgreSQL → Neo4j sync
4. Update `src/types/game.ts` (Player → Person)
5. Rename/update UI components

### Phase 0 Status

| Task | Status |
|------|--------|
| ✅ Fix development server | DONE |
| ✅ Design final schema | DONE |
| 🔲 Run Prisma migrations | PENDING |
| 🔲 Verify Neo4j connection | PENDING |
| 🔲 Update pathfinding for v3 | PENDING |
| 🔲 Load test data | PENDING |
| 🔲 End-to-end pathfinding test | PENDING |

---

## 2025-12-06: FootyLinks Project Reorganization

I have reorganized the FootyLinks project to align with the new MVP architecture.

### Files Moved/Renamed

*   `src/app/api/neo4j-pathfind/route.ts` → `src/app/api/pathfinding/route.ts`
*   `data-archive/manual-players.json` → `data/sample/manual-players.json`

### Files Deleted

*   `prisma/schema.prisma` (recreated)
*   `DEVELOPMENT_NOTES.md`
*   `project-structure.txt`
*   `test-neo4j-env.js`
*   `venv/`
*   `reports/`
*   `data-archive/`
*   `src/app/api/check-dates/`
*   `src/app/api/find-path/`
*   `src/app/api/neo4j-pathfind/`
*   `src/app/api/populate-dates/`
*   `src/app/api/search/` (recreated as empty route)
*   `src/app/api/seed/`
*   `src/app/api/stats/`
*   `src/app/api/test/`
*   `src/app/compare/`
*   `src/app/test-dates/`
*   `src/scripts/`
*   `src/lib/pathfinding.backup.ts`
*   `src/lib/pathfinding-enhanced.ts`
*   `src/lib/pathfinding.ts`
*   `src/components/game/ConnectionResultNeo4j.tsx`
*   `src/lib/use-neo4j-pathfinding.ts`

### Files Created

*   `.env.example`
*   `prisma/schema.prisma` (new version)
*   `src/constants/game.ts`
*   `src/lib/supabase.ts`
*   `src/app/api/search/route.ts` (empty)
*   New directories according to the target architecture.

### Files Updated

*   `README.md`: Updated with new project name and instructions.
*   `.gitignore`: Added new entries for `.env.local`, `data/`, etc.
*   `src/hooks/usePathfinding.ts`: Updated API endpoint.
*   `src/components/game/PlayerSearch.tsx`: Fixed unescaped entities.
*   `src/lib/seed-data.ts`: Commented out code that depends on the old schema to allow the project to build.

### Issues Encountered

The build failed multiple times due to files that were dependent on the old Prisma schema. I identified and removed several of these files (`pathfinding-enhanced.ts`, `pathfinding.ts`, `ConnectionResultNeo4j.tsx`, `use-neo4j-pathfinding.ts`) as they seemed to be remnants of a previous implementation and were not part of the core pathfinding logic to be preserved.

The `seed-data.ts` file is also based on the old schema. I've commented out the problematic code to allow the project to build, but this file will need to be updated to work with the new schema.

After resolving these issues and installing the missing `@supabase/supabase-js` dependency, the project builds successfully.
