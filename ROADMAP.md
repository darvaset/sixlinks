# FootyLinks - Product Roadmap

> Last Updated: 2025-12-07
> Target: MVP Ready by End of January 2026
> Major Milestone: World Cup 2026 (June)

---

## Vision

A football connection game where players find paths between footballers through shared teammates, managers, and national teams. Think "Six Degrees of Kevin Bacon" but for football, with quiz-style gameplay that rewards both knowledge and speed.

---

## MVP Scope (v1.0)

### Data Scope
- **League:** Premier League only (1992-present, ~32 seasons)
- **Entities:** Players, Managers, Clubs, National Teams
- **Connections:**
  - Teammates (contract overlap, even 1 day counts)
  - Player-Manager relationships
  - National Team (official matches/competitions only)

### Game Mode: Daily Challenge
- One curated challenge per day (manual selection with algorithm assistance)
- Same challenge for all users (fair leaderboard)
- Themed around current events (e.g., El Clásico weekend)

### Core Mechanics
| Feature | Specification |
|---------|---------------|
| Options per step | 4 (1 optimal, 1-2 suboptimal valid, 1 trap) |
| Lives | 3 maximum |
| Timer | 1-2 minutes (to be tested) |
| Hints | 1-2 per game, cost ~10 seconds each |
| Scoring | ~1000 base, penalties for time/lives/extra steps |

### UI Per Option
- Name / Nickname
- Photo
- Nationality flag
- (Hints reveal: team or active years)

### End Game Screen
- Your path vs optimal path comparison
- "OPTIMAL PATH" badge if achieved
- Score breakdown
- Leaderboard position

### Leaderboard
- Nickname-based (no auth required for MVP)
- Daily rankings
- Score = f(steps, time, lives remaining)

---

## Architecture Principles

### Modularity First
```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│              (Next.js - Swappable UI)                   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      API LAYER                          │
│                  (Next.js API Routes)                   │
├─────────────┬─────────────┬─────────────┬──────────────┤
│  Game Logic │   Search    │ Pathfinding │  Leaderboard │
└─────────────┴─────────────┴─────────────┴──────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌─────────────────┐ ┌─────────────┐ ┌──────────────────┐
│   PostgreSQL    │ │   Neo4j     │ │  Redis (future)  │
│   (Supabase)    │ │   (Aura)    │ │   (caching)      │
│                 │ │             │ │                  │
│ - Players       │ │ - Graph     │ │ - Sessions       │
│ - Teams         │ │ - Paths     │ │ - Leaderboards   │
│ - Managers      │ │ - Routes    │ │ - Pre-computed   │
│ - Connections   │ │             │ │                  │
│ - Game Sessions │ │             │ │                  │
│ - Leaderboard   │ │             │ │                  │
└─────────────────┘ └─────────────┘ └──────────────────┘
```

### Decoupling Strategy
- Each module can be swapped independently
- Data extraction is separate from game logic
- Pre-computation separate from real-time queries
- UI components isolated from business logic

### Cost Strategy
- Start with free tiers (Supabase, Neo4j Aura)
- Scale vertically first, then horizontally
- Pre-compute expensive operations (daily paths)
- Cache aggressively

---

## Phases

### Phase 0: Foundation (Week 1)
**Goal:** Clean slate with solid infrastructure

- [ ] Create new Supabase project (credentials lost) - *External setup required by user.*
- [ ] Create new Neo4j Aura instance (credentials lost) - *External setup required by user.*
- [x] Define final database schemas (PostgreSQL + Neo4j) - *PostgreSQL schema was pre-defined; Neo4j schema documentation was created by Gemini.*
- [ ] Set up environment variables properly (.env.local, not hardcoded) - *External setup required by user.*
- [x] Verify existing pathfinding algorithm works - *Algorithm updated, debugged, and confirmed to work correctly with seeded data, accurately distinguishing player/manager roles in connections.*
- [x] Clean up repository structure - *Completed in a previous session.*
- [ ] Set up proper Git workflow (feature branches) - *Process-related task for the human team.*
- [x] Update pathfinding for v3 - *Completed by Gemini.*
- [x] Load test data - *Test data seeded into PostgreSQL and synced to Neo4j by Gemini, with schema and seed script refined during debugging.*

**Deliverable:** Working backend that can find paths between 2 players

---

### Phase 1: Data Pipeline (Week 1-2)
**Goal:** Premier League data ready for gameplay

#### Data Extraction Architecture
*   **Primary Source:** Transfermarkt.com (highly detailed football statistics).
*   **Methodology:** Web scraping using Python (e.g., libraries like BeautifulSoup for parsing HTML, potentially Scrapy for more complex, scalable scraping).
*   **Process:**
    1.  **URL Discovery:** Identify relevant Transfermarkt pages (player profiles, club pages, competition pages).
    2.  **HTML Fetching:** Download raw HTML content of identified pages.
    3.  **Data Parsing:** Extract structured data (player names, dates, club affiliations, manager stints, national team appearances) from HTML.
    4.  **Raw Storage:** Store extracted raw data (e.g., JSON or structured HTML snippets) in `data/raw/transfermarkt/` directory, organized by entity type and potentially date of extraction.
