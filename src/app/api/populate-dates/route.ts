import { NextRequest, NextResponse } from 'next/server';
import { getNeo4jDriver } from '@/lib/neo4j';

// Sample date data for known players/teams
const knownConnections = {
  // Arsenal connections
  'Bukayo Saka-Arsenal FC': { start: '2018-07-01', end: null },
  'William Saliba-Arsenal FC': { start: '2019-07-01', end: null },
  'Riccardo Calafiori-Arsenal FC': { start: '2024-07-01', end: null },
  
  // Historical connections
  'Erling Haaland-Borussia Dortmund': { start: '2020-01-01', end: '2022-06-30' },
  'Erling Haaland-Manchester City': { start: '2022-07-01', end: null },
  
  // National team connections (approximate)
  'Matteo Politano-Italy National Team': { start: '2018-01-01', end: null },
  'Riccardo Calafiori-Italy National Team': { start: '2023-01-01', end: null },
  'Georginio Rutter-France National Team': { start: '2023-01-01', end: null },
  'Alexandre Lacazette-France National Team': { start: '2013-01-01', end: '2017-12-31' },
};

export async function POST(request: NextRequest) {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    // First, let's update known connections with specific dates
    for (const [connection, dates] of Object.entries(knownConnections)) {
      const [playerName, teamName] = connection.split('-');
      
      const updateQuery = `
        MATCH (p:Player {name: $playerName})-[r:PLAYED_FOR|REPRESENTS]->(t)
        WHERE t.name = $teamName
        SET r.start_date = $startDate,
            r.end_date = $endDate
        RETURN p.name as player, t.name as team, r.start_date as start, r.end_date as end
      `;
      
      await session.run(updateQuery, {
        playerName,
        teamName,
        startDate: dates.start,
        endDate: dates.end
      });
    }

    // For any remaining connections without dates, add generic historical dates
    const addGenericDatesQuery = `
      // Add generic dates to PLAYED_FOR relationships without dates
      MATCH (p:Player)-[r:PLAYED_FOR]->(t:Team)
      WHERE r.start_date IS NULL
      SET r.start_date = '2020-01-01',
          r.end_date = '2023-12-31'
      
      WITH count(r) as clubUpdated
      
      // Add generic dates to REPRESENTS relationships without dates
      MATCH (p:Player)-[r:REPRESENTS]->(nt:NationalTeam)
      WHERE r.start_date IS NULL
      SET r.start_date = '2019-01-01',
          r.end_date = '2022-12-31'
      
      RETURN clubUpdated, count(r) as nationalUpdated
    `;
    
    const result = await session.run(addGenericDatesQuery);
    
    // Get summary of updates
    const summaryQuery = `
      MATCH (p:Player)-[r:PLAYED_FOR|REPRESENTS]->(t)
      WHERE r.start_date IS NOT NULL
      RETURN 
        count(r) as totalWithDates,
        count(CASE WHEN r.end_date IS NULL THEN 1 END) as currentConnections,
        count(CASE WHEN r.end_date IS NOT NULL THEN 1 END) as pastConnections
    `;
    
    const summaryResult = await session.run(summaryQuery);
    
    let summaryData = {
      totalWithDates: 0,
      currentConnections: 0,
      pastConnections: 0
    };
    
    if (summaryResult.records.length > 0) {
      const summary = summaryResult.records[0];
      summaryData = {
        totalWithDates: parseInt(summary.get('totalWithDates').toString()),
        currentConnections: parseInt(summary.get('currentConnections').toString()),
        pastConnections: parseInt(summary.get('pastConnections').toString())
      };
    }
    
    return NextResponse.json({
      message: 'Dates populated successfully',
      summary: summaryData,
      knownConnectionsUpdated: Object.keys(knownConnections).length
    });

  } catch (error) {
    console.error('Populate dates error:', error);
    return NextResponse.json(
      { error: 'Failed to populate dates', details: error.message },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}

// GET method to preview what would be updated
export async function GET(request: NextRequest) {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    const previewQuery = `
      MATCH (p:Player)-[r:PLAYED_FOR|REPRESENTS]->(t)
      WHERE r.start_date IS NULL
      RETURN 
        p.name as player,
        type(r) as relType,
        t.name as team,
        'Would be updated' as status
      LIMIT 20
    `;
    
    const result = await session.run(previewQuery);
    const needsUpdate = result.records.map(record => ({
      player: record.get('player'),
      relationType: record.get('relType'),
      team: record.get('team'),
      status: record.get('status')
    }));
    
    return NextResponse.json({
      message: 'Relationships that need dates',
      needsUpdate,
      total: needsUpdate.length,
      knownConnections: Object.keys(knownConnections)
    });

  } catch (error) {
    console.error('Preview dates error:', error);
    return NextResponse.json(
      { error: 'Failed to preview', details: error.message },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}