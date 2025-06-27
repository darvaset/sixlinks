// src/scripts/check-data-stats.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDataStats() {
  console.log('📊 Checking data statistics for Neo4j migration...\n');

  const stats = await prisma.$transaction([
    prisma.player.count(),
    prisma.team.count(),
    prisma.manager.count(),
    prisma.playerTeam.count(),
    prisma.playerManager.count(),
    prisma.managerTeam.count()
  ]);

  console.log('NODE COUNTS:');
  console.log(`  Players: ${stats[0].toLocaleString()}`);
  console.log(`  Teams: ${stats[1].toLocaleString()}`);
  console.log(`  Managers: ${stats[2].toLocaleString()}`);
  console.log(`  Total Nodes: ${(stats[0] + stats[1] + stats[2]).toLocaleString()}`);

  console.log('\nRELATIONSHIP COUNTS:');
  console.log(`  Player-Team: ${stats[3].toLocaleString()}`);
  console.log(`  Player-Manager: ${stats[4].toLocaleString()}`);
  console.log(`  Manager-Team: ${stats[5].toLocaleString()}`);
  
  // Calculate potential national team relationships
  const nationalityGroups = await prisma.player.groupBy({
    by: ['nationality'],
    _count: true,
    where: {
      nationality: { not: null }
    }
  });

  let potentialNationalConnections = 0;
  nationalityGroups.forEach(group => {
    // Each player can connect to n-1 others in their nationality
    potentialNationalConnections += group._count * (group._count - 1);
  });

  console.log(`  Potential National Team connections: ${potentialNationalConnections.toLocaleString()}`);
  console.log(`  Total Relationships: ${(stats[3] + stats[4] + stats[5] + potentialNationalConnections).toLocaleString()}`);

  // Check Neo4j limits
  const totalNodes = stats[0] + stats[1] + stats[2];
  const totalRelationships = stats[3] + stats[4] + stats[5] + potentialNationalConnections;

  console.log('\n🚀 NEO4J AURADB FREE TIER LIMITS:');
  console.log(`  Max Nodes: 200,000 (Using: ${((totalNodes / 200000) * 100).toFixed(2)}%)`);
  console.log(`  Max Relationships: 400,000 (Using: ${((totalRelationships / 400000) * 100).toFixed(2)}%)`);

  if (totalNodes > 200000 || totalRelationships > 400000) {
    console.log('\n⚠️  WARNING: Data exceeds Neo4j free tier limits!');
  } else {
    console.log('\n✅ Data fits within Neo4j free tier limits!');
  }

  // Sample data structure check
  console.log('\n🔍 SAMPLE DATA STRUCTURE:');
  
  const samplePlayer = await prisma.player.findFirst({
    where: { name: { contains: 'Harry Kane' } },
    include: {
      playerTeams: {
        include: { team: true },
        take: 2
      },
      playerManagers: {
        include: { manager: true },
        take: 2
      }
    }
  });

  if (samplePlayer) {
    console.log(`\nSample Player: ${samplePlayer.name}`);
    console.log(`  ID: ${samplePlayer.id}`);
    console.log(`  Nationality: ${samplePlayer.nationality}`);
    console.log(`  Position: ${samplePlayer.position}`);
    console.log(`  Teams: ${samplePlayer.playerTeams.map(pt => pt.team.name).join(', ')}`);
    console.log(`  Managers: ${samplePlayer.playerManagers.map(pm => pm.manager.name).join(', ') || 'None'}`);
  }

  // Check for data quality
  console.log('\n✅ DATA QUALITY CHECK:');
  const playersWithoutNationality = await prisma.player.count({
    where: { nationality: null }
  });
  const playersWithoutTeams = await prisma.player.count({
    where: {
      playerTeams: { none: {} }
    }
  });

  console.log(`  Players without nationality: ${playersWithoutNationality}`);
  console.log(`  Players without teams: ${playersWithoutTeams}`);
}

checkDataStats()
  .catch(console.error)
  .finally(() => prisma.$disconnect());