*   **Frequency:** Initially, ad-hoc execution for full historical data. For ongoing updates, a scheduled process (e.g., daily/weekly) will be implemented to fetch recent changes.
*   **Error Handling:** Implement basic retry mechanisms for failed requests, log errors (e.g., HTTP 404/500, parsing failures), and store failed URLs for later review.
*   **Scalability:** For MVP, a single-instance scraper will suffice. Future scaling could involve distributed scraping, proxy rotation, and more sophisticated rate limiting.

- [x] Design data extraction architecture
- [ ] Build scraping scripts (Transfermarkt primary)
- [ ] Create data validation layer
- [ ] Import Premier League players (1992-present)
- [ ] Import Premier League managers
- [ ] Import club data with seasons
- [ ] Import national team appearances (official only)
- [ ] Sync PostgreSQL → Neo4j pipeline
- [ ] Verify connection accuracy with manual spot checks

**Deliverable:** 5,000+ players with accurate connection data

---

### Phase 2: Game Engine (Week 2-3)
**Goal:** Core quiz mechanics working

- [ ] Refactor pathfinding for game mode (not just display)
- [ ] Build option generator:
  - Optimal path detection
  - Suboptimal valid paths (+1, +2 steps)
  - Trap generator (near-miss connections)
- [ ] Implement scoring algorithm
- [ ] Implement lives system
- [ ] Implement timer
- [ ] Implement hints system
- [ ] Build game session management
- [ ] Pre-computation system for daily challenges

**Deliverable:** API that powers complete game sessions

---

### Phase 3: UI Rebuild (Week 3-4)
**Goal:** Clean, mobile-first, engaging interface

- [ ] Design system setup (colors, typography, components)
- [ ] Player card component (photo, name, nationality)
- [ ] Option selection interface (4 cards)
- [ ] Timer display
- [ ] Lives display
- [ ] Hints button
- [ ] Step progress indicator
- [ ] Trap feedback (error animation)
- [ ] Correct feedback (success animation)
- [ ] End game summary screen
- [ ] Path comparison visualization
- [ ] Leaderboard display

**Deliverable:** Fully playable Daily Challenge

---

### Phase 4: Polish & Launch Prep (Week 4+)
**Goal:** MVP ready for beta users

- [ ] Nickname registration flow
- [ ] Leaderboard persistence
- [ ] Daily challenge curation tool (admin)
- [ ] Analytics integration (basic)
- [ ] Error handling & edge cases
- [ ] Performance optimization
- [ ] Mobile responsiveness QA
- [ ] Beta testing with friends
- [ ] Bug fixes from beta feedback

**Deliverable:** Public beta launch

---

## Future Phases (Post-MVP)

### v1.1 - More Leagues
- La Liga, Serie A, Bundesliga, Ligue 1
- South American leagues (Copa Libertadores connections)

### v1.2 - User Accounts
- Email/social auth
- Game history
- Personal stats
- Achievements

### v1.3 - Premium Features
- Free Play mode (unlimited connections)
- Graph explorer mode (learn connections)
- White-label trivia for specific leagues/countries
- Head-to-head challenges

### v1.4 - Social
- Share results
- Challenge friends
- Anonymous play → registration conversion

### v2.0 - World Cup 2026 Special
- All national teams
- World Cup themed challenges
- Historical World Cup connections
- Marketing push

---

## Success Metrics (MVP)

| Metric | Target |
|--------|--------|
| Daily Active Users | 100+ in first month |
| Avg Session Length | 3+ minutes |
| Return Rate (D1) | 40%+ |
| Completion Rate | 70%+ start → finish |
| Optimal Path Rate | 20-30% (balanced difficulty) |

---

## Technical Debt to Address

From existing codebase:
- [ ] Remove hardcoded credentials from prisma/schema.prisma
- [ ] Evaluate if framer-motion carousel is needed (was "brittle")
- [ ] Simplify ConnectionResult component
- [ ] Review pathfinding for paths > 3 steps (potential issues)

---

## Team

| Role | Who |
|------|-----|
| Product / QA / Data | Diego |
| AI Assistants | Claude + Gemini |
| UI Development | Diego + 2 friends |

---

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-12-06 | 4 options per step | 3 options = 50% guess after eliminating trap |
| 2025-12-06 | Premier League only for MVP | Manageable scope, rich history since 1992 |
| 2025-12-06 | Nickname-based leaderboard | No auth friction for MVP |
| 2025-12-06 | Manual daily challenge curation | Quality control, themed around events |
| 2025-12-06 | Contract overlap = connection | Don't need match-level data for teammates |
| 2025-12-06 | Official matches only for national teams | Cleaner data, verifiable connections |
| 2025-12-06 | Renamed project to FootyLinks | Better branding, footylinks.app domain |
| 2025-12-07 | Fixed player/manager pathfinding bug | Resolved incorrect "club_teammates" connection between player and manager, and addressed Cypher query compatibility/aggregation errors. |
| 2025-12-07 | Designed initial data extraction architecture | Leveraged existing 'scripts/data-extraction/transfermarkt' directory for technology and source decisions. |
