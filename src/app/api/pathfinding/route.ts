import { NextRequest, NextResponse } from 'next/server';
import { getNeo4jDriver } from '@/lib/neo4j'; 
import { GameResult, PathStep, Person } from '@/types/game';

interface ConnectionInfo {
  type: 'club_teammates' | 'national_teammates' | 'player_manager_club' | 'player_manager_national' | 'co_managers_club' | 'co_managers_national';
  venueName: string; // Changed from teamName to venueName
  venueType: 'Club' | 'NationalTeam';
  startDate?: string;
  endDate?: string;
}



function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return '';
  
  const start = new Date(startDate).getFullYear();
  const currentYear = new Date().getFullYear();
  
  // Check if overlapEnd is in the future or null, indicating a current connection
  const isCurrent = !endDate || new Date(endDate) > new Date();

  if (isCurrent) {
    return start === currentYear ? 'since earlier this year' : `since ${start}`;
  } else {
    // Past connection
    const end = new Date(endDate).getFullYear();
    if (start === end) {
      return `in ${start}`;
    } else {
      return `from ${start} to ${end}`;
    }
  }
}

function createConnectionDescription(
  person1Name: string, 
  person2Name: string, 
  connection: ConnectionInfo
): string {
  const dateRange = formatDateRange(connection.startDate, connection.endDate);
  const venue = connection.venueName;

  switch (connection.type) {
    case 'club_teammates':
      return `${person1Name} and ${person2Name} were teammates at ${venue} ${dateRange}`.trim();
    case 'national_teammates':
      return `${person1Name} and ${person2Name} both represented ${venue} ${dateRange}`.trim();
    case 'player_manager_club':
      // Assuming person1 is player, person2 is manager
      return `${person1Name} played under manager ${person2Name} at ${venue} ${dateRange}`.trim();
    case 'player_manager_national':
      // Assuming person1 is player, person2 is manager
      return `${person1Name} played for ${venue} under manager ${person2Name} ${dateRange}`.trim();
    case 'co_managers_club':
      return `${person1Name} and ${person2Name} both managed ${venue} ${dateRange}`.trim();
    case 'co_managers_national':
      return `${person1Name} and ${person2Name} both managed ${venue} national team ${dateRange}`.trim();
    default:
      return `${person1Name} and ${person2Name} were connected via ${venue} ${dateRange}`.trim();
  }
}

