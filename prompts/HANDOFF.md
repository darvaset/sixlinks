# FootyLinks - Session Handoff

> Use this document to onboard a new AI assistant to continue work on FootyLinks.
> Last Updated: 2025-12-06

---

## Current Status: Schema v3 Designed, Ready for Implementation

### What Just Happened (Latest Session)

1. **Fixed Node.js v25 localStorage error** - Downgraded to Node 22 LTS via nvm
2. **Designed Schema v3** - Complete database redesign for MVP + future Football API
3. **Created Gemini prompt** - Ready at `prompts/GEMINI_SCHEMA_V3_UPDATE.md`

### Immediate Next Task

Run the Gemini prompt to implement Schema v3:
```bash
cd /Users/darva/Projects/sixlinks
# Give Gemini the prompt file to execute
```

The prompt covers:
1. Neo4j schema documentation
2. Pathfinding route updates (Player → Person)
3. Neo4j sync utility creation
4. Type definitions update
5. UI component renames

---

## Project Context

**What is FootyLinks?**
A football connection game + potential Football API. Users find paths between footballers through shared teammates, managers, and national teams.

**Tech Stack:**
- Next.js 15.3.4 (App Router)
- React 19.1.0
- TypeScript
- Tailwind CSS
- PostgreSQL (Supabase) - source of truth
- Neo4j Aura - optimized for pathfinding
- **Node.js 22 LTS** (v25 causes localStorage errors!)

**Repository:** `/Users/darva/Projects/sixlinks`

---

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `ROADMAP.md` | Product roadmap | ✅ Complete |
| `AGENT_LOG.md` | Development log | ✅ Updated |
| `prisma/schema.prisma` | Database schema v3 | ✅ NEW - needs migration |
| `prompts/GEMINI_SCHEMA_V3_UPDATE.md` | Next task for Gemini | ✅ Ready to execute |
| `src/app/api/pathfinding/route.ts` | Core algorithm | ⚠️ Needs update for v3 |
| `src/lib/neo4j.ts` | Neo4j driver | ✅ Working |
| `src/lib/supabase.ts` | Supabase client | ✅ SSR-safe |

---

## Schema v3 Key Concepts

### Unified Person Entity
- `Player` and `Manager` are now ONE entity: `Person`
- Guardiola = 1 record (was player 1990-2006, manager 2008-present)
- Enables richer pathfinding (Messi → Guardiola → Koeman chain)

### Relationship Tables
| Table | Purpose |
|-------|---------|
| `ClubPlayerStint` | Person played for Club |
| `ClubManagerStint` | Person managed Club |
| `NationalTeamPlayerStint` | Person represented NationalTeam (firstCap/lastCap) |
| `NationalTeamManagerStint` | Person managed NationalTeam |
| `Transfer` | Transfer records with fees |

### Connection Types for Pathfinding
1. Club teammates (overlapping playing stints)
2. National team teammates (overlapping caps)
3. Player under manager at club
4. Player under manager at national team
5. Co-managers at same club
6. Co-managers at same national team

---

## Environment Setup

**Required Node Version:**
```bash
nvm use 22  # CRITICAL - v25 breaks everything
```

**Verify Setup:**
```bash
cd /Users/darva/Projects/sixlinks
node --version  # Should be v22.x.x
npm run dev     # Should start without localStorage errors
```

**Database Credentials:** Already in `.env` file

---

## Phase 0 Checklist

| Task | Status |
|------|--------|
| ✅ Fix development server | DONE |
| ✅ Design final schema | DONE |
| 🔲 Run Prisma migrations | `npx prisma db push` |
| 🔲 Update pathfinding for v3 | See Gemini prompt |
| 🔲 Create Neo4j sync utility | See Gemini prompt |
| 🔲 Verify Neo4j connection | After sync utility |
| 🔲 Load test data | After schema migration |
| 🔲 End-to-end pathfinding test | Final verification |

---

## What NOT to Do

- ❌ Do NOT use Node.js v25 (localStorage bug)
- ❌ Do NOT modify `prisma/schema.prisma` without discussion - just redesigned
- ❌ Do NOT install framer-motion - removed intentionally
- ❌ Do NOT hardcode credentials

---

## Communication Style

Diego prefers:
- Spanish for conversations
- English for code and documentation
- Strategy discussions before implementation
- Claude for design/prompts, Gemini for execution
- Iterative progress with clear milestones
