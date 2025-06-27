// src/scripts/test-pathfinding.ts
import { PrismaClient } from '@prisma/client';
import { pathfinder } from '../lib/pathfinding';

const prisma = new PrismaClient();

async function testPathfinding() {
  console.log('🧪 Testing pathfinding with national team connections...\n');

  // Test cases
  const testCases = [
    { from: 'Harry Kane', to: 'Bukayo Saka' },        // Should be 1 step (England)
    { from: 'Lionel Messi', to: 'Cristiano Ronaldo' }, // Should be interesting
    { from: 'Mohamed Salah', to: 'Kevin De Bruyne' }   // Should be 1-2 steps
  ];

  for (const test of testCases) {
    console.log(`\n🔍 Finding path: ${test.from} → ${test.to}`);
    
    try {
      // Find players
      const fromPlayer = await prisma.player.findFirst({
        where: { name: { contains: test.from, mode: 'insensitive' } }
      });
      
      const toPlayer = await prisma.player.findFirst({
        where: { name: { contains: test.to, mode: 'insensitive' } }
      });

      if (!fromPlayer || !toPlayer) {
        console.log(`❌ Could not find one of the players`);
        continue;
      }

      console.log(`Found: ${fromPlayer.name} (${fromPlayer.nationality}) → ${toPlayer.name} (${toPlayer.nationality})`);

      // Find path
      const startTime = Date.now();
      const result = await pathfinder.findPath(fromPlayer.id, toPlayer.id);
      
      if (result.found) {
        console.log(`✅ Path found in ${result.searchTime}ms with ${result.totalSteps} steps:`);
        
        result.path.forEach((step, index) => {
          console.log(`   Step ${index + 1}: ${step.from.name} → ${step.to.name}`);
          console.log(`           via ${step.connection.type}: ${step.connection.description}`);
        });
      } else {
        console.log(`❌ No path found in ${result.searchTime}ms`);
      }
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  }

  // Check for English players
  console.log('\n📊 Sample English players in database:');
  const englishPlayers = await prisma.player.findMany({
    where: { nationality: 'England' },
    take: 10
  });
  
  console.log(`Found ${englishPlayers.length} English players:`);
  englishPlayers.forEach(p => console.log(`   - ${p.name} (${p.position})`));
}

testPathfinding()
  .catch(console.error)
  .finally(() => prisma.$disconnect());