// src/scripts/test-kane-saka.ts
import { PrismaClient } from '@prisma/client';
import { pathfinder } from '../lib/pathfinding';

const prisma = new PrismaClient();

async function testKaneToSaka() {
  console.log('⚽ Testing Harry Kane → Bukayo Saka connection\n');

  // Find both players
  const kane = await prisma.player.findFirst({
    where: { name: { contains: 'Harry Kane', mode: 'insensitive' } }
  });

  const saka = await prisma.player.findFirst({
    where: { name: { contains: 'Bukayo Saka', mode: 'insensitive' } }
  });

  if (!kane || !saka) {
    console.log('❌ Could not find players');
    return;
  }

  console.log(`Found players:`);
  console.log(`- ${kane.name} (ID: ${kane.id}, ${kane.nationality})`);
  console.log(`- ${saka.name} (ID: ${saka.id}, ${saka.nationality})`);

  // Test direct national team query
  console.log('\n🏴󐁧󐁢󐁥󐁮󐁧󐁿 Testing if they should be connected via England:');
  
  const englandPlayers = await prisma.player.findMany({
    where: {
      nationality: 'England',
      id: { in: [kane.id, saka.id] }
    }
  });

  console.log(`Both are England players: ${englandPlayers.length === 2 ? 'YES ✅' : 'NO ❌'}`);

  // Now test pathfinding
  console.log('\n🔍 Running pathfinding algorithm:');
  
  const startTime = Date.now();
  try {
    const result = await pathfinder.findPath(kane.id, saka.id);
    
    if (result.found) {
      console.log(`\n✅ Path found in ${result.searchTime}ms with ${result.totalSteps} steps:`);
      
      result.path.forEach((step, index) => {
        console.log(`\n   Step ${index + 1}: ${step.from.name} → ${step.to.name}`);
        console.log(`   Type: ${step.connection.type}`);
        console.log(`   Via: ${step.connection.description}`);
      });

      // Check if national team connection was used
      const usedNationalTeam = result.path.some(step => step.connection.type === 'national_team');
      
      if (!usedNationalTeam && result.totalSteps > 1) {
        console.log('\n⚠️  WARNING: Path found but did not use national team connection!');
        console.log('This suggests the national team logic might not be working correctly.');
      }
    } else {
      console.log(`❌ No path found in ${result.searchTime}ms`);
    }
  } catch (error) {
    console.error('Error during pathfinding:', error);
  }

  // Let's manually check what connections the algorithm would find for Kane
  console.log('\n🔬 Debugging: What connections does the algorithm see for Harry Kane?');
  
  // Simulate what getConnections would return
  const kaneWithTeams = await prisma.player.findUnique({
    where: { id: kane.id },
    include: {
      playerTeams: {
        include: { team: true }
      },
      playerManagers: {
        include: { manager: true }
      }
    }
  });

  if (kaneWithTeams) {
    console.log(`\nClub teammates: ${kaneWithTeams.playerTeams.length} teams`);
    
    // Check for England teammates
    const englandTeammates = await prisma.player.findMany({
      where: {
        nationality: 'England',
        id: { not: kane.id }
      },
      take: 5
    });

    console.log(`England teammates available: ${englandTeammates.length}`);
    console.log('Sample:', englandTeammates.map(p => p.name).join(', '));
    
    // Check if Saka is in the list
    const sakaInList = await prisma.player.findFirst({
      where: {
        nationality: 'England',
        id: saka.id
      }
    });
    
    console.log(`\nIs Saka in England players list? ${sakaInList ? 'YES ✅' : 'NO ❌'}`);
  }
}

testKaneToSaka()
  .catch(console.error)
  .finally(() => prisma.$disconnect());