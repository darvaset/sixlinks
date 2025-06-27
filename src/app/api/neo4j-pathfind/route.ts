// src/app/api/neo4j-pathfind/route.ts
import { NextRequest, NextResponse } from 'next/server';
import neo4j from 'neo4j-driver';


// Initialize Neo4j driver
const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
);

export async function POST(request: NextRequest) {
  const session = driver.session();
  
  try {
    const { player1Name, player2Name } = await request.json();
    
    if (!player1Name || !player2Name) {
      return NextResponse.json(
        { error: 'Both player names are required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Find the shortest path between two players
    const result = await session.run(
      `
      MATCH (p1:Player {name: $player1Name})
      MATCH (p2:Player {name: $player2Name})
      MATCH path = shortestPath((p1)-[*..6]-(p2))
      RETURN 
        path,
        length(path) as pathLength,
        [node in nodes(path) | {
          name: node.name,
          type: labels(node)[0],
          nationality: node.nationality,
          position: node.position
        }] as nodes,
        [rel in relationships(path) | {
          type: type(rel),
          startDate: rel.startDate,
          endDate: rel.endDate,
          current: rel.current
        }] as relationships
      `,
      { player1Name, player2Name }
    );

    const searchTime = Date.now() - startTime;

    if (result.records.length === 0) {
      // Try to find the players to give better error messages
      const player1Exists = await session.run(
        'MATCH (p:Player {name: $name}) RETURN p',
        { name: player1Name }
      );
      
      const player2Exists = await session.run(
        'MATCH (p:Player {name: $name}) RETURN p',
        { name: player2Name }
      );

      if (player1Exists.records.length === 0) {
        return NextResponse.json(
          { error: `Player "${player1Name}" not found` },
          { status: 404 }
        );
      }
      
      if (player2Exists.records.length === 0) {
        return NextResponse.json(
          { error: `Player "${player2Name}" not found` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        found: false,
        message: 'No path found between these players within 6 degrees',
        searchTime
      });
    }

    const record = result.records[0];
    const nodes = record.get('nodes');
    const relationships = record.get('relationships');
    const pathLength = record.get('pathLength').toNumber();

    // Format the path for the frontend
    const formattedPath = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const fromNode = nodes[i];
      const toNode = nodes[i + 1];
      const relationship = relationships[i];

      // Determine connection description
      let description = '';
      if (relationship.type === 'PLAYED_FOR') {
        description = `Teammates at ${toNode.type === 'Team' ? toNode.name : fromNode.name}`;
      } else if (relationship.type === 'REPRESENTS') {
        const nationalTeam = fromNode.type === 'NationalTeam' ? fromNode : toNode;
        description = nationalTeam.name;
      } else if (relationship.type === 'MANAGED_BY' || relationship.type === 'MANAGED') {
        description = `Manager connection`;
      }

      formattedPath.push({
        from: {
          name: fromNode.name,
          type: fromNode.type.toLowerCase(),
          nationality: fromNode.nationality,
          position: fromNode.position
        },
        to: {
          name: toNode.name,
          type: toNode.type.toLowerCase(),
          nationality: toNode.nationality,
          position: toNode.position
        },
        connection: {
          type: relationship.type.toLowerCase().replace('_', '-'),
          description: description
        }
      });
    }

    return NextResponse.json({
      found: true,
      path: formattedPath,
      totalSteps: pathLength / 2, // Neo4j counts relationships, we want connections
      searchTime,
      performanceNote: `Neo4j query completed in ${searchTime}ms`
    });

  } catch (error) {
    console.error('Neo4j query error:', error);
    return NextResponse.json(
      { error: 'Failed to find path', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}

// Optional: GET endpoint to search for players
export async function GET(request: NextRequest) {
  const session = driver.session();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json({ players: [] });
    }

    const result = await session.run(
      `
      MATCH (p:Player)
      WHERE p.name CONTAINS $query
      RETURN p.name as name, p.nationality as nationality, p.position as position
      ORDER BY p.name
      LIMIT 10
      `,
      { query }
    );

    const players = result.records.map(record => ({
      name: record.get('name'),
      nationality: record.get('nationality'),
      position: record.get('position')
    }));

    return NextResponse.json({ players });

  } catch (error) {
    console.error('Neo4j search error:', error);
    return NextResponse.json({ players: [] });
  } finally {
    await session.close();
  }
}