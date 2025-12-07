import { PrismaClient } from '@prisma/client';
import { getNeo4jDriver, closeNeo4jDriver } from './neo4j';
import { Driver, Transaction } from 'neo4j-driver';

const prisma = new PrismaClient();
let driver: Driver;

interface SyncResult {
  personsSynced: number;
  clubsSynced: number;
  nationalTeamsSynced: number;
  relationshipsCreated: number;
  timeTakenMs: number;
}

/**
 * Clears all nodes and relationships from the Neo4j database.
 * @returns {Promise<void>}
 */
export async function clearNeo4jDatabase(): Promise<void> {
  driver = getNeo4jDriver();
  const session = driver.session();
  try {
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('Neo4j database cleared.');
  } catch (error) {
    console.error('Error clearing Neo4j database:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Syncs a single Person and their related stints from PostgreSQL to Neo4j.
 * Creates or updates the Person node and its relationships (PLAYED_FOR, MANAGED, REPRESENTED, MANAGED_NT).
 * @param {number} personId - The ID of the person to sync.
 * @returns {Promise<void>}
 */
export async function syncPersonToNeo4j(personId: number): Promise<void> {
  driver = getNeo4jDriver();
  const session = driver.session();
  let tx: Transaction | null = null;

  try {
    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: {
        clubPlayerStints: { include: { club: true } },
        clubManagerStints: { include: { club: true } },
        nationalTeamPlayerStints: { include: { nationalTeam: true } },
        nationalTeamManagerStints: { include: { nationalTeam: true } },
      },
    });

    if (!person || person.deletedAt) {
      console.log(`Person with ID ${personId} not found or soft-deleted, skipping sync.`);
      return;
    }

    tx = session.beginTransaction();

    // Create or update Person node
    await tx.run(
      `MERGE (p:Person {id: $id})
       ON CREATE SET p.name = $name, p.fullName = $fullName, p.nationality = $nationality,
                     p.primaryPosition = $primaryPosition, p.photoUrl = $photoUrl, p.isRetired = $isRetired
       ON MATCH SET p.name = $name, p.fullName = $fullName, p.nationality = $nationality,
                    p.primaryPosition = $primaryPosition, p.photoUrl = $photoUrl, p.isRetired = $isRetired`,
      {
        id: person.id,
        name: person.name,
        fullName: person.fullName,
        nationality: person.nationality,
        primaryPosition: person.primaryPosition,
        photoUrl: person.photoUrl,
        isRetired: person.isRetired,
      }
    );

    // Sync ClubPlayerStints
    for (const stint of person.clubPlayerStints) {
      if (stint.deletedAt) continue;
      await tx.run(
        `MERGE (p:Person {id: $personId})
         MERGE (c:Club {id: $clubId})
         MERGE (p)-[r:PLAYED_FOR]->(c)
         ON CREATE SET r.startDate = $startDate, r.endDate = $endDate, r.position = $position, r.isLoan = $isLoan
         ON MATCH SET r.startDate = $startDate, r.endDate = $endDate, r.position = $position, r.isLoan = $isLoan`,
        {
          personId: person.id,
          clubId: stint.clubId,
          startDate: stint.startDate?.toISOString(),
          endDate: stint.endDate?.toISOString(),
          position: stint.position,
          isLoan: stint.isLoan,
        }
      );
    }

    // Sync ClubManagerStints
    for (const stint of person.clubManagerStints) {
      if (stint.deletedAt) continue;
      await tx.run(
        `MERGE (p:Person {id: $personId})
         MERGE (c:Club {id: $clubId})
         MERGE (p)-[r:MANAGED]->(c)
         ON CREATE SET r.startDate = $startDate, r.endDate = $endDate, r.role = $role
         ON MATCH SET r.startDate = $startDate, r.endDate = $endDate, r.role = $role`,
        {
          personId: person.id,
          clubId: stint.clubId,
          startDate: stint.startDate?.toISOString(),
          endDate: stint.endDate?.toISOString(),
          role: stint.role,
        }
      );
    }

    // Sync NationalTeamPlayerStints
    for (const stint of person.nationalTeamPlayerStints) {
      if (stint.deletedAt) continue;
      await tx.run(
        `MERGE (p:Person {id: $personId})
         MERGE (nt:NationalTeam {id: $nationalTeamId})
         MERGE (p)-[r:REPRESENTED]->(nt)
         ON CREATE SET r.firstCap = $firstCap, r.lastCap = $lastCap, r.totalCaps = $totalCaps
         ON MATCH SET r.firstCap = $firstCap, r.lastCap = $lastCap, r.totalCaps = $totalCaps`,
        {
          personId: person.id,
          nationalTeamId: stint.nationalTeamId,
          firstCap: stint.firstCap?.toISOString(),
          lastCap: stint.lastCap?.toISOString(),
          totalCaps: stint.totalCaps,
        }
      );
    }

    // Sync NationalTeamManagerStints
    for (const stint of person.nationalTeamManagerStints) {
      if (stint.deletedAt) continue;
      await tx.run(
        `MERGE (p:Person {id: $personId})
         MERGE (nt:NationalTeam {id: $nationalTeamId})
         MERGE (p)-[r:MANAGED_NT]->(nt)
         ON CREATE SET r.startDate = $startDate, r.endDate = $endDate, r.role = $role
         ON MATCH SET r.startDate = $startDate, r.endDate = $endDate, r.role = $role`,
        {
          personId: person.id,
          nationalTeamId: stint.nationalTeamId,
          startDate: stint.startDate?.toISOString(),
          endDate: stint.endDate?.toISOString(),
          role: stint.role,
        }
      );
    }

    await tx.commit();
    console.log(`Synced Person with ID: ${personId}`);
  } catch (error) {
    if (tx) {
      await tx.rollback();
    }
    console.error(`Error syncing Person with ID ${personId}:`, error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Syncs a single Club from PostgreSQL to Neo4j.
 * Creates or updates the Club node.
 * @param {number} clubId - The ID of the club to sync.
 * @returns {Promise<void>}
 */
export async function syncClubToNeo4j(clubId: number): Promise<void> {
  driver = getNeo4jDriver();
  const session = driver.session();
  let tx: Transaction | null = null;

  try {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club || club.deletedAt) {
      console.log(`Club with ID ${clubId} not found or soft-deleted, skipping sync.`);
      return;
    }

    tx = session.beginTransaction();

    await tx.run(
      `MERGE (c:Club {id: $id})
       ON CREATE SET c.name = $name, c.shortName = $shortName, c.country = $country,
                     c.currentLeague = $currentLeague, c.logoUrl = $logoUrl
       ON MATCH SET c.name = $name, c.shortName = $shortName, c.country = $country,
                    c.currentLeague = $currentLeague, c.logoUrl = $logoUrl`,
      {
        id: club.id,
        name: club.name,
        shortName: club.shortName,
        country: club.country,
        currentLeague: club.currentLeague,
        logoUrl: club.logoUrl,
      }
    );

    await tx.commit();
    console.log(`Synced Club with ID: ${clubId}`);
  } catch (error) {
    if (tx) {
      await tx.rollback();
    }
    console.error(`Error syncing Club with ID ${clubId}:`, error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Syncs a single NationalTeam from PostgreSQL to Neo4j.
 * Creates or updates the NationalTeam node.
 * @param {number} teamId - The ID of the national team to sync.
 * @returns {Promise<void>}
 */
export async function syncNationalTeamToNeo4j(teamId: number): Promise<void> {
  driver = getNeo4jDriver();
  const session = driver.session();
  let tx: Transaction | null = null;

  try {
    const nationalTeam = await prisma.nationalTeam.findUnique({
      where: { id: teamId },
    });

    if (!nationalTeam || nationalTeam.deletedAt) {
      console.log(`National Team with ID ${teamId} not found or soft-deleted, skipping sync.`);
      return;
    }

    tx = session.beginTransaction();

    await tx.run(
      `MERGE (nt:NationalTeam {id: $id})
       ON CREATE SET nt.name = $name, nt.fifaCode = $fifaCode, nt.confederation = $confederation,
                     nt.flagUrl = $flagUrl
       ON MATCH SET nt.name = $name, nt.fifaCode = $fifaCode, nt.confederation = $confederation,
                    nt.flagUrl = $flagUrl`,
      {
        id: nationalTeam.id,
        name: nationalTeam.name,
        fifaCode: nationalTeam.fifaCode,
        confederation: nationalTeam.confederation,
        flagUrl: nationalTeam.flagUrl,
      }
    );

    await tx.commit();
    console.log(`Synced National Team with ID: ${teamId}`);
  } catch (error) {
    if (tx) {
      await tx.rollback();
    }
    console.error(`Error syncing National Team with ID ${teamId}:`, error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Syncs all Persons, Clubs, and National Teams from PostgreSQL to Neo4j.
 * Clears the Neo4j database before syncing.
 * @returns {Promise<SyncResult>} - A summary of the sync operation.
 */
export async function syncAllToNeo4j(): Promise<SyncResult> {
  const startTime = process.hrtime.bigint();
  let personsSynced = 0;
  let clubsSynced = 0;
  let nationalTeamsSynced = 0;
  let relationshipsCreated = 0; // This count is approximate as MERGE doesn't directly return created relationships count.

  try {
    await clearNeo4jDatabase();

    // Fetch all entities from PostgreSQL
    const allPersons = await prisma.person.findMany({ where: { deletedAt: null } });
    const allClubs = await prisma.club.findMany({ where: { deletedAt: null } });
    const allNationalTeams = await prisma.nationalTeam.findMany({ where: { deletedAt: null } });

    console.log(`Found ${allPersons.length} persons, ${allClubs.length} clubs, ${allNationalTeams.length} national teams to sync.`);

    // Sync in parallel for better performance
    await Promise.all(allClubs.map(club => syncClubToNeo4j(club.id).then(() => clubsSynced++)));
    await Promise.all(allNationalTeams.map(nt => syncNationalTeamToNeo4j(nt.id).then(() => nationalTeamsSynced++)));
    // Persons are synced last as their relationships depend on Clubs and NationalTeams being present.
    await Promise.all(allPersons.map(person => syncPersonToNeo4j(person.id).then(() => personsSynced++)));

    // Note: Counting relationships created accurately with MERGE is complex.
    // For now, we'll just report the number of persons synced, as their sync function
    // is responsible for creating relationships. A more accurate count would require
    // parsing Neo4j's transaction statistics, which is beyond this initial implementation.
    relationshipsCreated = personsSynced; // Placeholder

    const endTime = process.hrtime.bigint();
    const timeTakenMs = Number(endTime - startTime) / 1_000_000;

    console.log('Neo4j sync completed.');
    return {
      personsSynced,
      clubsSynced,
      nationalTeamsSynced,
      relationshipsCreated,
      timeTakenMs,
    };
  } catch (error) {
    console.error('Full Neo4j sync failed:', error);
    throw error;
  } finally {
    await closeNeo4jDriver();
  }
}