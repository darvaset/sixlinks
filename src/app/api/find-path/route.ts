import { NextRequest, NextResponse } from 'next/server';
import { getNeo4jDriver } from '@/lib/neo4j'; 
import { GameResult, PathStep, Player } from '@/types/game';

function formatYear(dateStr?: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).getFullYear().toString();
}

function getDateRangeText(startDate?: string | null, endDate?: string | null): string {
  if (!startDate) return '';
  
  const startYear = formatYear(startDate);
  const currentYear = new Date().getFullYear();
  
  if (!endDate || new Date(endDate) > new Date()) {
    // Current connection
    return startYear === currentYear.toString() ? 'currently' : `since ${startYear}`;
  } else {
    // Past connection
    const endYear = formatYear(endDate);
    if (startYear === endYear) {
      return `in ${startYear}`;
    } else {
      return `${startYear}-${endYear}`;
    }
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
        CASE WHEN 'NationalTeam' IN middleLabels THEN 'national' ELSE 'club' END as teamType,
        r1.start_date as p1StartDate,
        r1.end_date as p1EndDate,
        r2.start_date as p2StartDate,
        r2.end_date as p2EndDate
      LIMIT 1
    `;
    const oneStepResult = await session.run(oneStepQuery, { startPlayerId, endPlayerId });

    if (oneStepResult.records.length > 0) {
      const record = oneStepResult.records[0];
      const middleName = record.get('middleName');
      const teamType = record.get('teamType');
      const p1StartDate = record.get('p1StartDate');
      const p1EndDate = record.get('p1EndDate');
      const p2StartDate = record.get('p2StartDate');
      const p2EndDate = record.get('p2EndDate');
      
      // Calculate overlapping period
      let overlapStart = p1StartDate;
      let overlapEnd = p1EndDate;
      
      if (p1StartDate && p2StartDate) {
        overlapStart = p1StartDate > p2StartDate ? p1StartDate : p2StartDate;
      }
      
      if (p1EndDate && p2EndDate) {
        overlapEnd = p1EndDate < p2EndDate ? p1EndDate : p2EndDate;
      } else if (!p1EndDate && p2EndDate) {
        overlapEnd = p2EndDate;
      } else if (p1EndDate && !p2EndDate) {
        overlapEnd = p1EndDate;
      }
      
      const dateRange = getDateRangeText(overlapStart, overlapEnd);
      const isCurrentConnection = !overlapEnd || new Date(overlapEnd) > new Date();
      
      let description = '';
      if (teamType === 'national') {
        const verb = isCurrentConnection ? 'represent' : 'represented';
        description = `${startPlayer.name} and ${endPlayer.name} both ${verb} ${middleName}${dateRange ? ' ' + dateRange : ''}`;
      } else {
        const verb = isCurrentConnection ? 'are teammates' : 'were teammates';
        description = `${startPlayer.name} and ${endPlayer.name} ${verb} at ${middleName}${dateRange ? ' ' + dateRange : ''}`;
      }
      
      const periodValue = dateRange || (isCurrentConnection ? 'currently' : 'past');
      
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
            type: teamType === 'national' ? 'national_team' : 'teammate',
            description: description,
            team: middleName,
            period: periodValue
          }
        }],
        totalSteps: 1,
        searchTime,
        score: calculateScore(1, searchTime),
        startPlayer,
        endPlayer
      };
      console.log('Sending game result with period:', gameResult.path[0].connection.period);
      await session.close();
      return NextResponse.json(gameResult);
    }
    
    // For longer paths
    const pathQuery = `
      MATCH (p1:Player {id: $startPlayerId}), (p2:Player {id: $endPlayerId})
      MATCH path = shortestPath((p1)-[*..12]-(p2))
      WITH path, 
           [n in nodes(path) | {
             id: n.id,
             name: n.name,
             labels: labels(n),
             nationality: CASE WHEN 'Player' IN labels(n) THEN n.nationality ELSE null END,
             position: CASE WHEN 'Player' IN labels(n) THEN n.position ELSE null END
           }] as nodeDetails,
           [r in relationships(path) | {
             type: type(r),
             startDate: r.start_date,
             endDate: r.end_date
           }] as relDetails
      RETURN nodeDetails, relDetails, length(path) as pathLength
      ORDER BY pathLength
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
    
    // Process the path to create meaningful connections
    const formattedPath: PathStep[] = [];
    
    // Find all players in the path
    const playerIndices: number[] = [];
    nodeDetails.forEach((node, index) => {
      if (node.labels.includes('Player')) {
        playerIndices.push(index);
      }
    });
    
    // Create connections between consecutive players
    for (let i = 0; i < playerIndices.length - 1; i++) {
      const currentPlayerIndex = playerIndices[i];
      const nextPlayerIndex = playerIndices[i + 1];
      const currentPlayer = nodeDetails[currentPlayerIndex];
      const nextPlayer = nodeDetails[nextPlayerIndex];
      
      // Analyze what's between these two players
      const nodesBetween = nodeDetails.slice(currentPlayerIndex + 1, nextPlayerIndex);
      
      let description = '';
      let connectionType: 'teammate' | 'national_team' | 'manager' = 'teammate';
      let teamName = '';
      let period = 'past'; // Default to past for multi-step connections
      
      if (nodesBetween.length === 1) {
        // Direct connection through team/national team
        const middleNode = nodesBetween[0];
        const isNationalTeam = middleNode.labels.includes('NationalTeam');
        
        connectionType = isNationalTeam ? 'national_team' : 'teammate';
        teamName = middleNode.name;
        
        // Try to get relationship dates for better period info
        if (currentPlayerIndex < relDetails.length && currentPlayerIndex + 1 < relDetails.length) {
          const rel1 = relDetails[currentPlayerIndex];
          const rel2 = relDetails[currentPlayerIndex + 1];
          
          // If we have date information, use it
          if (rel1?.startDate && rel2?.startDate) {
            const overlapStart = rel1.startDate > rel2.startDate ? rel1.startDate : rel2.startDate;
            let overlapEnd = null;
            
            if (rel1.endDate && rel2.endDate) {
              overlapEnd = rel1.endDate < rel2.endDate ? rel1.endDate : rel2.endDate;
            } else if (rel1.endDate) {
              overlapEnd = rel1.endDate;
            } else if (rel2.endDate) {
              overlapEnd = rel2.endDate;
            }
            
            const dateRange = getDateRangeText(overlapStart, overlapEnd);
            if (dateRange) {
              period = dateRange;
            }
          }
        }
        
        // Update description
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
          team: teamName,
          period: period
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
  let score = 1000;
  score -= (steps - 1) * 100;
  if (timeMs < 5000) {
    score += 50;
  }
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