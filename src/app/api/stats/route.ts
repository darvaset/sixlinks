import { NextResponse } from 'next/server';
import { getNeo4jDriver } from '@/lib/neo4j';

export async function GET() {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    // Get counts for all entities
    const countQuery = `
      MATCH (p:Player) WITH count(p) as playerCount
      MATCH (t:Team) WITH playerCount, count(t) as teamCount
      MATCH (m:Manager) WITH playerCount, teamCount, count(m) as managerCount
      RETURN playerCount, teamCount, managerCount
    `;
    
    const result = await session.run(countQuery);
    
    // Get leagues and player counts per league
    const leaguesQuery = `
      MATCH (p:Player)-[:PLAYED_FOR]->(t:Team)
      WHERE t.league IS NOT NULL
      WITH t.league as league, collect(DISTINCT p) as players
      RETURN league, size(players) as playerCount
      ORDER BY playerCount DESC
    `;
    
    const leaguesResult = await session.run(leaguesQuery);
    const leagues = leaguesResult.records.map(record => ({
      name: record.get('league'),
      playerCount: parseInt(record.get('playerCount').toString())
    }));
    
    // Get national teams
    const nationalTeamsQuery = `
      MATCH (p:Player)-[:REPRESENTS]->(nt:NationalTeam)
      WITH nt.name as team, collect(DISTINCT p) as players
      RETURN team, size(players) as playerCount
      ORDER BY playerCount DESC
      LIMIT 10
    `;
    
    const nationalTeamsResult = await session.run(nationalTeamsQuery);
    const nationalTeams = nationalTeamsResult.records.map(record => ({
      name: record.get('team'),
      playerCount: parseInt(record.get('playerCount').toString())
    }));
    
    if (result.records.length > 0) {
      const record = result.records[0];
      const stats = {
        players: parseInt(record.get('playerCount').toString()),
        teams: parseInt(record.get('teamCount').toString()),
        managers: parseInt(record.get('managerCount').toString()),
        totalConnections: 0,
        leagues: leagues,
        nationalTeams: nationalTeams
      };
      
      return NextResponse.json(stats);
    }
    
    // Default values if no data
    return NextResponse.json({
      players: 0,
      teams: 0,
      managers: 0,
      totalConnections: 0,
      leagues: [],
      nationalTeams: []
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}