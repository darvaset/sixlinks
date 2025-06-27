// src/lib/neo4j.ts
import neo4j, { Driver } from 'neo4j-driver';

let driver: Driver | null = null;

export function getNeo4jDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !username || !password) {
      throw new Error('Neo4j credentials not configured');
    }

    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(username, password),
      {
        maxConnectionLifetime: 3600000, // 1 hour
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2000,
        disableLosslessIntegers: true
      }
    );
  }

  return driver;
}

// Cleanup function for graceful shutdown
export async function closeNeo4jDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}