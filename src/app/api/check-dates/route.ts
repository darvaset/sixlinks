import { NextRequest, NextResponse } from 'next/server';
import { getNeo4jDriver } from '@/lib/neo4j';

export async function GET(request: NextRequest) {
  const driver = getNeo4jDriver();
  const session = driver.session();

  try {
    // Check if relationships have date properties
    const checkQuery = `
      // Check PLAYED_FOR relationships
      MATCH (p:Player)-[r:PLAYED_FOR]->(t:Team)
      RETURN 
        p.name as playerName,
        t.name as teamName,
        r.start_date as startDate,
        r.end_date as endDate,
        'PLAYED_FOR' as relType
      LIMIT 5
      
      UNION
      
      // Check REPRESENTS relationships
      MATCH (p:Player)-[r:REPRESENTS]->(nt:NationalTeam)
      RETURN 
        p.name as playerName,
        nt.name as teamName,
        r.start_date as startDate,
        r.end_date as endDate,
        'REPRESENTS' as relType
      LIMIT 5
    `;
    
    const result = await session.run(checkQuery);
    
    const relationships = result.records.map(record => ({
      player: record.get('playerName'),
      team: record.get('teamName'),
      relationType: record.get('relType'),
      startDate: record.get('startDate'),
      endDate: record.get('endDate')
    }));
    
    // Also check the structure of a relationship
    const structureQuery = `
      MATCH (p:Player)-[r:PLAYED_FOR]->(t:Team)
      RETURN keys(r) as relationshipProperties
      LIMIT 1
    `;
    
    const structureResult = await session.run(structureQuery);
    const properties = structureResult.records.length > 0 
      ? structureResult.records[0].get('relationshipProperties')
      : [];
    
    return NextResponse.json({
      message: 'Database check results',
      relationshipProperties: properties,
      sampleRelationships: relationships,
      hasDates: relationships.some(r => r.startDate !== null)
    });

  } catch (error) {
    console.error('Check dates error:', error);
    return NextResponse.json(
      { error: 'Failed to check dates', details: error.message },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}