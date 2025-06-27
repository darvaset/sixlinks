import { NextRequest, NextResponse } from 'next/server';
import { getNeo4jDriver } from '@/lib/neo4j'; 
import { GameResult, PathStep, Player } from '@/types/game';

interface ConnectionInfo {
  type: 'teammate' | 'national_team' | 'manager';
  teamName: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
}

function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return '';
  
  const start = new Date(startDate).getFullYear();
  const currentYear = new Date().getFullYear();
  
  if (!endDate || new Date(endDate) > new Date()) {
    // Current connection
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
  player1Name: string, 
  player2Name: string, 
  connection: ConnectionInfo
): string {
  const dateRange = formatDateRange(connection.startDate, connection.endDate);
  
  if (connection.type === 'national_team') {
    const verb = connection.isCurrent ? 'represent' : 'represented';
    return `${player1Name} and ${player2Name} both ${verb} ${connection.teamName}${dateRange ? ' ' + dateRange : ''}`;
  } else {
    const verb = connection.isCurrent ? 'are teammates' : 'were teammates';
    return `${player1Name} and ${player2Name} ${verb} at ${connection.teamName}${dateRange ? ' ' + dateRange : ''}`;
  }
}

async function findConnectionPath(startPlayerId: number, endPlayerId: number) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  const startTime = Date.now();

  try {
    // Fetch full details for the start and end players
    const playerDetailsQuery = `
      MATCH (p:Player) WHERE p.id IN [$startPlayerId, $endPlayerId]
      RETURN p as playerNode
    `;
    const playerDetailsResult = await session.run(playerDetailsQuery, { startPlayerId, endPlayerId });
    
    let startPlayer: Player | undefined, endPlayer: Player | undefined;
    playerDetailsResult.records.forEach(record => {
      const playerNode = record.get('playerNode').properties;
      if (playerNode && playerNode.id) {
        const player: Player = {
          id: playerNode.id,
          name: playerNode.name,
          fullName: playerNode.full_name,
          nationality: playerNode.nationality,
          position: playerNode.position
        };
        if (player.id === startPlayerId) startPlayer = player;
        else endPlayer = player;
      }
    });

    if (!startPlayer || !endPlayer) {
      return NextResponse.json({ error: 'One or both players could not be found.' }, { status: 404 });
    }

    // Check for 1-step connections with detailed date information
    const oneStepQuery = `
      MATCH (p1:Player {id: $startPlayerId})-[r1]->(middle)<-[r2]-(p2:Player {id: $endPlayerId})
      WHERE (middle:Team OR middle:NationalTeam)
      WITH middle, r1, r2, labels(middle) as middleLabels
      RETURN 
        middle.name as middleName,
        middleLabels[0] as middleType,
        r1.start_date as p1StartDate,
        r1.end_date as p1EndDate,
        r2.start_date as p2StartDate,
        r2.end_date as p2EndDate,
        // Calculate overlapping period
        CASE 
          WHEN r1.start_date > r2.start_date THEN r1.start_date 
          ELSE r2.start_date 
        END as overlapStart,
        CASE 
          WHEN r1.end_date IS NULL AND r2.end_date IS NULL THEN null
          WHEN r1.end_date IS NULL THEN r2.end_date
          WHEN r2.end_date IS NULL THEN r1.end_date
          WHEN r1.end_date < r2.end_date THEN r1.end_date 
          ELSE r2.end_date 
        END as overlapEnd
      LIMIT 1
    `;
    const oneStepResult = await session.run(oneStepQuery, { startPlayerId, endPlayerId });

    if (oneStepResult.records.length > 0) {
      const record = oneStepResult.records[0];
      const middleName = record.get('middleName');
      const middleType = record.get('middleType');
      const overlapStart = record.get('overlapStart');
      const overlapEnd = record.get('overlapEnd');
      
      const isNationalTeam = middleType === 'NationalTeam';
      const currentDate = new Date();
      const isCurrent = !overlapEnd || new Date(overlapEnd) > currentDate;
      
      const connection: ConnectionInfo = {
        type: isNationalTeam ? 'national_team' : 'teammate',
        teamName: middleName,
        startDate: overlapStart,
        endDate: overlapEnd,
        isCurrent
      };
      
      const description = createConnectionDescription(startPlayer.name, endPlayer.name, connection);
      
      const searchTime = Date.now() - startTime;
      const gameResult: GameResult = {
        found: true,
        path: [{
          from: {
            id: startPlayer.id,
            name: startPlayer.name,
            type: 'player',
            nationality: startPlayer.nationality,
            position: startPlayer.position
          },
          to: {
            id: endPlayer.id,
            name: endPlayer.name,
            type: 'player',
            nationality: endPlayer.nationality,
            position: endPlayer.position
          },
          connection: { 
            type: connection.type,
            description: description,
            team: middleName,
            period: connection.isCurrent ? 'current' : formatDateRange(overlapStart, overlapEnd)
          }
        }],
        totalSteps: 1,
        searchTime,
        score: calculateScore(1, searchTime),
        startPlayer,
        endPlayer
      };
      await session.close();
      return NextResponse.json(gameResult);
    }
    
    // For longer paths, we need a more sophisticated query
    const pathQuery = `
      MATCH (p1:Player {id: $startPlayerId}), (p2:Player {id: $endPlayerId})
      MATCH path = shortestPath((p1)-[*..12]-(p2))
      WITH path
      // Extract all nodes and relationships with their properties
      UNWIND nodes(path) as node
      WITH path, collect(DISTINCT {
        id: node.id,
        name: node.name,
        labels: labels(node),
        nationality: CASE WHEN 'Player' IN labels(node) THEN node.nationality ELSE null END,
        position: CASE WHEN 'Player' IN labels(node) THEN node.position ELSE null END
      }) as nodeDetails,
      [r in relationships(path) | {
        type: type(r),
        startDate: r.start_date,
        endDate: r.end_date
      }] as relDetails
      RETURN nodeDetails, relDetails
      ORDER BY length(path)
      LIMIT 1
    `;
    const pathResult = await session.run(pathQuery, { startPlayerId, endPlayerId });
    const searchTime = Date.now() - startTime;

    if (pathResult.records.length === 0) {
      return NextResponse.json({
        found: false, 
        path: [], 
        totalSteps: 0, 
        searchTime, 
        score: 0, 
        startPlayer, 
        endPlayer,
        message: 'No connection found between these players within 6 degrees.'
      });
    }

    const record = pathResult.records[0];
    const nodeDetails = record.get('nodeDetails') ?? [];
    const relDetails = record.get('relDetails') ?? [];
    
    console.log('Path nodes:', JSON.stringify(nodeDetails, null, 2));
    console.log('Relationships:', JSON.stringify(relDetails, null, 2));
    
    // Process the path to create meaningful connections
    const formattedPath: PathStep[] = [];
    
    // Find all players in the path
    const playerIndices: number[] = [];
    nodeDetails.forEach((node, index) => {
      if (node.labels.includes('Player')) {
        playerIndices.push(index);
      }
    });
    
    console.log('Player indices:', playerIndices);
    
    // Create connections between consecutive players
    for (let i = 0; i < playerIndices.length - 1; i++) {
      const currentPlayerIndex = playerIndices[i];
      const nextPlayerIndex = playerIndices[i + 1];
      const currentPlayer = nodeDetails[currentPlayerIndex];
      const nextPlayer = nodeDetails[nextPlayerIndex];
      
      // Analyze what's between these two players
      const nodesBetween = nodeDetails.slice(currentPlayerIndex + 1, nextPlayerIndex);
      console.log(`Between ${currentPlayer.name} and ${nextPlayer.name}:`, nodesBetween);
      
      let description = '';
      let connectionType: 'teammate' | 'national_team' | 'manager' = 'teammate';
      let teamName = '';
      
      if (nodesBetween.length === 1) {
        // Direct connection through team/national team
        const middleNode = nodesBetween[0];
        const isNationalTeam = middleNode.labels.includes('NationalTeam');
        
        connectionType = isNationalTeam ? 'national_team' : 'teammate';
        teamName = middleNode.name;
        
        // Get the relationship details
        const rel1 = relDetails[currentPlayerIndex];
        const rel2 = relDetails[currentPlayerIndex + 1];
        
        // For now, use simplified description (we'd need more complex logic for dates in multi-step paths)
        if (isNationalTeam) {
          description = `${currentPlayer.name} and ${nextPlayer.name} both represented ${middleNode.name}`;
        } else {
          description = `${currentPlayer.name} and ${nextPlayer.name} were teammates at ${middleNode.name}`;
        }
      } else {
        // More complex connection
        const connectionPath = nodesBetween.map(n => n.name).join(' → ');
        description = `${currentPlayer.name} connected to ${nextPlayer.name} via ${connectionPath}`;
      }
      
      formattedPath.push({
        from: {
          id: currentPlayer.id,
          name: currentPlayer.name,
          type: 'player',
          nationality: currentPlayer.nationality,
          position: currentPlayer.position
        },
        to: {
          id: nextPlayer.id,
          name: nextPlayer.name,
          type: 'player',
          nationality: nextPlayer.nationality,
          position: nextPlayer.position
        },
        connection: {
          type: connectionType,
          description: description,
          team: teamName
        }
      });
    }

    const gameResult: GameResult = {
      found: true,
      path: formattedPath,
      totalSteps: formattedPath.length,
      searchTime,
      score: calculateScore(formattedPath.length, searchTime),
      startPlayer,
      endPlayer
    };
    
    console.log('Final formatted path:', JSON.stringify(formattedPath, null, 2));
    console.log('Total steps:', formattedPath.length);
    
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
  try {
    const body = await request.json();
    const { startPlayerId, endPlayerId } = body;
    if (startPlayerId == null || endPlayerId == null) {
      return NextResponse.json({ error: 'Player IDs are required.' }, { status: 400 });
    }
    return findConnectionPath(Number(startPlayerId), Number(endPlayerId));
  } catch(e) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
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