async function findConnectionPath(startPersonId: number, endPersonId: number) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  const startTime = Date.now();

  try {
    // Fetch full details for the start and end persons
    const personDetailsQuery = `
      MATCH (p:Person) WHERE p.id IN [$startPersonId, $endPersonId]
      RETURN p as personNode
    `;
    const personDetailsResult = await session.run(personDetailsQuery, { startPersonId, endPersonId });
    
    let startPerson: Person | undefined, endPerson: Person | undefined;
    personDetailsResult.records.forEach(record => {
      const personNode = record.get('personNode').properties;
      if (personNode && personNode.id) {
        const person: Person = {
          id: personNode.id,
          name: personNode.name,
          fullName: personNode.fullName,
          nationality: personNode.nationality,
          primaryPosition: personNode.primaryPosition,
          photoUrl: personNode.photoUrl,
          isRetired: personNode.isRetired
        };
        if (person.id === startPersonId) startPerson = person;
        else endPerson = person;
      }
    });

    if (!startPerson || !endPerson) {
      return NextResponse.json({ error: 'One or both persons could not be found.' }, { status: 404 });
    }

    // Check for 1-step connections with detailed date information
    // This query needs to be significantly updated to handle all 6 connection types and extract relationship properties for descriptions.
    const oneStepQuery = `
      MATCH (p1:Person {id: $startPersonId})
      MATCH (p2:Person {id: $endPersonId})

      // 1. Teammates at Club (PLAYED_FOR)
      OPTIONAL MATCH (p1)-[s1:PLAYED_FOR]->(c:Club)<-[s2:PLAYED_FOR]-(p2)
      WHERE s1.startDate <= s2.endDate AND s2.startDate <= s1.endDate
      WITH p1, p2, startPersonId, endPersonId,
        collect({
          type: 'club_teammates',
          venueName: c.name,
          venueType: 'Club',
          startDate: toString(CASE WHEN s1.startDate > s2.startDate THEN s1.startDate ELSE s2.startDate END),
          endDate: toString(CASE WHEN s1.endDate < s2.endDate THEN s1.endDate ELSE s2.endDate END)
        }) AS clubTeammateConnections

      // 2. Teammates at National Team (REPRESENTED)
      OPTIONAL MATCH (p1)-[r1:REPRESENTED]->(nt:NationalTeam)<-[r2:REPRESENTED]-(p2)
      WHERE r1.firstCap <= r2.lastCap AND r2.firstCap <= r1.lastCap
      WITH p1, p2, startPersonId, endPersonId, clubTeammateConnections,
        collect({
          type: 'national_teammates',
          venueName: nt.name,
          venueType: 'NationalTeam',
          startDate: toString(CASE WHEN r1.firstCap > r2.firstCap THEN r1.firstCap ELSE r2.firstCap END),
          endDate: toString(CASE WHEN r1.lastCap < r2.lastCap THEN r1.lastCap ELSE r2.lastCap END)
        }) AS nationalTeammateConnections
      
      // 3. Player under Manager at Club (PLAYED_FOR and MANAGED)
      OPTIONAL MATCH (p1)-[pl:PLAYED_FOR]->(c_pm:Club)<-[mg:MANAGED]-(p2)
      WHERE pl.startDate <= mg.endDate AND mg.startDate <= pl.endDate
      WITH p1, p2, startPersonId, endPersonId, clubTeammateConnections, nationalTeammateConnections,
        collect({
          type: 'player_manager_club',
          venueName: c_pm.name,
          venueType: 'Club',
          startDate: toString(CASE WHEN pl.startDate > mg.startDate THEN pl.startDate ELSE mg.startDate END),
          endDate: toString(CASE WHEN pl.endDate < mg.endDate THEN pl.endDate ELSE mg.endDate END),
          person1Role: 'player', // p1 is player
          person2Role: 'manager' // p2 is manager
        }) AS playerManagerClubConnections
      
      // 4. Player under Manager at National Team (REPRESENTED and MANAGED_NT)
      OPTIONAL MATCH (p1)-[rep:REPRESENTED]->(nt_pm:NationalTeam)<-[mnt:MANAGED_NT]-(p2)
      WHERE rep.firstCap <= mnt.endDate AND mnt.startDate <= rep.lastCap
      WITH p1, p2, startPersonId, endPersonId, clubTeammateConnections, nationalTeammateConnections, playerManagerClubConnections,
        collect({
          type: 'player_manager_national',
          venueName: nt_pm.name,
          venueType: 'NationalTeam',
          startDate: toString(CASE WHEN rep.firstCap > mnt.startDate THEN rep.firstCap ELSE mnt.startDate END),
          endDate: toString(CASE WHEN rep.lastCap < mnt.endDate THEN rep.lastCap ELSE mnt.endDate END),
          person1Role: 'player', // p1 is player
          person2Role: 'manager' // p2 is manager
        }) AS playerManagerNationalConnections

      // (Reversed) Manager under Player at Club (MANAGED and PLAYED_FOR) - p1 is manager, p2 is player
      OPTIONAL MATCH (p1)-[mg_rev:MANAGED]->(c_mp:Club)<-[pl_rev:PLAYED_FOR]-(p2)
      WHERE mg_rev.startDate <= pl_rev.endDate AND pl_rev.startDate <= mg_rev.endDate
      WITH p1, p2, startPersonId, endPersonId, clubTeammateConnections, nationalTeammateConnections, playerManagerClubConnections, playerManagerNationalConnections,
        collect({
          type: 'player_manager_club',
          venueName: c_mp.name,
          venueType: 'Club',
          startDate: toString(CASE WHEN mg_rev.startDate > pl_rev.startDate THEN mg_rev.startDate ELSE pl_rev.startDate END),
          endDate: toString(CASE WHEN mg_rev.endDate < pl_rev.endDate THEN mg_rev.endDate ELSE pl_rev.endDate END),
          person1Role: 'manager', // p1 is manager
          person2Role: 'player' // p2 is player
        }) AS managerPlayerClubConnections

      // (Reversed) Manager under Player at National Team (MANAGED_NT and REPRESENTED) - p1 is manager, p2 is player
      OPTIONAL MATCH (p1)-[mnt_rev:MANAGED_NT]->(nt_mp:NationalTeam)<-[rep_rev:REPRESENTED]-(p2)
      WHERE mnt_rev.startDate <= rep_rev.lastCap AND rep_rev.firstCap <= mnt_rev.endDate
      WITH p1, p2, startPersonId, endPersonId, clubTeammateConnections, nationalTeammateConnections, playerManagerClubConnections, playerManagerNationalConnections, managerPlayerClubConnections,
        collect({
          type: 'player_manager_national',
          venueName: nt_mp.name,
          venueType: 'NationalTeam',
          startDate: toString(CASE WHEN mnt_rev.startDate > rep_rev.firstCap THEN mnt_rev.startDate ELSE rep_rev.firstCap END),
          endDate: toString(CASE WHEN mnt_rev.endDate < rep_rev.lastCap THEN mnt_rev.endDate ELSE rep_rev.lastCap END),
          person1Role: 'manager', // p1 is manager
          person2Role: 'player' // p2 is player
        }) AS managerPlayerNationalConnections

      // 5. Co-managers at Club (MANAGED)
      OPTIONAL MATCH (p1)-[m1:MANAGED]->(c_mm:Club)<-[m2:MANAGED]-(p2)
      WHERE m1.startDate <= m2.endDate AND m2.startDate <= m1.endDate
      WITH p1, p2, startPersonId, endPersonId, clubTeammateConnections, nationalTeammateConnections, playerManagerClubConnections, playerManagerNationalConnections, managerPlayerClubConnections, managerPlayerNationalConnections,
        collect({
          type: 'co_managers_club',
          venueName: c_mm.name,
          venueType: 'Club',
          startDate: toString(CASE WHEN m1.startDate > m2.startDate THEN m1.startDate ELSE m2.startDate END),
          endDate: toString(CASE WHEN m1.endDate < m2.endDate THEN m1.endDate ELSE m2.endDate END)
        }) AS coManagerClubConnections

      // 6. Co-managers at National Team (MANAGED_NT)
      OPTIONAL MATCH (p1)-[n1:MANAGED_NT]->(nt_mm:NationalTeam)<-[n2:MANAGED_NT]-(p2)
      WHERE n1.startDate <= n2.endDate AND n2.startDate <= n1.endDate
      WITH p1, p2, startPersonId, endPersonId, clubTeammateConnections, nationalTeammateConnections, playerManagerClubConnections, playerManagerNationalConnections, managerPlayerClubConnections, managerPlayerNationalConnections, coManagerClubConnections,
        collect({
          type: 'co_managers_national',
          venueName: nt_mm.name,
          venueType: 'NationalTeam',
          startDate: toString(CASE WHEN n1.startDate > n2.startDate THEN n1.startDate ELSE n2.startDate END),
          endDate: toString(CASE WHEN n1.endDate < n2.endDate THEN n1.endDate ELSE n2.endDate END)
        }) AS coManagerNationalConnections
      
      // Combine all connection types and filter out empty lists
      WITH clubTeammateConnections + nationalTeammateConnections + playerManagerClubConnections + playerManagerNationalConnections + managerPlayerClubConnections + managerPlayerNationalConnections + coManagerClubConnections + coManagerNationalConnections AS allConnections
      UNWIND allConnections AS connection
      RETURN connection
      LIMIT 1
    `;
    const oneStepResult = await session.run(oneStepQuery, { startPersonId, endPersonId });

    if (oneStepResult.records.length > 0) {
      const record = oneStepResult.records[0];
      const connection = record.get('connection');
      
      // Determine which person is which role if it's a player-manager connection
      let p1Name = startPerson.name;
      let p2Name = endPerson.name;

      if (connection.person1Role === 'manager' && connection.person2Role === 'player') {
        // Swap names for description if startPerson was the manager and endPerson was the player
        p1Name = endPerson.name;
        p2Name = startPerson.name;
      }
      
      const description = createConnectionDescription(p1Name, p2Name, connection);
      
      const searchTime = Date.now() - startTime;
      const gameResult: GameResult = {
        found: true,
        path: [{
          from: {
            id: startPerson.id,
            name: startPerson.name,
            type: 'person',
            nationality: startPerson.nationality,
            position: startPerson.primaryPosition
          },
          to: {
            id: endPerson.id,
            name: endPerson.name,
            type: 'person',
            nationality: endPerson.nationality,
            position: endPerson.primaryPosition
          },
          connection: { 
            type: connection.type,
            description: description,
            venue: connection.venueName,
            period: formatDateRange(connection.startDate, connection.endDate)
          }
        }],
        totalSteps: 1,
        searchTime,
        score: calculateScore(1, searchTime),
        startPerson,
        endPerson
      };
      await session.close();
      return NextResponse.json(gameResult);
    }
    
    // For longer paths, we need a more sophisticated query
    const pathQuery = `
      MATCH (p1:Person {id: $startPersonId}), (p2:Person {id: $endPersonId})
      MATCH path = shortestPath((p1)-[r:PLAYED_FOR|MANAGED|REPRESENTED|MANAGED_NT*..12]-(p2))
      // Filter out paths where relationships don't overlap correctly
      // This is a complex logic that might be better handled in application layer for description or if Neo4j 
      // supports transactional relationships
      WITH nodes(path) as pathNodes, relationships(path) as pathRels, path
      // Extract details for nodes and relationships along the path
      UNWIND pathNodes AS node
      OPTIONAL MATCH (node)<-[r_stint:PLAYED_FOR|MANAGED|REPRESENTED|MANAGED_NT]-()
      WITH pathNodes, pathRels, path,
      collect(DISTINCT {
        id: node.id,
        name: node.name,
        labels: labels(node),
        primaryPosition: CASE WHEN 'Person' IN labels(node) THEN node.primaryPosition ELSE null END,
        nationality: CASE WHEN 'Person' IN labels(node) THEN node.nationality ELSE null END
      }) AS nodeDetails,
      collect(DISTINCT {
        type: type(r_stint),
        start: r_stint.startDate, // For PLAYED_FOR, MANAGED, MANAGED_NT
        end: r_stint.endDate,     // For PLAYED_FOR, MANAGED, MANAGED_NT
        firstCap: r_stint.firstCap, // For REPRESENTED
        lastCap: r_stint.lastCap  // For REPRESENTED
      }) AS relationshipContext // Collect context for each node's relationship
      
      RETURN pathNodes, pathRels, nodeDetails, relationshipContext
      ORDER BY length(path)
      LIMIT 1
    `;
    const pathResult = await session.run(pathQuery, { startPersonId, endPersonId });
    const searchTime = Date.now() - startTime;

    if (pathResult.records.length === 0) {
      return NextResponse.json({
        found: false, 
        path: [], 
        totalSteps: 0, 
        searchTime, 
        score: 0, 
        startPerson, 
        endPerson,
        message: 'No connection found between these persons within 12 degrees.'
      });
    }

    const record = pathResult.records[0];
    const pathNodes = record.get('pathNodes');
    const pathRels = record.get('pathRels');
    
    // Process the path to create meaningful connections for multi-step paths
    const formattedPath: PathStep[] = [];
    
    // Iterate through the path to build steps
    for (let i = 0; i < pathRels.length; i += 2) { // pathRels is [rel1, middleNode, rel2, nextPerson]
      const rel1 = pathRels[i];
      const middleNode = pathNodes[i+1]; // Node type (Club or NationalTeam)
      const rel2 = pathRels[i+1];

      const fromPersonNode = pathNodes[i].properties;
      const toPersonNode = pathNodes[i+2].properties; // This will be the next person after the middle node

      let connectionType: ConnectionInfo['type'] | undefined;
      const venueName = middleNode.properties.name;
      let venueType: ConnectionInfo['venueType'];
      let person1Role: 'player' | 'manager' | undefined;

      // Determine venue type
      if (middleNode.labels.includes('Club')) {
        venueType = 'Club';
      } else if (middleNode.labels.includes('NationalTeam')) {
        venueType = 'NationalTeam';
      } else {
        // Should not happen with current schema, but for safety
        continue; 
      }

      // Logic to determine specific connection type and overlapping dates
      const overlap = getOverlapDates(rel1, rel2);
      const { startDate, endDate } = overlap;

      if (!startDate) { // If no overlap, skip this connection
        continue;
      }

      // Determine connection type and roles
      if (rel1.type === 'PLAYED_FOR' && rel2.type === 'PLAYED_FOR' && venueType === 'Club') {
        connectionType = 'club_teammates';
      } else if (rel1.type === 'REPRESENTED' && rel2.type === 'REPRESENTED' && venueType === 'NationalTeam') {
        connectionType = 'national_teammates';
      } else if (rel1.type === 'MANAGED' && rel2.type === 'MANAGED' && venueType === 'Club') {
        connectionType = 'co_managers_club';
      } else if (rel1.type === 'MANAGED_NT' && rel2.type === 'MANAGED_NT' && venueType === 'NationalTeam') {
        connectionType = 'co_managers_national';
      } else if (venueType === 'Club') {
        if (rel1.type === 'PLAYED_FOR' && rel2.type === 'MANAGED') {
          connectionType = 'player_manager_club';
          person1Role = 'player'; // fromPerson is player
          person2Role = 'manager'; // toPerson is manager
        } else if (rel1.type === 'MANAGED' && rel2.type === 'PLAYED_FOR') {
          connectionType = 'player_manager_club';
          person1Role = 'manager'; // fromPerson is manager
          person2Role = 'player'; // toPerson is player
        }
      } else if (venueType === 'NationalTeam') {
        if (rel1.type === 'REPRESENTED' && rel2.type === 'MANAGED_NT') {
          connectionType = 'player_manager_national';
          person1Role = 'player'; // fromPerson is player
          person2Role = 'manager'; // toPerson is manager
        } else if (rel1.type === 'MANAGED_NT' && rel2.type === 'REPRESENTED') {
          connectionType = 'player_manager_national';
          person1Role = 'manager'; // fromPerson is manager
          person2Role = 'player'; // toPerson is player
        }
      }

      if (!connectionType) {
        console.warn(`Could not determine connection type for path segment between ${fromPersonNode.name} and ${toPersonNode.name}`);
        continue;
      }

      let p1Name = fromPersonNode.name;
      let p2Name = toPersonNode.name;

      // Adjust names for player-manager descriptions if roles are swapped for the description's perspective
      if ((connectionType === 'player_manager_club' || connectionType === 'player_manager_national') && person1Role === 'manager') {
        p1Name = toPersonNode.name; // Display player's name first in description
        p2Name = fromPersonNode.name; // Display manager's name second in description
      }

      const description = createConnectionDescription(p1Name, p2Name, { 
        type: connectionType, 
        venueName, 
        venueType, 
        startDate, 
        endDate 
      });
      
      formattedPath.push({
        from: {
          id: fromPersonNode.id,
          name: fromPersonNode.name,
          type: 'person',
          nationality: fromPersonNode.nationality,
          position: fromPersonNode.primaryPosition
        },
        to: {
          id: toPersonNode.id,
          name: toPersonNode.name,
          type: 'person',
          nationality: toPersonNode.nationality,
          position: toPersonNode.primaryPosition
        },
        connection: {
          type: connectionType,
          description: description,
          venue: venueName,
          period: formatDateRange(startDate, endDate)
        }
      });
    }

    const gameResult: GameResult = {
      found: true,
      path: formattedPath,
      totalSteps: formattedPath.length,
      searchTime,
      score: calculateScore(formattedPath.length, searchTime),
      startPerson,
      endPerson
    };
    
    return NextResponse.json(gameResult);

  } catch (error) {
    console.error('API pathfinding error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred during pathfinding.' },
      { status: 500 }
    );
  } finally {
    if (session) {
      await session.close();
    }
  }
}

function calculateScore(steps: number, timeMs: number): number {
  // Base score starts at 1000
  let score = 1000;
  
  // Deduct points for each step (fewer steps = higher score)
  score -= (steps - 1) * 100;
  
  // Bonus for fast completion (under 5 seconds)
  if (timeMs < 5000) {
    score += 50;
  }
  
  // Ensure score doesn't go below 100
  return Math.max(score, 100);
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { startPersonId, endPersonId } = body;
    if (startPersonId == null || endPersonId == null) {
      return NextResponse.json({ error: 'Person IDs are required.' }, { status: 400 });
    }
    return findConnectionPath(Number(startPersonId), Number(endPersonId));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startId = searchParams.get('start');
  const endId = searchParams.get('end');
  if (!startId || !endId) {
    return NextResponse.json({ error: 'The "start" and "end" query parameters are required.' }, { status: 400 });
  }
  return findConnectionPath(Number(startId), Number(endId));
}