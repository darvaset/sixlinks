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