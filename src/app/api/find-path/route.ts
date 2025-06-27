import { NextRequest, NextResponse } from 'next/server';
import { getNeo4jDriver } from '@/lib/neo4j'; 
import { GameResult, PathStep, Player } from '@/types/game';

async function findConnectionPath(startPlayerId: number, endPlayerId: number) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  const startTime = Date.now();

  try {
    // Step 1: Fetch full details for the start and end players
    const playerDetailsQuery = `
      MATCH (p:Player) WHERE p.id IN [$startPlayerId, $endPlayerId]
      RETURN p as playerNode
    `;
    const playerDetailsResult = await session.run(playerDetailsQuery, { startPlayerId, endPlayerId });
    
    let startPlayer: Player | undefined, endPlayer: Player | undefined;
    playerDetailsResult.records.forEach(record => {
      const playerNode = record.get('playerNode').properties;
      if (playerNode && playerNode.id) {
        const player: Player = playerNode as Player;
        if (player.id === startPlayerId) startPlayer = player;
        else endPlayer = player;
      }
    });

    if (!startPlayer || !endPlayer) {
      return NextResponse.json({ error: 'One or both players could not be found.' }, { status: 404 });
    }

    // Step 2: Run the main pathfinding query
    const pathQuery = `
      MATCH (p1:Player {id: $startPlayerId})
      MATCH (p2:Player {id: $endPlayerId})
      MATCH path = shortestPath((p1)-[*..6]-(p2))
      RETURN 
        length(path) as totalSteps,
        nodes(path) as pathNodes,
        relationships(path) as pathRelationships
    `;
    const pathResult = await session.run(pathQuery, { startPlayerId, endPlayerId });
    const searchTime = Date.now() - startTime;

    if (pathResult.records.length === 0) {
      return NextResponse.json({
          found: false, path: [], totalSteps: 0, searchTime, score: 0, startPlayer, endPlayer,
          message: 'No connection found between these players within 6 degrees.'
      });
    }
    
    const record = pathResult.records[0];
    
    // --- FIX: Removed .toNumber() as the value is already a standard JavaScript number ---
    const totalSteps = record.get('totalSteps') ?? 0;
    
    const pathNodes = record.get('pathNodes') ?? [];
    const pathRelationships = record.get('pathRelationships') ?? [];
    
    // Step 3: Format the path for the frontend
    const formattedPath: PathStep[] = [];
    for (let i = 0; i < pathRelationships.length; i++) {
        const fromNode = pathNodes[i]?.properties;
        const toNode = pathNodes[i+1]?.properties;
        const relationship = pathRelationships[i];

        if (fromNode && toNode && relationship) {
            formattedPath.push({
                from: { id: fromNode.id, name: fromNode.name, type: 'player' },
                to: { id: toNode.id, name: toNode.name, type: 'player' },
                connection: {
                    type: 'teammate', // This can be made dynamic based on relationship.type
                    description: `Connected via ${relationship.type}`
                }
            });
        }
    }

    const gameResult: GameResult = {
        found: true,
        path: formattedPath,
        totalSteps: totalSteps,
        searchTime,
        score: 100, // You can implement dynamic scoring
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

/**
 * Handles POST requests from your main game UI.
 */
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

/**
 * Handles GET requests from typing a URL in the browser.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startId = searchParams.get('start');
  const endId = searchParams.get('end');
  if (!startId || !endId) {
    return NextResponse.json({ error: 'The "start" and "end" query parameters are required.' }, { status: 400 });
  }
  return findConnectionPath(Number(startId), Number(endId));
}